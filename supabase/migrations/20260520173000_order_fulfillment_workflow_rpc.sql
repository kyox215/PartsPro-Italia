create or replace function public.release_order_reservations(
  p_order_id uuid,
  p_payment_status text default 'cancelled',
  p_order_status public.order_status default 'cancelled'::public.order_status,
  p_note text default 'Order reservation released'
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_stock_qty integer;
  v_preorder_qty integer;
  v_released integer := 0;
  v_now timestamptz := now();
begin
  if p_order_id is null then
    raise exception 'order_id is required';
  end if;

  if p_payment_status not in (
    'pending_card',
    'pending_cash',
    'pending_bank_transfer',
    'paid',
    'failed',
    'cancelled',
    'refunded'
  ) then
    raise exception 'Unsupported payment status: %', coalesce(p_payment_status, '-');
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'released', 0,
      'skipped', true,
      'reason', 'not_found'
    );
  end if;

  if v_order.released_at is not null then
    return jsonb_build_object(
      'released', 0,
      'skipped', true,
      'reason', 'already_released'
    );
  end if;

  if v_order.fulfilled_at is not null then
    return jsonb_build_object(
      'released', 0,
      'skipped', true,
      'reason', 'already_fulfilled'
    );
  end if;

  for v_item in
    select
      oi.id as order_item_id,
      oi.sku,
      oi.stock_qty,
      oi.preorder_qty,
      s.id as sku_id,
      i.id as inventory_id,
      i.stock_reserved,
      i.incoming_reserved
    from public.order_items oi
    join public.skus s on s.sku = oi.sku
    join public.inventory i on i.sku_id = s.id and i.warehouse_code = 'MAIN'
    where oi.order_id = p_order_id
    order by i.id, oi.id
    for update of i
  loop
    v_stock_qty := greatest(coalesce(v_item.stock_qty, 0), 0);
    v_preorder_qty := greatest(coalesce(v_item.preorder_qty, 0), 0);

    if v_stock_qty <= 0 and v_preorder_qty <= 0 then
      continue;
    end if;

    update public.inventory
    set
      stock_reserved = greatest(coalesce(stock_reserved, 0) - v_stock_qty, 0),
      incoming_reserved = greatest(coalesce(incoming_reserved, 0) - v_preorder_qty, 0),
      updated_at = v_now
    where id = v_item.inventory_id;

    insert into public.inventory_movements (
      sku_id,
      order_id,
      movement_type,
      quantity,
      reserved_delta,
      incoming_reserved_delta,
      note,
      metadata
    )
    values (
      v_item.sku_id,
      p_order_id,
      'release_reservation',
      v_stock_qty + v_preorder_qty,
      -v_stock_qty,
      -v_preorder_qty,
      p_note,
      jsonb_build_object('source', 'release_order_reservations')
    );

    v_released := v_released + v_stock_qty + v_preorder_qty;
  end loop;

  update public.orders
  set
    status = p_order_status,
    payment_status = p_payment_status,
    fulfillment_status = 'cancelled',
    released_at = v_now,
    cancelled_at = v_now,
    updated_at = v_now,
    admin_note = p_note
  where id = p_order_id;

  return jsonb_build_object(
    'released', v_released,
    'skipped', false
  );
end;
$$;

