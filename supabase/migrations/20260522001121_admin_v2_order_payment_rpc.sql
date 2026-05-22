-- Admin v2 order payment RPCs.
-- Keeps payment mutations transactional while the service layer remains
-- responsible for customer notification dispatch.

create or replace function public.admin_v2_confirm_payment(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_expected_method text := nullif(payload->>'expected_method', '');
  v_actor_profile_id uuid := nullif(payload->>'actor_profile_id', '')::uuid;
  v_checkout_session_id text := nullif(payload->>'stripe_checkout_session_id', '');
  v_payment_intent_id text := nullif(payload->>'stripe_payment_intent_id', '');
  v_provider_reference text := coalesce(v_payment_intent_id, v_checkout_session_id);
  v_note text;
  v_now timestamptz := now();
  v_order record;
  v_payment_record_id uuid;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if v_expected_method not in ('cash', 'bank_transfer', 'stripe') then
    return public.admin_v2_error(
      'PAYMENT_METHOD_UNSUPPORTED',
      'expected_method is not supported',
      jsonb_build_object('expected_method', v_expected_method)
    );
  end if;

  select id,
         payment_method,
         total,
         currency
  into v_order
  from public.orders
  where id = v_order_id
  for update;

  if v_order.id is null then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
  end if;

  if v_order.payment_method <> v_expected_method then
    return public.admin_v2_error(
      'PAYMENT_METHOD_MISMATCH',
      'Order payment method does not match expected_method',
      jsonb_build_object(
        'actual_method',
        v_order.payment_method,
        'expected_method',
        v_expected_method
      )
    );
  end if;

  v_note := coalesce(
    nullif(payload->>'note', ''),
    case
      when v_expected_method = 'cash' then 'Cash payment confirmed by admin'
      when v_expected_method = 'bank_transfer' then 'Bank transfer confirmed by admin'
      else 'Stripe payment confirmed'
    end
  );

  update public.orders
  set status = 'paid'::public.order_status,
      payment_status = 'paid',
      paid_at = coalesce(paid_at, v_now),
      stripe_checkout_session_id = coalesce(v_checkout_session_id, stripe_checkout_session_id),
      stripe_payment_intent_id = coalesce(v_payment_intent_id, stripe_payment_intent_id),
      admin_note = v_note,
      updated_at = v_now
  where id = v_order_id;

  insert into public.order_payment_records (
    order_id,
    payment_method,
    payment_status,
    amount,
    currency,
    provider,
    provider_reference,
    recorded_by,
    note,
    metadata
  )
  values (
    v_order_id,
    v_expected_method,
    'paid',
    coalesce(v_order.total, 0),
    coalesce(v_order.currency, 'EUR'),
    case when v_expected_method = 'stripe' then 'stripe' else v_expected_method end,
    v_provider_reference,
    v_actor_profile_id,
    v_note,
    jsonb_build_object(
      'source',
      case when v_expected_method = 'stripe' then 'stripe_webhook' else 'admin_manual' end,
      'stripeCheckoutSessionId',
      v_checkout_session_id,
      'stripePaymentIntentId',
      v_payment_intent_id
    )
  )
  returning id
  into v_payment_record_id;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    customer_visible,
    metadata
  )
  values (
    v_order_id,
    'payment_paid',
    v_note,
    format(
      'Payment confirmed for %s %s.',
      to_char(coalesce(v_order.total, 0), 'FM9999999990.00'),
      coalesce(v_order.currency, 'EUR')
    ),
    v_actor_profile_id,
    true,
    jsonb_build_object(
      'paymentMethod',
      v_expected_method,
      'stripeCheckoutSessionId',
      v_checkout_session_id,
      'stripePaymentIntentId',
      v_payment_intent_id,
      'paymentRecordId',
      v_payment_record_id
    )
  );

  return public.admin_v2_ok(
    jsonb_build_object(
      'order_id',
      v_order_id,
      'payment_method',
      v_expected_method,
      'payment_status',
      'paid',
      'payment_record_id',
      v_payment_record_id,
      'paid_at',
      v_now
    )
  );
end;
$$;

