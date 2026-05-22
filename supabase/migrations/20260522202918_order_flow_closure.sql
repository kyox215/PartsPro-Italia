create sequence if not exists public.order_no_seq start with 1 increment by 1;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null
    check (event_type in ('created', 'status_changed', 'shipped', 'quantity_checked', 'payment_changed')),
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id) on delete set null,
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.order_events enable row level security;

drop policy if exists "order_events_self_select" on public.order_events;
create policy "order_events_self_select" on public.order_events
for select to authenticated using (
  exists (
    select 1
    from public.orders
    where orders.id = order_events.order_id
      and (orders.user_id = auth.uid() or private.is_staff())
  )
);

drop policy if exists "order_events_staff_all" on public.order_events;
create policy "order_events_staff_all" on public.order_events
for all to authenticated using (private.is_staff()) with check (private.is_staff());

grant select, insert on public.order_events to authenticated;

create or replace function private.stock_status_for_order_line(product_stock_status text)
returns text
language sql
immutable
as $$
  select case product_stock_status
    when 'in_stock' then 'available'
    when 'low_stock' then 'low_stock'
    when 'incoming' then 'incoming'
    else 'reserved'
  end;
$$;

create or replace function private.create_order_from_cart_impl(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  billing_payload jsonb := coalesce(payload->'billing', '{}'::jsonb);
  shipping_payload jsonb := coalesce(payload->'shipping', '{}'::jsonb);
  payment_method_value text := coalesce(payload->>'paymentMethod', payload->>'payment_method', 'bank_transfer');
  payment_status_value text := 'pending';
  customer_record public.customers%rowtype;
  customer_id_value uuid;
  customer_name_value text;
  customer_tier_value text := 'standard';
  fiscal_payload jsonb;
  delivery_address_value text;
  shipping_method_value text;
  customer_note_value text;
  order_id_value uuid;
  order_no_value text;
  item_payload jsonb;
  item_sku text;
  item_qty integer;
  product_record public.products%rowtype;
  line_stock_status text;
  stock_risk_value text := 'clear';
  subtotal_value numeric(12,2) := 0;
  vat_value numeric(12,2) := 0;
  shipping_value numeric(12,2) := 0;
  total_quantity_value integer := 0;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(payload->'items') is distinct from 'array'
     or jsonb_array_length(payload->'items') = 0 then
    raise exception 'cart is empty';
  end if;

  select *
  into customer_record
  from public.customers
  where user_id = current_user_id
  order by created_at desc
  limit 1;

  if found then
    customer_id_value := customer_record.id;
    customer_name_value := customer_record.company_name;
    customer_tier_value := customer_record.tier;
  else
    customer_name_value := nullif(trim(billing_payload->>'companyName'), '');
  end if;

  if customer_name_value is null then
    customer_name_value := 'PartsPro Customer';
  end if;

  if payment_method_value = 'bank_transfer' then
    payment_status_value := 'bank_waiting';
  else
    payment_status_value := 'pending';
  end if;

  fiscal_payload := jsonb_build_object(
    'vatNumber', coalesce(billing_payload->>'vatNumber', ''),
    'fiscalCode', coalesce(billing_payload->>'fiscalCode', ''),
    'sdi', coalesce(billing_payload->>'sdi', ''),
    'pec', coalesce(billing_payload->>'pec', ''),
    'billingAddress', coalesce(billing_payload->>'address', '')
  );
  delivery_address_value := coalesce(shipping_payload->>'address', '');
  shipping_method_value := coalesce(shipping_payload->>'method', 'GLS/BRT 24-48h');
  customer_note_value := coalesce(payload->>'customerNote', payload->>'customer_note', '');
  order_no_value := 'SO-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_no_seq')::text, 6, '0');

  insert into public.orders (
    order_no,
    customer_id,
    user_id,
    customer_name,
    customer_tier,
    status,
    payment_status,
    stock_risk,
    total_net,
    vat,
    shipping,
    shipping_method,
    fiscal,
    delivery_address,
    customer_note,
    staff_note
  ) values (
    order_no_value,
    customer_id_value,
    current_user_id,
    customer_name_value,
    customer_tier_value,
    'submitted',
    payment_status_value,
    'clear',
    0,
    0,
    0,
    shipping_method_value,
    fiscal_payload,
    delivery_address_value,
    customer_note_value,
    ''
  )
  returning id into order_id_value;

  for item_payload in
    select value from jsonb_array_elements(payload->'items')
  loop
    item_sku := coalesce(item_payload->>'skuCode', item_payload->>'sku_code');
    item_qty := coalesce(nullif(item_payload->>'quantity', '')::integer, 0);

    if item_sku is null or item_qty <= 0 then
      raise exception 'invalid cart line';
    end if;

    select *
    into product_record
    from public.products
    where sku_code = item_sku
      and status = 'active';

    if not found then
      raise exception 'product % not found', item_sku;
    end if;

    if product_record.stock_status = 'out_of_stock' then
      raise exception 'product % is out of stock', item_sku;
    end if;

    if item_qty < product_record.moq then
      raise exception 'product % requires minimum quantity %', item_sku, product_record.moq;
    end if;

    line_stock_status := private.stock_status_for_order_line(product_record.stock_status);

    if product_record.stock_status = 'incoming' then
      stock_risk_value := 'split';
    elsif product_record.stock_status = 'low_stock' and stock_risk_value = 'clear' then
      stock_risk_value := 'low';
    end if;

    subtotal_value := subtotal_value + round(product_record.b2b_price * item_qty, 2);
    total_quantity_value := total_quantity_value + item_qty;

    insert into public.order_lines (
      order_id,
      sku_code,
      product_name,
      quality_grade,
      quantity,
      unit_price,
      stock_status,
      batch_code,
      location
    ) values (
      order_id_value,
      product_record.sku_code,
      product_record.name,
      product_record.quality_grade,
      item_qty,
      product_record.b2b_price,
      line_stock_status,
      coalesce(nullif(product_record.batch_code, ''), '待分配'),
      coalesce(nullif(product_record.location, ''), '待分配')
    );
  end loop;

  shipping_value := case when subtotal_value >= 250 then 0 else 7.90 end;
  vat_value := round(subtotal_value * 0.22, 2);

  update public.orders
  set total_net = subtotal_value,
      vat = vat_value,
      shipping = shipping_value,
      stock_risk = stock_risk_value
  where id = order_id_value;

  insert into public.order_events (
    order_id,
    event_type,
    actor_id,
    to_status,
    note,
    metadata
  ) values (
    order_id_value,
    'created',
    current_user_id,
    'submitted',
    'Order created from storefront checkout.',
    jsonb_build_object(
      'paymentMethod', payment_method_value,
      'paymentStatus', payment_status_value,
      'totalQuantity', total_quantity_value
    )
  );

  return jsonb_build_object(
    'orderId', order_id_value,
    'orderNo', order_no_value,
    'status', 'submitted',
    'summary', jsonb_build_object(
      'subtotal', subtotal_value,
      'vat', vat_value,
      'shipping', shipping_value,
      'total', subtotal_value + vat_value + shipping_value,
      'totalQuantity', total_quantity_value
    )
  );
