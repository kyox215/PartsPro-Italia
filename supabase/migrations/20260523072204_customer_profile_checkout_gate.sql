alter table public.customers
  add column if not exists phone text not null default '',
  add column if not exists fiscal_code text not null default '',
  add column if not exists registered_address text not null default '',
  add column if not exists billing_address text not null default '',
  add column if not exists shipping_address text not null default '',
  add column if not exists profile_completed_at timestamptz;

create or replace function private.is_customer_profile_complete(customer_record public.customers)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select
    nullif(btrim((customer_record).company_name), '') is not null
    and nullif(btrim((customer_record).contact_name), '') is not null
    and nullif(btrim((customer_record).phone), '') is not null
    and nullif(btrim((customer_record).vat_number), '') is not null
    and nullif(btrim((customer_record).billing_address), '') is not null
    and nullif(btrim((customer_record).shipping_address), '') is not null
    and (
      nullif(btrim((customer_record).sdi), '') is not null
      or nullif(btrim((customer_record).pec), '') is not null
    );
$$;

create or replace function private.customer_profile_json(customer_record public.customers)
returns jsonb
language sql
stable
set search_path = private, public, pg_temp
as $$
  select jsonb_build_object(
    'id', (customer_record).id,
    'userId', (customer_record).user_id,
    'email', (customer_record).email,
    'companyName', (customer_record).company_name,
    'contactName', (customer_record).contact_name,
    'phone', (customer_record).phone,
    'vatNumber', (customer_record).vat_number,
    'fiscalCode', (customer_record).fiscal_code,
    'sdi', (customer_record).sdi,
    'pec', (customer_record).pec,
    'registeredAddress', (customer_record).registered_address,
    'billingAddress', (customer_record).billing_address,
    'shippingAddress', (customer_record).shipping_address,
    'profileCompletedAt', (customer_record).profile_completed_at,
    'isComplete', private.is_customer_profile_complete(customer_record)
  );
$$;

create or replace function private.get_my_customer_profile_impl()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  customer_record public.customers%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into customer_record
  from public.customers
  where user_id = current_user_id
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'email', coalesce(nullif(auth.jwt()->>'email', ''), ''),
      'companyName', '',
      'contactName', '',
      'phone', '',
      'vatNumber', '',
      'fiscalCode', '',
      'sdi', '',
      'pec', '',
      'registeredAddress', '',
      'billingAddress', '',
      'shippingAddress', '',
      'isComplete', false
    );
  end if;

  return private.customer_profile_json(customer_record);
end;
$$;

revoke all on function private.get_my_customer_profile_impl() from public, anon, authenticated;
grant execute on function private.get_my_customer_profile_impl() to authenticated;

create or replace function public.get_my_customer_profile()
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.get_my_customer_profile_impl();
$$;

revoke execute on function public.get_my_customer_profile() from public, anon;
grant execute on function public.get_my_customer_profile() to authenticated;