create or replace function public.allocate_order_preorders(p_order_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_preorder_qty integer;
  v_available_stock integer;
  v_allocated integer := 0;
  v_remaining_preorder integer := 0;
  v_now timestamptz := now();
begin
  if p_order_id is null then
    raise exception 'order_id is required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.released_at is not null then
    raise exception 'Order reservation has already been released.';
  end if;

  if v_order.fulfilled_at is not null then
    return jsonb_build_object(
      'allocated', 0,
      'skipped', true,
      'reason', 'already_fulfilled'
    );
  end if;

  for v_item in
    select
      oi.id as order_item_id,
      oi.sku,
      oi.stock_qty,
      oi.preorder_qty,
      s.id as sku_id,
      i.id as inventory_id,
      i.stock_on_hand,
      i.stock_reserved,
      i.incoming_reserved
    from public.order_items oi
    join public.skus s on s.sku = oi.sku
    join public.inventory i on i.sku_id = s.id and i.warehouse_code = 'MAIN'
    where oi.order_id = p_order_id
      and coalesce(oi.preorder_qty, 0) > 0
    order by i.id, oi.id
    for update of oi, i
  loop
    v_preorder_qty := greatest(coalesce(v_item.preorder_qty, 0), 0);
    if v_preorder_qty <= 0 then
      continue;
    end if;

    v_available_stock := greatest(
      coalesce(v_item.stock_on_hand, 0) - coalesce(v_item.stock_reserved, 0),
      0
    );

    if v_available_stock < v_preorder_qty then
      raise exception 'SKU % needs % arrived units, only % available.',
        v_item.sku,
        v_preorder_qty,
        v_available_stock;
    end if;

    update public.inventory
    set
      stock_reserved = coalesce(stock_reserved, 0) + v_preorder_qty,
      incoming_reserved = greatest(coalesce(incoming_reserved, 0) - v_preorder_qty, 0),
      updated_at = v_now
    where id = v_item.inventory_id;

    update public.order_items
    set
      stock_qty = coalesce(stock_qty, 0) + v_preorder_qty,
      preorder_qty = 0,
      fulfillment_type = 'stock'
    where id = v_item.order_item_id;

    insert into public.inventory_movements (
      sku_id,
      order_id,
      movement_type,
      quantity,
      reserved_delta,
      incoming_reserved_delta,
      note,
      metadata
    )
    values (
      v_item.sku_id,
      p_order_id,
      'allocate_preorder',
      v_preorder_qty,
      v_preorder_qty,
      -v_preorder_qty,
      'Arrived preorder stock allocated to order',
      jsonb_build_object('source', 'allocate_order_preorders')
    );

    v_allocated := v_allocated + v_preorder_qty;
  end loop;

  select coalesce(sum(coalesce(preorder_qty, 0)), 0)
  into v_remaining_preorder
  from public.order_items
  where order_id = p_order_id;

  update public.orders
  set
    fulfillment_status = case
      when v_remaining_preorder > 0 then 'awaiting_preorder'
      else 'reserved'
    end,
    updated_at = v_now,
    admin_note = case
      when v_allocated > 0 then 'Allocated ' || v_allocated::text || ' preorder units'
      else 'No preorder units to allocate'
    end
  where id = p_order_id;

  return jsonb_build_object(
    'allocated', v_allocated,
    'remaining_preorder', v_remaining_preorder,
    'skipped', false
  );
end;
$$;

create or replace function public.ship_or_pickup_order(
  p_order_id uuid,
  p_mode text
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_qty integer;
  v_remaining_preorder integer;
  v_deducted integer := 0;
  v_now timestamptz := now();
begin
  if p_order_id is null then
    raise exception 'order_id is required';
  end if;

  if p_mode not in ('shipped', 'picked_up') then
    raise exception 'Unsupported fulfillment mode: %', coalesce(p_mode, '-');
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.released_at is not null then
    raise exception 'Order reservation has already been released.';
  end if;

  if v_order.fulfilled_at is not null then
    return jsonb_build_object(
      'deducted', 0,
      'skipped', true,
      'reason', 'already_fulfilled'
    );
  end if;

  select coalesce(sum(coalesce(preorder_qty, 0)), 0)
  into v_remaining_preorder
  from public.order_items
  where order_id = p_order_id;

  if v_remaining_preorder > 0 then
    raise exception 'Allocate preorder stock before shipping or pickup.';
  end if;

  for v_item in
    select
      oi.id as order_item_id,
      oi.sku,
      oi.quantity,
      oi.stock_qty,
      s.id as sku_id,
      i.id as inventory_id,
      i.stock_on_hand,
      i.stock_reserved
    from public.order_items oi
    join public.skus s on s.sku = oi.sku
    join public.inventory i on i.sku_id = s.id and i.warehouse_code = 'MAIN'
    where oi.order_id = p_order_id
    order by i.id, oi.id
    for update of i
  loop
    v_qty := greatest(coalesce(v_item.stock_qty, v_item.quantity, 0), 0);
    if v_qty <= 0 then
      continue;
    end if;

    if coalesce(v_item.stock_on_hand, 0) < v_qty then
      raise exception 'SKU % has insufficient physical stock to ship.',
        v_item.sku;
    end if;

    update public.inventory
    set
      stock_on_hand = greatest(coalesce(stock_on_hand, 0) - v_qty, 0),
      stock_reserved = greatest(coalesce(stock_reserved, 0) - v_qty, 0),
      updated_at = v_now
    where id = v_item.inventory_id;

    insert into public.inventory_movements (
      sku_id,
      order_id,
      movement_type,
      quantity,
      stock_delta,
      reserved_delta,
      note,
      metadata
    )
    values (
      v_item.sku_id,
      p_order_id,
      'ship_stock',
      v_qty,
      -v_qty,
      -v_qty,
      case when p_mode = 'shipped' then 'Order shipped' else 'Order picked up' end,
      jsonb_build_object('source', 'ship_or_pickup_order', 'mode', p_mode)
    );

    v_deducted := v_deducted + v_qty;
  end loop;

  update public.orders
  set
    status = case
      when p_mode = 'shipped' then 'shipped'::public.order_status
      else 'completed'::public.order_status
    end,
    fulfillment_status = p_mode,
    fulfilled_at = v_now,
    updated_at = v_now
  where id = p_order_id;

  return jsonb_build_object(
    'deducted', v_deducted,
    'mode', p_mode,
    'skipped', false
  );
end;
$$;

create or replace function public.complete_order_workflow(p_order_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order record;
  v_now timestamptz := now();
begin
  if p_order_id is null then
    raise exception 'order_id is required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.released_at is not null then
    raise exception 'Order reservation has already been released.';
  end if;

  update public.orders
  set
    status = 'completed',
    fulfillment_status = 'completed',
    updated_at = v_now
  where id = p_order_id;

  return jsonb_build_object(
    'completed', true,
    'order_id', p_order_id
  );
end;
$$;

revoke all on function public.release_order_reservations(uuid, text, public.order_status, text)
  from public, anon, authenticated;
revoke all on function public.allocate_order_preorders(uuid)
  from public, anon, authenticated;
revoke all on function public.ship_or_pickup_order(uuid, text)
  from public, anon, authenticated;
revoke all on function public.complete_order_workflow(uuid)
  from public, anon, authenticated;

grant execute on function public.release_order_reservations(uuid, text, public.order_status, text)
  to service_role;
grant execute on function public.allocate_order_preorders(uuid)
  to service_role;
grant execute on function public.ship_or_pickup_order(uuid, text)
  to service_role;
grant execute on function public.complete_order_workflow(uuid)
  to service_role;
