-- PartsPro admin v2 order RPC draft.
-- This file is documentation-first and is not an active migration.
-- When promoting it, create a real migration with:
--   supabase migration new admin_v2_order_rpc
-- Then copy reviewed functions into the generated migration and verify locally/remotely.

-- Design rules:
-- 1. Every function accepts one jsonb payload argument named payload.
-- 2. Every function returns { ok: true, data } or { ok: false, error }.
-- 3. Functions are exposed only to service_role.
-- 4. No security definer functions are used in public schema.
-- 5. External provider side effects, such as Stripe API calls, stay in Next.js services.

create or replace function public.admin_v2_ok(data jsonb)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('ok', true, 'data', coalesce(data, '{}'::jsonb));
$$;

create or replace function public.admin_v2_error(
  code text,
  message text,
  details jsonb default '{}'::jsonb
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'ok', false,
    'error', jsonb_build_object(
      'code', coalesce(code, 'UNKNOWN_ERROR'),
      'message', coalesce(message, 'Unknown error'),
      'details', coalesce(details, '{}'::jsonb)
    )
  );
$$;

create or replace function public.admin_v2_create_order(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_result jsonb;
begin
  -- Phase 1 compatibility wrapper. Later phase can inline the full transaction
  -- and remove dependency on create_order_with_reservations.
  v_result := public.create_order_with_reservations(payload);
  return public.admin_v2_ok(v_result);
exception
  when others then
    return public.admin_v2_error(
      'ORDER_CREATE_FAILED',
      sqlerrm,
      jsonb_build_object('sqlstate', sqlstate)
    );
end;
$$;

create or replace function public.admin_v2_release_inventory(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := public.release_order_reservations(
    nullif(payload->>'order_id', '')::uuid,
    coalesce(nullif(payload->>'payment_status', ''), 'cancelled'),
    coalesce(nullif(payload->>'status', '')::public.order_status, 'cancelled'::public.order_status),
    coalesce(nullif(payload->>'note', ''), 'Order reservation released')
  );

  return public.admin_v2_ok(v_result);
exception
  when others then
    return public.admin_v2_error(
      'ORDER_RELEASE_FAILED',
      sqlerrm,
      jsonb_build_object('sqlstate', sqlstate)
    );
end;
$$;

create or replace function public.admin_v2_update_order_status(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_status public.order_status := nullif(payload->>'status', '')::public.order_status;
begin
  update public.orders
  set status = v_status,
      updated_at = now()
  where id = v_order_id;

  if not found then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order not found');
  end if;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    metadata
  )
  values (
    v_order_id,
    'status_updated',
    'Status updated to ' || v_status::text,
    'Admin manually changed the order status.',
    nullif(payload->>'actor_profile_id', '')::uuid,
    jsonb_build_object('status', v_status::text, 'source', 'admin_v2_update_order_status')
  );

  return public.admin_v2_ok(jsonb_build_object('order_id', v_order_id, 'status', v_status::text));
exception
  when others then
    return public.admin_v2_error(
      'ORDER_STATUS_UPDATE_FAILED',
      sqlerrm,
      jsonb_build_object('sqlstate', sqlstate)
    );
end;
$$;

create or replace function public.admin_v2_confirm_payment(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_expected_method text := nullif(payload->>'expected_method', '');
  v_now timestamptz := now();
begin
  select *
  into v_order
  from public.orders
  where id = v_order_id
  for update;

  if not found then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order not found');
  end if;

  if v_expected_method in ('cash', 'bank_transfer') and v_order.payment_method <> v_expected_method then
    return public.admin_v2_error(
      'PAYMENT_METHOD_MISMATCH',
      'Order payment method is ' || coalesce(v_order.payment_method, '-') || ', not ' || v_expected_method
    );
  end if;

  update public.orders
  set status = 'paid'::public.order_status,
      payment_status = 'paid',
      paid_at = v_now,
      stripe_checkout_session_id = coalesce(nullif(payload->>'stripe_checkout_session_id', ''), stripe_checkout_session_id),
      stripe_payment_intent_id = coalesce(nullif(payload->>'stripe_payment_intent_id', ''), stripe_payment_intent_id),
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
    coalesce(v_order.payment_method, v_expected_method),
    'paid',
    coalesce(v_order.total, 0),
    coalesce(v_order.currency, 'EUR'),
    case when v_expected_method = 'stripe' then 'stripe' else 'manual' end,
    coalesce(nullif(payload->>'stripe_payment_intent_id', ''), nullif(payload->>'stripe_checkout_session_id', '')),
    nullif(payload->>'actor_profile_id', '')::uuid,
    coalesce(nullif(payload->>'note', ''), 'Payment marked paid'),
    jsonb_build_object('source', 'admin_v2_confirm_payment')
  );

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    metadata
  )
  values (
    v_order_id,
    'payment_paid',
    coalesce(nullif(payload->>'note', ''), 'Payment marked paid'),
    'Payment confirmed.',
    nullif(payload->>'actor_profile_id', '')::uuid,
    jsonb_build_object('paymentMethod', coalesce(v_order.payment_method, v_expected_method))
  );

  return public.admin_v2_ok(jsonb_build_object('order_id', v_order_id, 'payment_status', 'paid'));
exception
  when others then
    return public.admin_v2_error(
      'ORDER_PAYMENT_CONFIRM_FAILED',
      sqlerrm,
      jsonb_build_object('sqlstate', sqlstate)
    );
end;
$$;

create or replace function public.admin_v2_update_stripe_checkout(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
begin
  update public.orders
  set stripe_checkout_session_id = nullif(payload->>'stripe_checkout_session_id', ''),
      stripe_payment_intent_id = nullif(payload->>'stripe_payment_intent_id', ''),
      updated_at = now()
  where id = v_order_id;

  if not found then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order not found');
  end if;

  return public.admin_v2_ok(jsonb_build_object('order_id', v_order_id));
exception
  when others then
    return public.admin_v2_error('ORDER_STRIPE_CHECKOUT_UPDATE_FAILED', sqlerrm);
end;
$$;

create or replace function public.admin_v2_add_payment_proof(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_payment_record_id uuid;
begin
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
    nullif(payload->>'order_id', '')::uuid,
    nullif(payload->>'payment_method', ''),
    nullif(payload->>'payment_status', ''),
    coalesce((payload->>'amount')::numeric, 0),
    coalesce(nullif(payload->>'currency', ''), 'EUR'),
    coalesce(nullif(payload->>'provider', ''), 'manual'),
    nullif(payload->>'provider_reference', ''),
    nullif(payload->>'proof_url', ''),
    nullif(payload->>'proof_label', ''),
    nullif(payload->>'recorded_by', '')::uuid,
    nullif(payload->>'note', ''),
    jsonb_build_object('source', 'admin_v2_add_payment_proof')
  )
  returning id into v_payment_record_id;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    metadata
  )
  values (
    nullif(payload->>'order_id', '')::uuid,
    'payment_proof_added',
    'Payment proof added',
    coalesce(nullif(payload->>'timeline_body', ''), nullif(payload->>'note', ''), 'Payment proof/reference recorded.'),
    nullif(payload->>'recorded_by', '')::uuid,
    jsonb_build_object(
      'paymentRecordId', v_payment_record_id,
      'paymentMethod', payload->>'payment_method',
      'paymentStatus', payload->>'payment_status'
    )
  );

  return public.admin_v2_ok(jsonb_build_object('payment_record_id', v_payment_record_id));
exception
  when others then
    return public.admin_v2_error('ORDER_PAYMENT_PROOF_FAILED', sqlerrm);
end;
$$;

create or replace function public.admin_v2_ship_order(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_shipped_at timestamptz := case
    when nullif(payload->>'tracking_number', '') is not null
      or nullif(payload->>'tracking_url', '') is not null
    then now()
    else null
  end;
begin
  update public.orders
  set shipping_carrier = nullif(payload->>'shipping_carrier', ''),
      tracking_number = nullif(payload->>'tracking_number', ''),
      tracking_url = nullif(payload->>'tracking_url', ''),
      shipment_note = nullif(payload->>'shipment_note', ''),
      customer_note = nullif(payload->>'customer_note', ''),
      shipped_at = v_shipped_at,
      status = case when v_shipped_at is not null then 'shipped'::public.order_status else status end,
      updated_at = now()
  where id = v_order_id;

  if not found then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order not found');
  end if;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    metadata
  )
  values (
    v_order_id,
    'shipment_updated',
    'Shipment information updated',
    coalesce(nullif(payload->>'customer_note', ''), nullif(payload->>'shipment_note', ''), 'Shipment information updated.'),
    nullif(payload->>'actor_profile_id', '')::uuid,
    jsonb_build_object(
      'shippingCarrier', payload->>'shipping_carrier',
      'trackingNumber', payload->>'tracking_number',
      'trackingUrl', payload->>'tracking_url'
    )
  );

  return public.admin_v2_ok(jsonb_build_object('order_id', v_order_id, 'shipped_at', v_shipped_at));
exception
  when others then
    return public.admin_v2_error('ORDER_SHIPMENT_UPDATE_FAILED', sqlerrm);
end;
$$;

create or replace function public.admin_v2_append_order_timeline(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_event_id uuid;
begin
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
    nullif(payload->>'order_id', '')::uuid,
    nullif(payload->>'event_type', ''),
    nullif(payload->>'title', ''),
    nullif(payload->>'body', ''),
    nullif(payload->>'actor_profile_id', '')::uuid,
    coalesce((payload->>'customer_visible')::boolean, true),
    coalesce(payload->'metadata', '{}'::jsonb)
  )
  returning id into v_event_id;

  return public.admin_v2_ok(jsonb_build_object('event_id', v_event_id));
exception
  when others then
    return public.admin_v2_error('ORDER_TIMELINE_APPEND_FAILED', sqlerrm);
end;
$$;

-- Refund v2 note:
-- Stripe refunds must remain in application code because they call Stripe.
-- This RPC records the database side after the provider action succeeds, or
-- records a manual cash/bank refund.
create or replace function public.admin_v2_refund_order(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_refund_id uuid;
  v_amount numeric(12, 2) := coalesce((payload->>'amount')::numeric, 0);
  v_now timestamptz := now();
begin
  select *
  into v_order
  from public.orders
  where id = nullif(payload->>'order_id', '')::uuid
  for update;

  if not found then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order not found');
  end if;

  if v_amount <= 0 then
    return public.admin_v2_error('INVALID_REFUND_AMOUNT', 'Refund amount must be greater than zero');
  end if;

  insert into public.order_refunds (
    order_id,
    payment_method,
    amount,
    currency,
    reason,
    note,
    provider,
    provider_refund_id,
    provider_payment_intent_id,
    provider_status,
    status,
    recorded_by,
    metadata
  )
  values (
    v_order.id,
    coalesce(v_order.payment_method, 'bank_transfer'),
    v_amount,
    coalesce(v_order.currency, 'EUR'),
    coalesce(nullif(payload->>'reason', ''), 'requested_by_customer'),
    nullif(payload->>'note', ''),
    coalesce(nullif(payload->>'provider', ''), 'manual'),
    nullif(payload->>'provider_reference', ''),
    nullif(payload->>'provider_payment_intent_id', ''),
    nullif(payload->>'provider_status', ''),
    coalesce(nullif(payload->>'status', ''), 'succeeded'),
    nullif(payload->>'actor_profile_id', '')::uuid,
    jsonb_build_object('source', 'admin_v2_refund_order')
  )
  returning id into v_refund_id;

  update public.orders
  set refund_total = coalesce(refund_total, 0) + v_amount,
      payment_status = case
        when coalesce(refund_total, 0) + v_amount >= coalesce(total, 0) then 'refunded'
        else 'partially_refunded'
      end,
      refunded_at = case
        when coalesce(refund_total, 0) + v_amount >= coalesce(total, 0) then v_now
        else refunded_at
      end,
      updated_at = v_now
  where id = v_order.id;

  insert into public.order_timeline_events (
    order_id,
    event_type,
    title,
    body,
    actor_profile_id,
    metadata
  )
  values (
    v_order.id,
    'refund_recorded',
    'Refund recorded',
    'Refund recorded.',
    nullif(payload->>'actor_profile_id', '')::uuid,
    jsonb_build_object('refundId', v_refund_id, 'amount', v_amount)
  );

  return public.admin_v2_ok(jsonb_build_object('refund_id', v_refund_id, 'amount', v_amount));
exception
  when others then
    return public.admin_v2_error('ORDER_REFUND_FAILED', sqlerrm);
end;
$$;

create or replace function public.admin_v2_sync_stripe_refund_status(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_refund record;
begin
  select *
  into v_refund
  from public.order_refunds
  where provider_refund_id = nullif(payload->>'stripe_refund_id', '')
  for update;

  if not found then
    return public.admin_v2_ok(jsonb_build_object('updated', false, 'reason', 'not_found'));
  end if;

  update public.order_refunds
  set status = case
        when payload->>'stripe_status' in ('succeeded') then 'succeeded'
        when payload->>'stripe_status' in ('failed') then 'failed'
        when payload->>'stripe_status' in ('canceled', 'cancelled') then 'cancelled'
        else 'pending'
      end,
      provider_status = nullif(payload->>'stripe_status', ''),
      provider_payment_intent_id = nullif(payload->>'stripe_payment_intent_id', ''),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'stripeStatus', payload->>'stripe_status',
        'failureReason', payload->>'failure_reason',
        'source', 'admin_v2_sync_stripe_refund_status'
      ),
      updated_at = now()
  where id = v_refund.id;

  return public.admin_v2_ok(jsonb_build_object('updated', true, 'refund_id', v_refund.id));
exception
  when others then
    return public.admin_v2_error('ORDER_REFUND_SYNC_FAILED', sqlerrm);
end;
$$;

create or replace function public.admin_v2_release_expired_inventory(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_result jsonb;
  v_processed integer := 0;
  v_released integer := 0;
  v_limit integer := coalesce((payload->>'limit')::integer, 100);
begin
  for v_order in
    select id
    from public.orders
    where payment_status in ('pending_card', 'pending_cash', 'pending_bank_transfer')
      and released_at is null
      and reservation_expires_at < now()
    order by reservation_expires_at asc
    limit greatest(1, least(v_limit, 500))
  loop
    v_result := public.release_order_reservations(
      v_order.id,
      'cancelled',
      'cancelled'::public.order_status,
      'Reservation expired after 24 hours'
    );
    v_processed := v_processed + 1;
    v_released := v_released + coalesce((v_result->>'released')::integer, 0);
  end loop;

  return public.admin_v2_ok(jsonb_build_object('processed', v_processed, 'released', v_released));
exception
  when others then
    return public.admin_v2_error('ORDER_EXPIRED_RESERVATIONS_RELEASE_FAILED', sqlerrm);
end;
$$;

revoke all on function public.admin_v2_ok(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_error(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_create_order(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_release_inventory(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_update_order_status(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_confirm_payment(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_update_stripe_checkout(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_add_payment_proof(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_ship_order(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_append_order_timeline(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_refund_order(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_sync_stripe_refund_status(jsonb) from public, anon, authenticated;
revoke all on function public.admin_v2_release_expired_inventory(jsonb) from public, anon, authenticated;

grant execute on function public.admin_v2_ok(jsonb) to service_role;
grant execute on function public.admin_v2_error(text, text, jsonb) to service_role;
grant execute on function public.admin_v2_create_order(jsonb) to service_role;
grant execute on function public.admin_v2_release_inventory(jsonb) to service_role;
grant execute on function public.admin_v2_update_order_status(jsonb) to service_role;
grant execute on function public.admin_v2_confirm_payment(jsonb) to service_role;
grant execute on function public.admin_v2_update_stripe_checkout(jsonb) to service_role;
grant execute on function public.admin_v2_add_payment_proof(jsonb) to service_role;
grant execute on function public.admin_v2_ship_order(jsonb) to service_role;
grant execute on function public.admin_v2_append_order_timeline(jsonb) to service_role;
grant execute on function public.admin_v2_refund_order(jsonb) to service_role;
grant execute on function public.admin_v2_sync_stripe_refund_status(jsonb) to service_role;
grant execute on function public.admin_v2_release_expired_inventory(jsonb) to service_role;