create or replace function private.upsert_my_customer_profile_impl(profile jsonb)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  existing_customer public.customers%rowtype;
  saved_customer public.customers%rowtype;
  company_name_value text := nullif(btrim(coalesce(profile->>'companyName', profile->>'company_name', '')), '');
  contact_name_value text := nullif(btrim(coalesce(profile->>'contactName', profile->>'contact_name', '')), '');
  email_value text := coalesce(
    nullif(btrim(coalesce(auth.jwt()->>'email', '')), ''),
    nullif(btrim(coalesce(profile->>'email', '')), ''),
    'customer@partspro.local'
  );
  phone_value text := nullif(btrim(coalesce(profile->>'phone', '')), '');
  vat_number_value text := nullif(btrim(coalesce(profile->>'vatNumber', profile->>'vat_number', '')), '');
  fiscal_code_value text := btrim(coalesce(profile->>'fiscalCode', profile->>'fiscal_code', ''));
  sdi_value text := btrim(coalesce(profile->>'sdi', ''));
  pec_value text := btrim(coalesce(profile->>'pec', ''));
  billing_address_value text := nullif(btrim(coalesce(profile->>'billingAddress', profile->>'billing_address', '')), '');
  shipping_address_value text := nullif(btrim(coalesce(profile->>'shippingAddress', profile->>'shipping_address', '')), '');
  registered_address_value text := nullif(btrim(coalesce(profile->>'registeredAddress', profile->>'registered_address', '')), '');
  completed_at_value timestamptz;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if company_name_value is null
     or contact_name_value is null
     or phone_value is null
     or vat_number_value is null
     or billing_address_value is null
     or shipping_address_value is null
     or (nullif(sdi_value, '') is null and nullif(pec_value, '') is null) then
    raise exception 'customer profile incomplete';
  end if;

  registered_address_value := coalesce(registered_address_value, billing_address_value);
  completed_at_value := now();

  select *
  into existing_customer
  from public.customers
  where user_id = current_user_id
  order by created_at desc
  limit 1;

  if found then
    update public.customers
    set company_name = company_name_value,
        contact_name = contact_name_value,
        email = email_value,
        phone = phone_value,
        vat_number = vat_number_value,
        fiscal_code = fiscal_code_value,
        sdi = sdi_value,
        pec = pec_value,
        registered_address = registered_address_value,
        billing_address = billing_address_value,
        shipping_address = shipping_address_value,
        profile_completed_at = completed_at_value
    where id = existing_customer.id
    returning * into saved_customer;
  else
    insert into public.customers (
      user_id,
      company_name,
      contact_name,
      email,
      phone,
      vat_number,
      fiscal_code,
      sdi,
      pec,
      registered_address,
      billing_address,
      shipping_address,
      profile_completed_at,
      status,
      tier
    ) values (
      current_user_id,
      company_name_value,
      contact_name_value,
      email_value,
      phone_value,
      vat_number_value,
      fiscal_code_value,
      sdi_value,
      pec_value,
      registered_address_value,
      billing_address_value,
      shipping_address_value,
      completed_at_value,
      'pending',
      'standard'
    )
    returning * into saved_customer;
  end if;

  return private.customer_profile_json(saved_customer);
end;
$$;

revoke all on function private.upsert_my_customer_profile_impl(jsonb) from public, anon, authenticated;
grant execute on function private.upsert_my_customer_profile_impl(jsonb) to authenticated;

create or replace function public.upsert_my_customer_profile(profile jsonb)
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.upsert_my_customer_profile_impl(profile);
$$;

revoke execute on function public.upsert_my_customer_profile(jsonb) from public, anon;
grant execute on function public.upsert_my_customer_profile(jsonb) to authenticated;

create or replace function private.create_order_from_cart_impl(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  payment_method_value text := coalesce(payload->>'paymentMethod', payload->>'payment_method', 'bank_transfer');
  payment_status_value text := 'pending';
  customer_record public.customers%rowtype;
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

  if not found then
    raise exception 'customer profile required';
  end if;

  if not private.is_customer_profile_complete(customer_record) then
    raise exception 'customer profile incomplete';
  end if;

  if payment_method_value = 'bank_transfer' then
    payment_status_value := 'bank_waiting';
  else
    payment_status_value := 'pending';
  end if;

  fiscal_payload := jsonb_build_object(
    'vatNumber', customer_record.vat_number,
    'fiscalCode', customer_record.fiscal_code,
    'sdi', customer_record.sdi,
    'pec', customer_record.pec,
    'billingAddress', customer_record.billing_address
  );
  delivery_address_value := customer_record.shipping_address;
  shipping_method_value := coalesce(
    nullif(payload->>'shippingMethod', ''),
    nullif(payload->>'shipping_method', ''),
    nullif(payload#>>'{shipping,method}', ''),
    'GLS/BRT 24-48h'
  );
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
    customer_record.id,
    current_user_id,
    customer_record.company_name,
    customer_record.tier,
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
      'totalQuantity', total_quantity_value,
      'profileSource', 'customers'
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
