create table if not exists public.order_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  sku_id uuid not null references public.skus(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  warehouse_code text not null default 'MAIN',
  source text not null check (source in ('stock', 'incoming')),
  quantity integer not null check (quantity > 0),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_inventory_reservations_order_idx
  on public.order_inventory_reservations (order_id, released_at);

create index if not exists order_inventory_reservations_inventory_idx
  on public.order_inventory_reservations (inventory_id, source, released_at);

alter table public.order_inventory_reservations enable row level security;

drop policy if exists "order_inventory_reservations_admin_only" on public.order_inventory_reservations;
create policy "order_inventory_reservations_admin_only"
on public.order_inventory_reservations for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

grant select, insert, update on public.order_inventory_reservations to authenticated;

insert into public.order_inventory_reservations (
  order_id,
  order_item_id,
  sku_id,
  inventory_id,
  warehouse_code,
  source,
  quantity,
  created_at,
  updated_at
)
select
  oi.order_id,
  oi.id,
  s.id,
  i.id,
  i.warehouse_code,
  'stock',
  oi.stock_qty,
  oi.created_at,
  now()
from public.order_items oi
join public.skus s on s.sku = oi.sku
join public.inventory i on i.sku_id = s.id and i.warehouse_code = 'MAIN'
where coalesce(oi.stock_qty, 0) > 0
  and not exists (
    select 1
    from public.order_inventory_reservations existing
    where existing.order_item_id = oi.id
      and existing.source = 'stock'
  );

insert into public.order_inventory_reservations (
  order_id,
  order_item_id,
  sku_id,
  inventory_id,
  warehouse_code,
  source,
  quantity,
  created_at,
  updated_at
)
select
  oi.order_id,
  oi.id,
  s.id,
  i.id,
  i.warehouse_code,
  'incoming',
  oi.preorder_qty,
  oi.created_at,
  now()
from public.order_items oi
join public.skus s on s.sku = oi.sku
join public.inventory i on i.sku_id = s.id and i.warehouse_code = 'MAIN'
where coalesce(oi.preorder_qty, 0) > 0
  and not exists (
    select 1
    from public.order_inventory_reservations existing
    where existing.order_item_id = oi.id
      and existing.source = 'incoming'
  );

drop function if exists public.allocate_order_preorders(uuid);
drop function if exists public.ship_or_pickup_order(uuid, text);
drop function if exists public.complete_order_workflow(uuid);

create or replace function public.create_order_with_reservations(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid := coalesce(nullif(payload->>'order_id', '')::uuid, gen_random_uuid());
  v_order_number text;
  v_profile_id uuid := nullif(payload->>'profile_id', '')::uuid;
  v_status public.order_status := coalesce(nullif(payload->>'status', '')::public.order_status, 'draft'::public.order_status);
  v_payment_status text := coalesce(nullif(payload->>'payment_status', ''), 'pending_bank_transfer');
  v_payment_method text := nullif(payload->>'payment_method', '');
  v_reserved_at timestamptz := coalesce(nullif(payload->>'reserved_at', '')::timestamptz, now());
  v_reservation_expires_at timestamptz := coalesce(
    nullif(payload->>'reservation_expires_at', '')::timestamptz,
    v_reserved_at + interval '24 hours'
  );
  v_line jsonb;
  v_inventory record;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_vat_rate numeric(4, 2);
  v_available_stock integer;
  v_available_incoming integer;
  v_stock_qty integer;
  v_incoming_qty integer;
  v_preorder_min integer;
  v_preorder_max integer;
  v_line_subtotal numeric(12, 2);
  v_line_vat numeric(12, 2);
  v_order_item_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_vat numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_line_count integer := 0;
begin
  if v_profile_id is null then
    raise exception 'profile_id is required';
  end if;

  if v_payment_method not in ('stripe', 'cash', 'bank_transfer') then
    raise exception 'Unsupported payment method: %', coalesce(v_payment_method, '-');
  end if;

  if jsonb_typeof(payload->'lines') <> 'array' or jsonb_array_length(payload->'lines') = 0 then
    raise exception 'Order lines are required';
  end if;

  v_order_number := public.next_order_number(v_reserved_at);

  insert into public.orders (
    id,
    order_number,
    profile_id,
    status,
    payment_status,
    reservation_expires_at,
    reserved_at,
    payment_method,
    email,
    customer_name,
    company_name,
    vat_number,
    fiscal_code,
    sdi,
    pec,
    shipping_address,
    subtotal,
    vat,
    total,
    currency,
    metadata
  )
  values (
    v_order_id,
    v_order_number,
    v_profile_id,
    v_status,
    v_payment_status,
    v_reservation_expires_at,
    v_reserved_at,
    v_payment_method,
    nullif(payload->>'email', ''),
    nullif(payload->>'customer_name', ''),
    nullif(payload->>'company_name', ''),
    nullif(payload->>'vat_number', ''),
    nullif(payload->>'fiscal_code', ''),
    nullif(payload->>'sdi', ''),
    nullif(payload->>'pec', ''),
    nullif(payload->>'shipping_address', ''),
    0,
    0,
    0,
    coalesce(nullif(payload->>'currency', ''), 'EUR'),
    coalesce(payload->'metadata', '{}'::jsonb)
  );

  for v_line in
    select value
    from jsonb_array_elements(payload->'lines')
  loop
    v_quantity := coalesce((v_line->>'quantity')::integer, 0);
    v_unit_price := coalesce((v_line->>'unit_price')::numeric, 0);
    v_vat_rate := coalesce((v_line->>'vat_rate')::numeric, 0.22);

    if v_quantity <= 0 then
      raise exception 'Invalid quantity for SKU %', coalesce(v_line->>'sku', '-');
    end if;

    if v_unit_price < 0 then
      raise exception 'Invalid unit price for SKU %', coalesce(v_line->>'sku', '-');
    end if;

    select
      i.id as inventory_id,
      i.sku_id,
      i.warehouse_code,
      i.stock_on_hand,
      i.stock_reserved,
      i.incoming_qty,
      i.incoming_reserved,
      s.sku,
      s.moq,
      s.preorder_lead_time_min_days,
      s.preorder_lead_time_max_days,
      p.name_it
    into v_inventory
    from public.inventory i
    join public.skus s on s.id = i.sku_id
    left join public.products p on p.id = s.product_id
    where i.id = nullif(v_line->>'inventory_id', '')::uuid
      and s.id = nullif(v_line->>'sku_id', '')::uuid
      and s.sku = nullif(v_line->>'sku', '')
      and i.warehouse_code = 'MAIN'
      and s.is_active = true
    for update of i;

    if not found then
      raise exception 'Inventory row missing for SKU %', coalesce(v_line->>'sku', '-');
    end if;

    if v_quantity < coalesce(v_inventory.moq, 1) then
      raise exception 'SKU % requires MOQ %', v_inventory.sku, coalesce(v_inventory.moq, 1);
    end if;

    v_available_stock := greatest(
      coalesce(v_inventory.stock_on_hand, 0) - coalesce(v_inventory.stock_reserved, 0),
      0
    );
    v_available_incoming := greatest(
      coalesce(v_inventory.incoming_qty, 0) - coalesce(v_inventory.incoming_reserved, 0),
      0
    );

    if v_quantity > v_available_stock + v_available_incoming then
      raise exception 'SKU % has only % available/incoming units',
        v_inventory.sku,
        v_available_stock + v_available_incoming;
    end if;

    v_stock_qty := least(v_quantity, v_available_stock);
    v_incoming_qty := v_quantity - v_stock_qty;
    v_preorder_min := case
      when v_incoming_qty > 0 then coalesce(v_inventory.preorder_lead_time_min_days, 7)
      else null
    end;
    v_preorder_max := case
      when v_incoming_qty > 0 then coalesce(v_inventory.preorder_lead_time_max_days, 14)
      else null
    end;

    update public.inventory
    set
      stock_reserved = stock_reserved + v_stock_qty,
      incoming_reserved = incoming_reserved + v_incoming_qty,
      updated_at = now()
    where id = v_inventory.inventory_id;

    if v_stock_qty > 0 then
      insert into public.inventory_movements (
        sku_id,
        order_id,
        movement_type,
        quantity,
        reserved_delta,
        note,
        metadata
      )
      values (
        v_inventory.sku_id,
        v_order_id,
        'reserve_stock',
        v_stock_qty,
        v_stock_qty,
        'Order stock reservation',
        jsonb_build_object('source', 'create_order_with_reservations')
      );
    end if;

    if v_incoming_qty > 0 then
      insert into public.inventory_movements (
        sku_id,
        order_id,
        movement_type,
        quantity,
        incoming_reserved_delta,
        note,
        metadata
      )
      values (
        v_inventory.sku_id,
        v_order_id,
        'reserve_incoming',
        v_incoming_qty,
        v_incoming_qty,
        'Order incoming reservation',
        jsonb_build_object('source', 'create_order_with_reservations')
      );
    end if;

    v_line_subtotal := round(v_unit_price * v_quantity, 2);
    v_line_vat := round(v_line_subtotal * v_vat_rate, 2);
    v_subtotal := v_subtotal + v_line_subtotal;
    v_vat := v_vat + v_line_vat;
    v_line_count := v_line_count + 1;

    insert into public.order_items (
      order_id,
      sku,
      name,
      quantity,
      unit_price,
      vat_rate,
      preorder_lead_time_min_days,
      preorder_lead_time_max_days
    )
    values (
      v_order_id,
      v_inventory.sku,
      coalesce(nullif(v_line->>'name', ''), v_inventory.name_it, v_inventory.sku),
      v_quantity,
      v_unit_price,
      v_vat_rate,
      v_preorder_min,
      v_preorder_max
    )
    returning id into v_order_item_id;

    if v_stock_qty > 0 then
      insert into public.order_inventory_reservations (
        order_id,
        order_item_id,
        sku_id,
        inventory_id,
        warehouse_code,
        source,
        quantity
      )
      values (
        v_order_id,
        v_order_item_id,
        v_inventory.sku_id,
        v_inventory.inventory_id,
        v_inventory.warehouse_code,
        'stock',
        v_stock_qty
      );
    end if;

    if v_incoming_qty > 0 then
      insert into public.order_inventory_reservations (
        order_id,
        order_item_id,
        sku_id,
        inventory_id,
        warehouse_code,
        source,
        quantity
      )
      values (
        v_order_id,
        v_order_item_id,
        v_inventory.sku_id,
        v_inventory.inventory_id,
        v_inventory.warehouse_code,
        'incoming',
        v_incoming_qty
      );
    end if;
  end loop;

  v_total := round(v_subtotal + v_vat, 2);

  update public.orders
  set
    subtotal = v_subtotal,
    vat = v_vat,
    total = v_total,
    updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'vat', v_vat,
    'total', v_total,
    'line_count', v_line_count,
    'reservation_expires_at', v_reservation_expires_at
  );
end;
$$;

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
  v_reservation record;
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

  for v_reservation in
    select
      r.id,
      r.sku_id,
      r.inventory_id,
      r.source,
      r.quantity
    from public.order_inventory_reservations r
    join public.inventory i on i.id = r.inventory_id
    where r.order_id = p_order_id
      and r.released_at is null
    order by r.inventory_id, r.id
    for update of r, i
  loop
    update public.inventory
    set
      stock_reserved = case
        when v_reservation.source = 'stock'
        then greatest(coalesce(stock_reserved, 0) - v_reservation.quantity, 0)
        else stock_reserved
      end,
      incoming_reserved = case
        when v_reservation.source = 'incoming'
        then greatest(coalesce(incoming_reserved, 0) - v_reservation.quantity, 0)
        else incoming_reserved
      end,
      updated_at = v_now
    where id = v_reservation.inventory_id;

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
      v_reservation.sku_id,
      p_order_id,
      'release_reservation',
      v_reservation.quantity,
      case when v_reservation.source = 'stock' then -v_reservation.quantity else 0 end,
      case when v_reservation.source = 'incoming' then -v_reservation.quantity else 0 end,
      p_note,
      jsonb_build_object('source', 'release_order_reservations', 'reservation_source', v_reservation.source)
    );

    update public.order_inventory_reservations
    set
      released_at = v_now,
      updated_at = v_now
    where id = v_reservation.id;

    v_released := v_released + v_reservation.quantity;
  end loop;

  update public.orders
  set
    status = p_order_status,
    payment_status = p_payment_status,
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

