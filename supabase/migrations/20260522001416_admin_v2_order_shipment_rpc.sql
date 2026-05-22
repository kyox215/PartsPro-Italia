-- Admin v2 order shipment RPC.
-- Writes shipment fields and timeline; service layer dispatches customer notifications.

create or replace function public.admin_v2_ship_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(payload->>'order_id', '')::uuid;
  v_actor_profile_id uuid := nullif(payload->>'actor_profile_id', '')::uuid;
  v_shipping_carrier text := nullif(payload->>'shipping_carrier', '');
  v_tracking_number text := nullif(payload->>'tracking_number', '');
  v_tracking_url text := nullif(payload->>'tracking_url', '');
  v_shipment_note text := nullif(payload->>'shipment_note', '');
  v_customer_note text := nullif(payload->>'customer_note', '');
  v_now timestamptz := now();
  v_shipped_at timestamptz := null;
  v_updated record;
begin
  if v_order_id is null then
    return public.admin_v2_error('ORDER_ID_REQUIRED', 'order_id is required');
  end if;

  if v_tracking_number is not null or v_tracking_url is not null then
    v_shipped_at := v_now;
  end if;

  update public.orders
  set shipping_carrier = v_shipping_carrier,
      tracking_number = v_tracking_number,
      tracking_url = v_tracking_url,
      shipment_note = v_shipment_note,
      customer_note = v_customer_note,
      shipped_at = v_shipped_at,
      status = case
        when v_shipped_at is not null then 'shipped'::public.order_status
        else status
      end,
      updated_at = v_now
  where id = v_order_id
  returning id,
            status,
            shipping_carrier,
            tracking_number,
            tracking_url,
            shipment_note,
            customer_note,
            shipped_at,
            updated_at
  into v_updated;

  if v_updated.id is null then
    return public.admin_v2_error('ORDER_NOT_FOUND', 'Order was not found');
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
    'shipment_updated',
    'Shipment information updated',
    coalesce(
      v_customer_note,
      v_shipment_note,
      nullif(concat_ws(' / ', v_shipping_carrier, v_tracking_number), ''),
      'Admin updated shipment information.'
    ),
    v_actor_profile_id,
    true,
    jsonb_build_object(
      'shippingCarrier',
      v_shipping_carrier,
      'trackingNumber',
      v_tracking_number,
      'trackingUrl',
      v_tracking_url,
      'shipmentNote',
      v_shipment_note,
      'customerNote',
      v_customer_note,
      'shippedAt',
      v_shipped_at
    )
  );

  return public.admin_v2_ok(
    jsonb_build_object(
      'order_id',
      v_updated.id,
      'status',
      v_updated.status,
      'shipping_carrier',
      v_updated.shipping_carrier,
      'tracking_number',
      v_updated.tracking_number,
      'tracking_url',
      v_updated.tracking_url,
      'shipment_note',
      v_updated.shipment_note,
      'customer_note',
      v_updated.customer_note,
      'shipped_at',
      v_updated.shipped_at,
      'updated_at',
      v_updated.updated_at
    )
  );
end;
$$;

revoke all on function public.admin_v2_ship_order(jsonb)
  from public, anon, authenticated;

grant execute on function public.admin_v2_ship_order(jsonb)
  to service_role;
