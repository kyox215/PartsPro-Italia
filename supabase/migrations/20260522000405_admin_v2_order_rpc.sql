-- Admin v2 order RPC contract, first low-risk batch.
-- These functions return the standard mutation envelope used by src/admin:
-- { ok: true, data } or { ok: false, error: { code, message, details } }.

create or replace function public.admin_v2_ok(p_data jsonb default '{}'::jsonb)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('ok', true, 'data', coalesce(p_data, '{}'::jsonb));
$$;

create or replace function public.admin_v2_error(
  p_code text,
  p_message text,
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'ok',
    false,
    'error',
    jsonb_build_object(
      'code',
      p_code,
      'message',
      p_message,
      'details',
      coalesce(p_details, '{}'::jsonb)
    )
  );
$$;

create or replace function public.admin_v2_update_stripe_checkout(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_session_id text := nullif(payload->>'stripe_checkout_session_id', '');
  v_payment_intent_id text := nullif(payload->>'stripe_payment_intent_id', '');
  v_updated record;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if v_session_id is null then
    return public.admin_v2_error(
      'STRIPE_CHECKOUT_SESSION_REQUIRED',
      'stripe_checkout_session_id is required'
    );
  end if;

  update public.orders
  set stripe_checkout_session_id = v_session_id,
      stripe_payment_intent_id = v_payment_intent_id,
      updated_at = now()
  where id = v_order_id
  returning id,
            stripe_checkout_session_id,
            stripe_payment_intent_id,
            updated_at
  into v_updated;

  if v_updated.id is null then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
  end if;

  return public.admin_v2_ok(
    jsonb_build_object(
      'order_id',
      v_updated.id,
      'stripe_checkout_session_id',
      v_updated.stripe_checkout_session_id,
      'stripe_payment_intent_id',
      v_updated.stripe_payment_intent_id,
      'updated_at',
      v_updated.updated_at
    )
  );
end;
$$;

create or replace function public.admin_v2_append_order_timeline(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_event_type text := nullif(payload->>'event_type', '');
  v_title text := nullif(payload->>'title', '');
  v_body text := nullif(payload->>'body', '');
  v_actor_profile_id uuid := nullif(payload->>'actor_profile_id', '')::uuid;
  v_customer_visible boolean := coalesce((payload->>'customer_visible')::boolean, true);
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_event record;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if not exists (select 1 from public.orders where id = v_order_id) then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
  end if;

  if v_event_type is null then
    return public.admin_v2_error('TIMELINE_EVENT_TYPE_REQUIRED', 'event_type is required');
  end if;

  if v_title is null then
    return public.admin_v2_error('TIMELINE_TITLE_REQUIRED', 'title is required');
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    return public.admin_v2_error(
      'TIMELINE_METADATA_INVALID',
      'metadata must be a JSON object'
    );
  end if;

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
    v_event_type,
    v_title,
    v_body,
    v_actor_profile_id,
    v_customer_visible,
    v_metadata
  )
  returning id,
            order_id,
            event_type,
            title,
            body,
            actor_profile_id,
            customer_visible,
            metadata,
            created_at
  into v_event;

  return public.admin_v2_ok(to_jsonb(v_event));
end;
$$;

create or replace function public.admin_v2_update_order_status(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_status text := nullif(payload->>'status', '');
  v_updated record;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if v_status is null then
    return public.admin_v2_error('ORDER_STATUS_REQUIRED', 'status is required');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typnamespace = 'public'::regnamespace
      and t.typname = 'order_status'
      and e.enumlabel = v_status
  ) then
    return public.admin_v2_error(
      'ORDER_STATUS_UNSUPPORTED',
      'status is not supported',
      jsonb_build_object('status', v_status)
    );
  end if;

  update public.orders
  set status = v_status::public.order_status,
      updated_at = now()
  where id = v_order_id
  returning id,
            status,
            updated_at
  into v_updated;

  if v_updated.id is null then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
  end if;

  return public.admin_v2_ok(
    jsonb_build_object(
      'order_id',
      v_updated.id,
      'status',
      v_updated.status,
      'updated_at',
      v_updated.updated_at
    )
  );
end;
$$;

revoke all on function public.admin_v2_ok(jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_v2_error(text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_v2_update_stripe_checkout(jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_v2_append_order_timeline(jsonb)
  from public, anon, authenticated;
revoke all on function public.admin_v2_update_order_status(jsonb)
  from public, anon, authenticated;

grant execute on function public.admin_v2_ok(jsonb)
  to service_role;
grant execute on function public.admin_v2_error(text, text, jsonb)
  to service_role;
grant execute on function public.admin_v2_update_stripe_checkout(jsonb)
  to service_role;
grant execute on function public.admin_v2_append_order_timeline(jsonb)
  to service_role;
grant execute on function public.admin_v2_update_order_status(jsonb)
  to service_role;
