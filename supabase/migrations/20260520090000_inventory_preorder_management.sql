alter table public.skus
  add column if not exists barcode_ean13 text,
  add column if not exists cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  add column if not exists preorder_lead_time_min_days integer not null default 7 check (preorder_lead_time_min_days >= 0),
  add column if not exists preorder_lead_time_max_days integer not null default 14 check (preorder_lead_time_max_days >= preorder_lead_time_min_days);

alter table public.inventory
  add column if not exists incoming_reserved integer not null default 0 check (incoming_reserved >= 0);

alter table public.order_items
  add column if not exists fulfillment_type text not null default 'stock',
  add column if not exists stock_qty integer not null default 0,
  add column if not exists preorder_qty integer not null default 0,
  add column if not exists preorder_lead_time_min_days integer,
  add column if not exists preorder_lead_time_max_days integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skus_barcode_ean13_key'
      and conrelid = 'public.skus'::regclass
  ) then
    alter table public.skus
      add constraint skus_barcode_ean13_key unique (barcode_ean13);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_sku_warehouse_key'
      and conrelid = 'public.inventory'::regclass
  ) then
    alter table public.inventory
      add constraint inventory_sku_warehouse_key unique (sku_id, warehouse_code);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_fulfillment_type_check'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_fulfillment_type_check
      check (fulfillment_type in ('stock', 'preorder', 'mixed'));
  end if;
end $$;