revoke all on function public.create_order_with_reservations(jsonb)
from public, anon, authenticated;

grant execute on function public.create_order_with_reservations(jsonb)
to service_role;

revoke all on function public.release_order_reservations(uuid, text, public.order_status, text)
from public, anon, authenticated;

grant execute on function public.release_order_reservations(uuid, text, public.order_status, text)
to service_role;

drop index if exists orders_fulfillment_status_idx;

alter table public.orders
  drop constraint if exists orders_fulfillment_status_check;

alter table public.order_items
  drop constraint if exists order_items_fulfillment_type_check;

alter table public.orders
  drop column if exists fulfillment_status,
  drop column if exists fulfilled_at;

alter table public.order_items
  drop column if exists fulfillment_type,
  drop column if exists stock_qty,
  drop column if exists preorder_qty;

alter table public.staff_members
  drop constraint if exists staff_members_role_check;

alter table public.staff_members
  add constraint staff_members_role_check
  check (role ~ '^[a-z][a-z0-9_-]{1,40}$');

alter table public.staff_role_permissions
  drop constraint if exists staff_role_permissions_role_check;

alter table public.staff_role_permissions
  add constraint staff_role_permissions_role_check
  check (role <> 'owner' and role ~ '^[a-z][a-z0-9_-]{1,40}$');

delete from public.staff_role_permissions
where permission = 'rma:write';

alter table public.staff_role_permissions
  drop constraint if exists staff_role_permissions_permission_check;

alter table public.staff_role_permissions
  add constraint staff_role_permissions_permission_check
  check (
    permission in (
      'admin:access',
      'accounts:read',
      'accounts:write',
      'staff:manage',
      'audit:read',
      'products:write',
      'inventory:write',
      'orders:write',
      'payments:confirm',
      'system:read'
    )
  );
