alter table public.orders
  add column if not exists order_number text;

create table if not exists public.order_number_sequences (
  order_date date primary key,
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.order_number_sequences enable row level security;

revoke all on public.order_number_sequences from anon, authenticated;
grant select, insert, update on public.order_number_sequences to service_role;

create or replace function public.next_order_number(p_created_at timestamptz default now())
returns text
language plpgsql
set search_path = public
as $$
declare
  v_order_date date := (p_created_at at time zone 'Europe/Rome')::date;
  v_next integer;
begin
  insert into public.order_number_sequences (order_date, last_value, updated_at)
  values (v_order_date, 1, now())
  on conflict (order_date)
  do update
    set last_value = public.order_number_sequences.last_value + 1,
        updated_at = now()
  returning last_value into v_next;

  return 'PP-' || to_char(v_order_date, 'YYMMDD') || '-' || lpad(v_next::text, 4, '0');
end;
$$;

with existing_numbers as (
  select
    (created_at at time zone 'Europe/Rome')::date as order_date,
    max(split_part(order_number, '-', 3)::integer) as max_sequence
  from public.orders
  where order_number ~ '^PP-[0-9]{6}-[0-9]{4}$'
  group by 1
),
numbered_orders as (
  select
    o.id,
    (o.created_at at time zone 'Europe/Rome')::date as order_date,
    coalesce(e.max_sequence, 0) +
      row_number() over (
        partition by (o.created_at at time zone 'Europe/Rome')::date
        order by o.created_at, o.id
      ) as sequence_number
  from public.orders o
  left join existing_numbers e
    on e.order_date = (o.created_at at time zone 'Europe/Rome')::date
  where o.order_number is null
)
update public.orders o
set order_number =
  'PP-' ||
  to_char(n.order_date, 'YYMMDD') ||
  '-' ||
  lpad(n.sequence_number::text, 4, '0')
from numbered_orders n
where o.id = n.id;

insert into public.order_number_sequences (order_date, last_value, updated_at)
select
  (created_at at time zone 'Europe/Rome')::date as order_date,
  max(split_part(order_number, '-', 3)::integer) as last_value,
  now()
from public.orders
where order_number ~ '^PP-[0-9]{6}-[0-9]{4}$'
group by 1
on conflict (order_date)
do update
  set last_value = greatest(
        public.order_number_sequences.last_value,
        excluded.last_value
      ),
      updated_at = now();

create unique index if not exists orders_order_number_key
  on public.orders (order_number);

alter table public.orders
  alter column order_number set not null;

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
  v_fulfillment_status text := 'reserved';
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
  v_preorder_qty integer;
  v_fulfillment_type text;
  v_preorder_min integer;
  v_preorder_max integer;
  v_line_subtotal numeric(12, 2);
  v_line_vat numeric(12, 2);
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
    fulfillment_status,
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
    v_fulfillment_status,
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
      raise exception 'SKU % has only % available/preorder units',
        v_inventory.sku,
        v_available_stock + v_available_incoming;
    end if;

    v_stock_qty := least(v_quantity, v_available_stock);
    v_preorder_qty := v_quantity - v_stock_qty;
    v_preorder_min := case
      when v_preorder_qty > 0 then coalesce(v_inventory.preorder_lead_time_min_days, 7)
      else null
    end;
    v_preorder_max := case
      when v_preorder_qty > 0 then coalesce(v_inventory.preorder_lead_time_max_days, 14)
      else null
    end;
    v_fulfillment_type := case
      when v_stock_qty > 0 and v_preorder_qty > 0 then 'mixed'
      when v_preorder_qty > 0 then 'preorder'
      else 'stock'
    end;

    if v_preorder_qty > 0 then
      v_fulfillment_status := 'awaiting_preorder';
    end if;

    update public.inventory
    set
      stock_reserved = stock_reserved + v_stock_qty,
      incoming_reserved = incoming_reserved + v_preorder_qty,
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

    if v_preorder_qty > 0 then
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
        v_preorder_qty,
        v_preorder_qty,
        'Order preorder reservation',
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
      fulfillment_type,
      stock_qty,
      preorder_qty,
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
      v_fulfillment_type,
      v_stock_qty,
      v_preorder_qty,
      v_preorder_min,
      v_preorder_max
    );
  end loop;

  v_total := round(v_subtotal + v_vat, 2);

  update public.orders
  set
    fulfillment_status = v_fulfillment_status,
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
    'fulfillment_status', v_fulfillment_status,
    'reservation_expires_at', v_reservation_expires_at
  );
end;
$$;

revoke all on function public.next_order_number(timestamptz)
from public, anon, authenticated;

grant execute on function public.next_order_number(timestamptz)
to service_role;

revoke all on function public.create_order_with_reservations(jsonb)
from public, anon, authenticated;

grant execute on function public.create_order_with_reservations(jsonb)
to service_role;