end;
$$;

revoke all on function private.create_order_from_cart_impl(jsonb) from public, anon, authenticated;
grant execute on function private.create_order_from_cart_impl(jsonb) to authenticated;

create or replace function public.create_order_from_cart(payload jsonb)
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.create_order_from_cart_impl(payload);
$$;

revoke execute on function public.create_order_from_cart(jsonb) from public, anon;
grant execute on function public.create_order_from_cart(jsonb) to authenticated;

create or replace function public.advance_order_status(target_order_id uuid, next_status text)
returns public.orders
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  flow text[] := array['submitted', 'accepted', 'picking', 'packed', 'shipped', 'completed'];
  old_status text;
  old_index integer;
  updated_order public.orders;
begin
  if not private.is_staff() then
    raise exception 'staff access required';
  end if;

  select status
  into old_status
  from public.orders
  where id = target_order_id
  for update;

  if old_status is null then
    raise exception 'order not found';
  end if;

  old_index := array_position(flow, old_status);

  if old_index is null or old_index = array_length(flow, 1) or flow[old_index + 1] <> next_status then
    raise exception 'invalid order status transition from % to %', old_status, next_status;
  end if;

  update public.orders
  set status = next_status
  where id = target_order_id
  returning * into updated_order;

  insert into public.order_events (
    order_id,
    event_type,
    from_status,
    to_status,
    actor_id,
    note
  ) values (
    target_order_id,
    'status_changed',
    old_status,
    next_status,
    auth.uid(),
    'Staff advanced order status.'
  );

  return updated_order;
end;
$$;

revoke execute on function public.advance_order_status(uuid, text) from public, anon;
grant execute on function public.advance_order_status(uuid, text) to authenticated;

create or replace function public.record_order_quantity_check(target_order_id uuid, check_payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  if not private.is_staff() then
    raise exception 'staff access required';
  end if;

  if not exists (select 1 from public.orders where id = target_order_id) then
    raise exception 'order not found';
  end if;

  insert into public.order_events (
    order_id,
    event_type,
    actor_id,
    note,
    metadata
  ) values (
    target_order_id,
    'quantity_checked',
    auth.uid(),
    'Staff confirmed picked quantities.',
    coalesce(check_payload, '{}'::jsonb)
  );
end;
$$;

revoke execute on function public.record_order_quantity_check(uuid, jsonb) from public, anon;
grant execute on function public.record_order_quantity_check(uuid, jsonb) to authenticated;

create or replace function public.staff_ship_order(target_order_id uuid)
returns public.orders
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  old_status text;
  shipped_order public.orders;
  order_line public.order_lines%rowtype;
begin
  if not private.is_staff() then
    raise exception 'staff access required';
  end if;

  select status
  into old_status
  from public.orders
  where id = target_order_id
  for update;

  if old_status is null then
    raise exception 'order not found';
  end if;

  if old_status not in ('packed', 'shipped') then
    raise exception 'order must be packed before shipping';
  end if;

  update public.orders
  set status = 'shipped',
      staff_note = trim(coalesce(staff_note, '') || ' staff_ship_order completed.')
  where id = target_order_id
  returning * into shipped_order;

  if old_status <> 'shipped' then
    for order_line in
      select * from public.order_lines where order_id = target_order_id
    loop
      insert into public.stock_movements (
        type,
        sku_code,
        batch_code,
        location,
        quantity,
        reference,
        operator,
        note
      ) values (
        'ship_out',
        order_line.sku_code,
        order_line.batch_code,
        order_line.location,
        -order_line.quantity,
        shipped_order.order_no,
        coalesce(auth.uid()::text, 'staff'),
        'Order shipped by staff_ship_order.'
      );
    end loop;

    insert into public.order_events (
      order_id,
      event_type,
      from_status,
      to_status,
      actor_id,
      note
    ) values (
      target_order_id,
      'shipped',
      old_status,
      'shipped',
      auth.uid(),
      'Order shipped and stock movements created.'
    );
  end if;

  return shipped_order;
end;
$$;

revoke execute on function public.staff_ship_order(uuid) from public, anon;
grant execute on function public.staff_ship_order(uuid) to authenticated;