create or replace function public.admin_v2_add_payment_proof(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_payment_method text := nullif(payload->>'payment_method', '');
  v_payment_status text := nullif(payload->>'payment_status', '');
  v_amount numeric := coalesce((payload->>'amount')::numeric, 0);
  v_currency text := null;
  v_provider text := nullif(payload->>'provider', '');
  v_provider_reference text := nullif(payload->>'provider_reference', '');
  v_proof_url text := nullif(payload->>'proof_url', '');
  v_proof_label text := nullif(payload->>'proof_label', '');
  v_recorded_by uuid := nullif(payload->>'recorded_by', '')::uuid;
  v_note text := nullif(payload->>'note', '');
  v_timeline_body text := nullif(payload->>'timeline_body', '');
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_order record;
  v_payment_record_id uuid;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if v_payment_method not in ('stripe', 'cash', 'bank_transfer') then
    return public.admin_v2_error(
      'PAYMENT_METHOD_UNSUPPORTED',
      'payment_method is not supported',
      jsonb_build_object('payment_method', v_payment_method)
    );
  end if;

  if v_payment_status not in (
    'pending_card',
    'pending_cash',
    'pending_bank_transfer',
    'paid',
    'failed',
    'cancelled',
    'refunded'
  ) then
    return public.admin_v2_error(
      'PAYMENT_STATUS_UNSUPPORTED',
      'payment_status is not supported',
      jsonb_build_object('payment_status', v_payment_status)
    );
  end if;

  if v_amount < 0 then
    return public.admin_v2_error(
      'PAYMENT_AMOUNT_INVALID',
      'amount must be greater than or equal to 0'
    );
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    return public.admin_v2_error(
      'PAYMENT_METADATA_INVALID',
      'metadata must be a JSON object'
    );
  end if;

  select id,
         currency
  into v_order
  from public.orders
  where id = v_order_id;

  if v_order.id is null then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
  end if;

  v_currency := coalesce(nullif(payload->>'currency', ''), v_order.currency, 'EUR');
  v_provider := coalesce(v_provider, case when v_payment_method = 'stripe' then 'stripe' else 'manual' end);
  v_note := coalesce(v_note, 'Payment proof recorded');
  v_timeline_body := coalesce(
    v_timeline_body,
    nullif(payload->>'note', ''),
    v_proof_label,
    'Admin added a payment proof/reference.'
  );

  insert into public.order_payment_records (
    order_id,
    payment_method,
    payment_status,
    amount,
    currency,
    provider,
    provider_reference,
    proof_url,
    proof_label,
    recorded_by,
    note,
    metadata
  )
  values (
    v_order_id,
    v_payment_method,
    v_payment_status,
    v_amount,
    v_currency,
    v_provider,
    v_provider_reference,
    v_proof_url,
    v_proof_label,
    v_recorded_by,
    v_note,
    v_metadata || jsonb_build_object(
      'source',
      'admin_payment_proof',
      'proofUrl',
      v_proof_url,
      'proofLabel',
      v_proof_label
    )
  )
  returning id
  into v_payment_record_id;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    customer_visible,
    metadata
  )
  values (
    v_order_id,
    'payment_proof_added',
    'Payment proof added',
    v_timeline_body,
    v_recorded_by,
    true,
    jsonb_build_object(
      'paymentMethod',
      v_payment_method,
      'paymentStatus',
      v_payment_status,
      'amount',
      v_amount,
      'providerReference',
      v_provider_reference,
      'proofUrl',
      v_proof_url,
      'proofLabel',
      v_proof_label,
      'paymentRecordId',
      v_payment_record_id
    )
  );

  return public.admin_v2_ok(
    jsonb_build_object(
      'payment_method',
      v_payment_method,
      'payment_status',
      v_payment_status,
      'amount',
      v_amount,
      'provider_reference',
      v_provider_reference,
      'proof_url',
      v_proof_url,
      'proof_label',
      v_proof_label,
      'payment_record_id',
      v_payment_record_id
    )
  );
end;
$$;

revoke all on function public.admin_v2_confirm_payment(jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_v2_add_payment_proof(jsonb)
  from public, anon, authenticated;

grant execute on function public.admin_v2_confirm_payment(jsonb)
  to service_role;
grant execute on function public.admin_v2_add_payment_proof(jsonb)
  to service_role;