create table if not exists public.inventory_settings (
  id boolean primary key default true check (id),
  b2b_markup numeric(6,3) not null default 1.5 check (b2b_markup > 0),
  retail_markup numeric(6,3) not null default 2.0 check (retail_markup > 0),
  preorder_lead_time_min_days integer not null default 7 check (preorder_lead_time_min_days >= 0),
  preorder_lead_time_max_days integer not null default 14 check (preorder_lead_time_max_days >= preorder_lead_time_min_days),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'excel_cart',
  source_filename text not null,
  status text not null default 'ordered' check (
    status in ('ordered', 'partially_received', 'completed', 'cancelled')
  ),
  ordered_total integer not null default 0,
  received_total integer not null default 0,
  missing_total integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  imported_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.supplier_purchase_orders(id) on delete cascade,
  sku_id uuid not null references public.skus(id) on delete cascade,
  ean13 text not null,
  sku text not null,
  supplier_name text not null,
  original_name text not null,
  ordered_qty integer not null check (ordered_qty > 0),
  received_qty integer not null default 0 check (received_qty >= 0),
  missing_qty integer not null default 0 check (missing_qty >= 0),
  cost_price numeric(12,2) not null check (cost_price >= 0),
  status text not null default 'ordered' check (
    status in ('ordered', 'partial', 'completed', 'shortage')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (purchase_order_id, ean13)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  purchase_order_item_id uuid references public.supplier_purchase_order_items(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (
    movement_type in (
      'excel_import',
      'receive_stock',
      'mark_shortage',
      'reserve_stock',
      'reserve_incoming',
      'release_reservation',
      'manual_adjustment'
    )
  ),
  quantity integer not null,
  stock_delta integer not null default 0,
  incoming_delta integer not null default 0,
  reserved_delta integer not null default 0,
  incoming_reserved_delta integer not null default 0,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists skus_barcode_ean13_idx on public.skus (barcode_ean13);
create index if not exists supplier_purchase_orders_status_idx on public.supplier_purchase_orders (status, created_at desc);
create index if not exists supplier_purchase_order_items_status_idx on public.supplier_purchase_order_items (status, ean13);
create unique index if not exists supplier_purchase_order_items_open_ean13_key
on public.supplier_purchase_order_items (ean13)
where status in ('ordered', 'partial');
create index if not exists inventory_movements_sku_created_idx on public.inventory_movements (sku_id, created_at desc);

insert into public.inventory_settings (id, b2b_markup, retail_markup, preorder_lead_time_min_days, preorder_lead_time_max_days)
values (true, 1.5, 2.0, 7, 14)
on conflict (id) do nothing;

alter table public.inventory_settings enable row level security;
alter table public.supplier_purchase_orders enable row level security;
alter table public.supplier_purchase_order_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "inventory_settings_admin_manage" on public.inventory_settings;
create policy "inventory_settings_admin_manage"
on public.inventory_settings for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "supplier_purchase_orders_admin_manage" on public.supplier_purchase_orders;
create policy "supplier_purchase_orders_admin_manage"
on public.supplier_purchase_orders for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "supplier_purchase_order_items_admin_manage" on public.supplier_purchase_order_items;
create policy "supplier_purchase_order_items_admin_manage"
on public.supplier_purchase_order_items for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "inventory_movements_admin_manage" on public.inventory_movements;
create policy "inventory_movements_admin_manage"
on public.inventory_movements for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

grant select, insert, update, delete on public.inventory_settings to authenticated;
grant select, insert, update, delete on public.supplier_purchase_orders to authenticated;
grant select, insert, update, delete on public.supplier_purchase_order_items to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;

drop view if exists public.catalog_private_items;
drop view if exists public.catalog_public_items;

create view public.catalog_public_items
with (security_invoker = true)
as
select
  sku.id as sku_id,
  product.id as product_id,
  product.slug,
  sku.sku,
  sku.barcode_ean13,
  product.brand,
  product.model,
  product.category,
  coalesce(category.name_it, product.category) as category_name_it,
  coalesce(category.name_zh, product.category) as category_name_zh,
  product.quality_grade,
  product.name_it,
  product.name_zh,
  product.description_it,
  product.description_zh,
  product.image_url,
  sku.color,
  sku.compatibility,
  sku.moq,
  sku.preorder_lead_time_min_days,
  sku.preorder_lead_time_max_days
from public.skus sku
join public.products product on product.id = sku.product_id
left join public.categories category on category.slug = product.category
where sku.is_active = true
  and product.is_active = true;

create view public.catalog_private_items
with (security_invoker = true)
as
select
  sku.id as sku_id,
  product.id as product_id,
  product.slug,
  sku.sku,
  sku.barcode_ean13,
  product.brand,
  product.model,
  product.category,
  coalesce(category.name_it, product.category) as category_name_it,
  coalesce(category.name_zh, product.category) as category_name_zh,
  product.quality_grade,
  product.name_it,
  product.name_zh,
  product.description_it,
  product.description_zh,
  product.image_url,
  sku.color,
  sku.compatibility,
  sku.moq,
  sku.retail_price,
  sku.b2b_price,
  sku.vat_rate,
  sku.preorder_lead_time_min_days,
  sku.preorder_lead_time_max_days,
  coalesce(inventory.stock_on_hand, 0) as stock_on_hand,
  coalesce(inventory.stock_reserved, 0) as stock_reserved,
  greatest(coalesce(inventory.stock_on_hand, 0) - coalesce(inventory.stock_reserved, 0), 0) as available_stock,
  coalesce(inventory.incoming_qty, 0) as incoming_qty,
  coalesce(inventory.incoming_reserved, 0) as incoming_reserved,
  greatest(coalesce(inventory.incoming_qty, 0) - coalesce(inventory.incoming_reserved, 0), 0) as incoming_available,
  greatest(coalesce(inventory.incoming_qty, 0) - coalesce(inventory.incoming_reserved, 0), 0) > 0 as is_preorderable
from public.skus sku
join public.products product on product.id = sku.product_id
left join public.categories category on category.slug = product.category
left join lateral (
  select
    sum(stock_on_hand)::integer as stock_on_hand,
    sum(stock_reserved)::integer as stock_reserved,
    sum(incoming_qty)::integer as incoming_qty,
    sum(incoming_reserved)::integer as incoming_reserved
  from public.inventory
  where inventory.sku_id = sku.id
) inventory on true
where sku.is_active = true
  and product.is_active = true;

grant select on public.catalog_public_items to anon, authenticated;
grant select on public.catalog_private_items to authenticated;

create or replace function public.import_supplier_cart_items(
  payload_items jsonb,
  source_filename text default 'cart.xlsx'
)
returns table(
  purchase_order_id uuid,
  processed integer,
  imported integer,
  skipped integer,
  ordered_qty integer,
  message text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item jsonb;
  v_po_id uuid := gen_random_uuid();
  v_brand_id uuid;
  v_product_id uuid;
  v_sku_id uuid;
  v_item_id uuid;
  v_settings public.inventory_settings%rowtype;
  v_ean text;
  v_original_name text;
  v_sku text;
  v_slug text;
  v_brand text;
  v_brand_slug text;
  v_model text;
  v_model_slug text;
  v_color text;
  v_quality text;
  v_category text;
  v_cost numeric(12,2);
  v_b2b numeric(12,2);
  v_retail numeric(12,2);
  v_qty integer;
  v_compatibility text[];
begin
  if jsonb_typeof(payload_items) is distinct from 'array' then
    raise exception 'payload_items must be a JSON array';
  end if;

  select * into v_settings
  from public.inventory_settings
  where id = true;

  if not found then
    insert into public.inventory_settings (id)
    values (true)
    returning * into v_settings;
  end if;

  insert into public.supplier_purchase_orders (
    id,
    source,
    source_filename,
    status,
    metadata
  )
  values (
    v_po_id,
    'excel_cart',
    coalesce(nullif(source_filename, ''), 'cart.xlsx'),
    'ordered',
    jsonb_build_object('row_count', jsonb_array_length(payload_items))
  );

  processed := 0;
  imported := 0;
  skipped := 0;
  ordered_qty := 0;

  for v_item in
    select value
    from jsonb_array_elements(payload_items)
  loop
    processed := processed + 1;
    v_ean := nullif(trim(v_item->>'ean13'), '');
    v_original_name := coalesce(nullif(trim(v_item->>'original_name'), ''), 'Imported item');
    v_sku := coalesce(nullif(trim(v_item->>'sku'), ''), 'DCK-' || right(coalesce(v_ean, md5(v_original_name)), 6));
    v_slug := coalesce(nullif(trim(v_item->>'slug'), ''), public.catalog_slugify(v_sku));
    v_brand := coalesce(nullif(trim(v_item->>'brand'), ''), 'Unknown');
    v_brand_slug := coalesce(public.catalog_slugify(v_brand), 'unknown');
    v_model := coalesce(nullif(trim(v_item->>'model'), ''), 'Universal');
    v_model_slug := coalesce(public.catalog_slugify(v_brand || '-' || v_model), public.catalog_slugify(v_model), 'universal');
    v_color := nullif(trim(v_item->>'color'), '');
    v_quality := coalesce(nullif(trim(v_item->>'quality_grade'), ''), 'High Quality Compatible');
    v_category := coalesce(nullif(trim(v_item->>'category'), ''), 'dock-connectors');
    v_qty := greatest(0, coalesce((v_item->>'quantity')::integer, 0));
    v_cost := greatest(0, coalesce((v_item->>'cost_price')::numeric, 0));
    v_b2b := coalesce((v_item->>'b2b_price')::numeric, ceil(v_cost * v_settings.b2b_markup * 10) / 10);
    v_retail := coalesce((v_item->>'retail_price')::numeric, ceil(v_cost * v_settings.retail_markup * 10) / 10);
    v_compatibility := coalesce(
      array(
        select jsonb_array_elements_text(v_item->'compatibility')
      ),
      array[v_model]
    );

    if v_ean is null or v_qty <= 0 then
      skipped := skipped + 1;
      continue;
    end if;

    if exists (
      select 1
      from public.supplier_purchase_order_items open_item
      where open_item.ean13 = v_ean
        and open_item.status in ('ordered', 'partial')
    ) then
      skipped := skipped + 1;
      continue;
    end if;

    insert into public.brands (name, slug, external_source, external_id, external_payload)
    values (v_brand, v_brand_slug, 'supplier_cart_brand', v_brand_slug, jsonb_build_object('source', 'excel_cart'))
    on conflict (slug) do update
    set name = excluded.name,
        external_payload = excluded.external_payload
    returning id into v_brand_id;

    insert into public.categories (slug, name_it, name_zh, external_source, external_id, external_payload)
    values (v_category, 'Dock connector', '尾插 / 充电接口', 'supplier_cart_category', v_category, jsonb_build_object('source', 'excel_cart'))
    on conflict (slug) do update
    set name_it = excluded.name_it,
        name_zh = excluded.name_zh,
        external_payload = excluded.external_payload;

    insert into public.phone_models (brand_id, name, slug, model_codes, external_source, external_id, external_payload)
    values (
      v_brand_id,
      v_model,
      v_model_slug,
      array[v_model],
      'supplier_cart_model',
      v_model_slug,
      jsonb_build_object('brand', v_brand, 'model', v_model)
    )
    on conflict (slug) do update
    set name = excluded.name,
        model_codes = excluded.model_codes,
        external_payload = excluded.external_payload;

    insert into public.products (
      slug,
      brand,
      model,
      category,
      quality_grade,
      name_it,
      name_zh,
      description_it,
      description_zh,
      image_url,
      is_active,
      external_source,
      external_id,
      external_payload
    )
    values (
      v_slug,
      v_brand,
      v_model,
      v_category,
      v_quality,
      v_original_name,
      v_original_name,
      'Ricambio importato da ordine fornitore. Preordine con arrivo stimato 7-14 giorni.',
      '从上游订货单导入的配件。预购预计 7-14 天到货。',
      null,
      true,
      'supplier_cart',
      v_ean,
      v_item
    )
    on conflict (external_source, external_id) do update
    set slug = excluded.slug,
        brand = excluded.brand,
        model = excluded.model,
        category = excluded.category,
        quality_grade = excluded.quality_grade,
        name_it = excluded.name_it,
        name_zh = excluded.name_zh,
        description_it = excluded.description_it,
        description_zh = excluded.description_zh,
        external_payload = excluded.external_payload,
        updated_at = now()
    returning id into v_product_id;

    insert into public.skus (
      product_id,
      sku,
      barcode_ean13,
      cost_price,
      color,
      compatibility,
      moq,
      retail_price,
      b2b_price,
      vat_rate,
      preorder_lead_time_min_days,
      preorder_lead_time_max_days,
      is_active,
      external_source,
      external_id,
      external_payload
    )
    values (
      v_product_id,
      v_sku,
      v_ean,
      v_cost,
      v_color,
      v_compatibility,
      1,
      v_retail,
      v_b2b,
      0.22,
      v_settings.preorder_lead_time_min_days,
      v_settings.preorder_lead_time_max_days,
      true,
      'supplier_cart',
      v_ean,
      v_item
    )
    on conflict (barcode_ean13) do update
    set product_id = excluded.product_id,
        sku = excluded.sku,
        cost_price = excluded.cost_price,
        color = excluded.color,
        compatibility = excluded.compatibility,
        retail_price = excluded.retail_price,
        b2b_price = excluded.b2b_price,
        preorder_lead_time_min_days = excluded.preorder_lead_time_min_days,
        preorder_lead_time_max_days = excluded.preorder_lead_time_max_days,
        external_payload = excluded.external_payload,
        is_active = excluded.is_active,
        updated_at = now()
    returning id into v_sku_id;

    insert into public.inventory (
      sku_id,
      warehouse_code,
      stock_on_hand,
      stock_reserved,
      incoming_qty,
      incoming_reserved
    )
    values (v_sku_id, 'MAIN', 0, 0, v_qty, 0)
    on conflict (sku_id, warehouse_code) do update
    set incoming_qty = public.inventory.incoming_qty + excluded.incoming_qty,
        updated_at = now();

    insert into public.supplier_purchase_order_items (
      purchase_order_id,
      sku_id,
      ean13,
      sku,
      supplier_name,
      original_name,
      ordered_qty,
      cost_price,
      status
    )
    values (
      v_po_id,
      v_sku_id,
      v_ean,
      v_sku,
      v_brand,
      v_original_name,
      v_qty,
      v_cost,
      'ordered'
    )
    returning id into v_item_id;

    insert into public.inventory_movements (
      sku_id,
      purchase_order_item_id,
      movement_type,
      quantity,
      incoming_delta,
      note,
      metadata
    )
    values (
      v_sku_id,
      v_item_id,
      'excel_import',
      v_qty,
      v_qty,
      'Supplier cart import',
      jsonb_build_object('ean13', v_ean, 'source_filename', source_filename)
    );

    imported := imported + 1;
    ordered_qty := ordered_qty + v_qty;
  end loop;

  update public.supplier_purchase_orders
  set ordered_total = ordered_qty,
      status = case when imported = 0 then 'completed' else 'ordered' end,
      updated_at = now()
  where id = v_po_id;

  purchase_order_id := v_po_id;
  message := 'ok';
  return next;
end;
$$;

create or replace function public.receive_supplier_purchase_items(payload_items jsonb)
returns table(processed integer, received_qty integer, missing_qty integer, message text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item jsonb;
  v_item_id uuid;
  v_po_id uuid;
  v_sku_id uuid;
  v_ordered integer;
  v_current_received integer;
  v_current_missing integer;
  v_remaining integer;
  v_receive integer;
  v_missing integer;
  v_new_received integer;
  v_new_missing integer;
begin
  if jsonb_typeof(payload_items) is distinct from 'array' then
    raise exception 'payload_items must be a JSON array';
  end if;

  processed := 0;
  received_qty := 0;
  missing_qty := 0;

  for v_item in
    select value
    from jsonb_array_elements(payload_items)
  loop
    v_item_id := (v_item->>'id')::uuid;
    v_receive := greatest(0, coalesce((v_item->>'received_qty')::integer, 0));
    v_missing := greatest(0, coalesce((v_item->>'missing_qty')::integer, 0));

    if v_receive = 0 and v_missing = 0 then
      continue;
    end if;

    select purchase_order_id, sku_id, ordered_qty, received_qty, missing_qty
    into v_po_id, v_sku_id, v_ordered, v_current_received, v_current_missing
    from public.supplier_purchase_order_items
    where id = v_item_id
    for update;

    if not found then
      raise exception 'Purchase item % not found', v_item_id;
    end if;

    v_remaining := greatest(v_ordered - v_current_received - v_current_missing, 0);
    if v_receive + v_missing > v_remaining then
      raise exception 'Received plus missing exceeds remaining quantity for item %', v_item_id;
    end if;

    v_new_received := v_current_received + v_receive;
    v_new_missing := v_current_missing + v_missing;

    update public.inventory
    set stock_on_hand = stock_on_hand + v_receive,
        incoming_qty = greatest(incoming_qty - v_receive - v_missing, 0),
        incoming_reserved = least(incoming_reserved, greatest(incoming_qty - v_receive - v_missing, 0)),
        updated_at = now()
    where sku_id = v_sku_id
      and warehouse_code = 'MAIN';

    if v_receive > 0 then
      insert into public.inventory_movements (
        sku_id,
        purchase_order_item_id,
        movement_type,
        quantity,
        stock_delta,
        incoming_delta,
        note
      )
      values (
        v_sku_id,
        v_item_id,
        'receive_stock',
        v_receive,
        v_receive,
        -v_receive,
        'Supplier stock received'
      );
    end if;

    if v_missing > 0 then
      insert into public.inventory_movements (
        sku_id,
        purchase_order_item_id,
        movement_type,
        quantity,
        incoming_delta,
        note
      )
      values (
        v_sku_id,
        v_item_id,
        'mark_shortage',
        v_missing,
        -v_missing,
        'Supplier shortage marked'
      );
    end if;

    update public.supplier_purchase_order_items
    set received_qty = v_new_received,
        missing_qty = v_new_missing,
        status = case
          when v_new_received + v_new_missing >= v_ordered and v_new_missing > 0 then 'shortage'
          when v_new_received + v_new_missing >= v_ordered then 'completed'
          else 'partial'
        end,
        updated_at = now()
    where id = v_item_id;

    update public.supplier_purchase_orders po
    set ordered_total = totals.ordered_total,
        received_total = totals.received_total,
        missing_total = totals.missing_total,
        status = case
          when totals.open_count = 0 then 'completed'
          when totals.received_total > 0 or totals.missing_total > 0 then 'partially_received'
          else 'ordered'
        end,
        updated_at = now()
    from (
      select
        purchase_order_id,
        sum(ordered_qty)::integer as ordered_total,
        sum(received_qty)::integer as received_total,
        sum(missing_qty)::integer as missing_total,
        count(*) filter (where status in ('ordered', 'partial'))::integer as open_count
      from public.supplier_purchase_order_items
      where purchase_order_id = v_po_id
      group by purchase_order_id
    ) totals
    where po.id = totals.purchase_order_id;

    processed := processed + 1;
    received_qty := received_qty + v_receive;
    missing_qty := missing_qty + v_missing;
  end loop;

  message := 'ok';
  return next;
end;
$$;

revoke all on function public.import_supplier_cart_items(jsonb, text) from public, anon, authenticated;
revoke all on function public.receive_supplier_purchase_items(jsonb) from public, anon, authenticated;
grant execute on function public.import_supplier_cart_items(jsonb, text) to service_role;
grant execute on function public.receive_supplier_purchase_items(jsonb) to service_role;
