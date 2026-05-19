create or replace function public.catalog_slugify(input text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      both '-' from regexp_replace(
        regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
        '-+',
        '-',
        'g'
      )
    ),
    ''
  )
$$;

alter table public.brands
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

alter table public.phone_models
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

alter table public.categories
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

alter table public.products
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

alter table public.skus
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_payload jsonb not null default '{}'::jsonb;

create unique index if not exists brands_external_source_id_key
on public.brands (external_source, external_id);

create unique index if not exists phone_models_external_source_id_key
on public.phone_models (external_source, external_id);

create unique index if not exists categories_external_source_id_key
on public.categories (external_source, external_id);

create unique index if not exists products_external_source_id_key
on public.products (external_source, external_id);

create unique index if not exists skus_external_source_id_key
on public.skus (external_source, external_id);

create table if not exists public.catalog_attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label_it text not null,
  label_zh text not null,
  input_type text not null default 'select' check (
    input_type in ('select', 'boolean', 'number', 'text')
  ),
  unit text,
  is_filterable boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.catalog_attribute_definitions(id) on delete cascade,
  value text not null,
  label_it text not null,
  label_zh text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (attribute_id, value)
);

create table if not exists public.sku_attribute_values (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  attribute_id uuid not null references public.catalog_attribute_definitions(id) on delete cascade,
  value text not null,
  value_number numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku_id, attribute_id, value)
);

create index if not exists catalog_attribute_definitions_filter_idx
on public.catalog_attribute_definitions (is_filterable, sort_order, key);

create index if not exists catalog_attribute_options_attribute_idx
on public.catalog_attribute_options (attribute_id, sort_order, value);

create index if not exists sku_attribute_values_lookup_idx
on public.sku_attribute_values (attribute_id, value, sku_id);

create index if not exists products_catalog_filter_idx
on public.products (is_active, brand, model, category, quality_grade);

create index if not exists skus_catalog_filter_idx
on public.skus (is_active, product_id, sku);

alter table public.catalog_attribute_definitions enable row level security;
alter table public.catalog_attribute_options enable row level security;
alter table public.sku_attribute_values enable row level security;

drop policy if exists "catalog_attribute_definitions_public_read" on public.catalog_attribute_definitions;
create policy "catalog_attribute_definitions_public_read"
on public.catalog_attribute_definitions for select
to anon, authenticated
using (true);

drop policy if exists "catalog_attribute_options_public_read" on public.catalog_attribute_options;
create policy "catalog_attribute_options_public_read"
on public.catalog_attribute_options for select
to anon, authenticated
using (true);

drop policy if exists "sku_attribute_values_public_read" on public.sku_attribute_values;
create policy "sku_attribute_values_public_read"
on public.sku_attribute_values for select
to anon, authenticated
using (true);

drop policy if exists "catalog_attribute_definitions_admin_manage" on public.catalog_attribute_definitions;
create policy "catalog_attribute_definitions_admin_manage"
on public.catalog_attribute_definitions for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "catalog_attribute_options_admin_manage" on public.catalog_attribute_options;
create policy "catalog_attribute_options_admin_manage"
on public.catalog_attribute_options for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "sku_attribute_values_admin_manage" on public.sku_attribute_values;
create policy "sku_attribute_values_admin_manage"
on public.sku_attribute_values for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

revoke select on public.skus from anon;
grant select (id, product_id, sku, color, compatibility, moq, is_active) on public.skus to anon;
grant select on public.skus to authenticated;
grant select on public.catalog_attribute_definitions, public.catalog_attribute_options, public.sku_attribute_values to anon, authenticated;
grant insert, update, delete on public.catalog_attribute_definitions, public.catalog_attribute_options, public.sku_attribute_values to authenticated;

insert into public.catalog_attribute_definitions (key, label_it, label_zh, input_type, unit, sort_order)
values
  ('screen_technology', 'Tecnologia display', '屏幕技术', 'select', null, 10),
  ('with_frame', 'Con frame', '带框', 'boolean', null, 20),
  ('battery_capacity', 'Capacita batteria', '电池容量', 'number', 'mAh', 30),
  ('connector_type', 'Tipo connettore', '接口类型', 'select', null, 40),
  ('refresh_rate', 'Refresh rate', '刷新率', 'number', 'Hz', 50),
  ('warranty', 'Garanzia', '质保', 'select', null, 60)
on conflict (key) do update
set
  label_it = excluded.label_it,
  label_zh = excluded.label_zh,
  input_type = excluded.input_type,
  unit = excluded.unit,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.catalog_attribute_options (attribute_id, value, label_it, label_zh, sort_order)
select definition.id, option.value, option.label_it, option.label_zh, option.sort_order
from public.catalog_attribute_definitions definition
join (
  values
    ('screen_technology', 'soft-oled', 'Soft OLED', 'Soft OLED', 10),
    ('screen_technology', 'hard-oled', 'Hard OLED', 'Hard OLED', 20),
    ('screen_technology', 'incell', 'Incell / TFT', 'Incell / TFT', 30),
    ('screen_technology', 'service-pack', 'Service Pack', 'Service Pack', 40),
    ('with_frame', 'yes', 'Si', '是', 10),
    ('with_frame', 'no', 'No', '否', 20),
    ('connector_type', 'usb-c', 'USB-C', 'USB-C', 10),
    ('connector_type', 'lightning', 'Lightning', 'Lightning', 20),
    ('warranty', '3-months', '3 mesi', '3 个月', 10),
    ('warranty', '6-months', '6 mesi', '6 个月', 20),
    ('warranty', '12-months', '12 mesi', '12 个月', 30)
) as option(attribute_key, value, label_it, label_zh, sort_order)
on definition.key = option.attribute_key
on conflict (attribute_id, value) do update
set
  label_it = excluded.label_it,
  label_zh = excluded.label_zh,
  sort_order = excluded.sort_order;

drop view if exists public.catalog_private_items;
drop view if exists public.catalog_public_items;
drop view if exists public.catalog_attribute_values;

create view public.catalog_public_items
with (security_invoker = true)
as
select
  sku.id as sku_id,
  product.id as product_id,
  product.slug,
  sku.sku,
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
  sku.moq
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
  coalesce(inventory.stock_on_hand, 0) as stock_on_hand,
  coalesce(inventory.stock_reserved, 0) as stock_reserved,
  greatest(coalesce(inventory.stock_on_hand, 0) - coalesce(inventory.stock_reserved, 0), 0) as available_stock,
  coalesce(inventory.incoming_qty, 0) as incoming_qty
from public.skus sku
join public.products product on product.id = sku.product_id
left join public.categories category on category.slug = product.category
left join lateral (
  select
    sum(stock_on_hand)::integer as stock_on_hand,
    sum(stock_reserved)::integer as stock_reserved,
    sum(incoming_qty)::integer as incoming_qty
  from public.inventory
  where inventory.sku_id = sku.id
) inventory on true
where sku.is_active = true
  and product.is_active = true;

create view public.catalog_attribute_values
with (security_invoker = true)
as
select
  value.sku_id,
  definition.key,
  definition.label_it,
  definition.label_zh,
  definition.input_type,
  definition.unit,
  definition.is_filterable,
  definition.sort_order as attribute_sort_order,
  value.value,
  value.value_number,
  coalesce(option.label_it, value.value) as value_label_it,
  coalesce(option.label_zh, value.value) as value_label_zh,
  coalesce(option.sort_order, 100) as value_sort_order
from public.sku_attribute_values value
join public.catalog_attribute_definitions definition on definition.id = value.attribute_id
left join public.catalog_attribute_options option
  on option.attribute_id = definition.id
 and option.value = value.value;

grant select on public.catalog_public_items to anon, authenticated;
grant select on public.catalog_private_items to authenticated;
grant select on public.catalog_attribute_values to anon, authenticated;

create or replace function public.import_price_catalog_batch(batch_size integer default 500)
returns table(processed integer, products_upserted integer, skus_upserted integer, message text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  safe_batch_size integer := greatest(1, least(coalesce(batch_size, 500), 5000));
begin
  if to_regclass('public.price_products') is null
    or to_regclass('public.price_models') is null
    or to_regclass('public.price_part_categories') is null
  then
    processed := 0;
    products_upserted := 0;
    skus_upserted := 0;
    message := 'price_* source tables not found';
    return next;
    return;
  end if;

  execute $sql$
    with source as (
      select
        price_product.id,
        price_product.name,
        price_product.sku,
        price_product.description,
        coalesce(price_product.suggested_price, price_product.sale_price, 0) as retail_price,
        coalesce(price_product.sale_price, price_product.suggested_price, 0) as b2b_price,
        price_product.is_active,
        price_model.brand,
        price_model.model,
        price_category.name as category_name,
        coalesce(price_category.slug, public.catalog_slugify(price_category.name), 'parts') as category_slug
      from public.price_products price_product
      join public.price_models price_model on price_model.id = price_product.model_id
      join public.price_part_categories price_category on price_category.id = price_product.category_id
      where price_product.is_active = true
        and not exists (
          select 1
          from public.skus imported_sku
          where imported_sku.external_source = 'price_products'
            and imported_sku.external_id = price_product.id::text
        )
      order by price_product.created_at asc, price_product.id asc
      limit $1
    ),
    upsert_brands as (
      insert into public.brands (name, slug, external_source, external_id, external_payload)
      select distinct
        source.brand,
        coalesce(public.catalog_slugify(source.brand), 'brand-' || md5(source.brand)),
        'price_models_brand',
        coalesce(public.catalog_slugify(source.brand), md5(source.brand)),
        jsonb_build_object('source', 'price_models')
      from source
      where source.brand is not null and source.brand <> ''
      on conflict (slug) do update
      set name = excluded.name,
          external_payload = excluded.external_payload
      returning id
    ),
    upsert_categories as (
      insert into public.categories (slug, name_it, name_zh, external_source, external_id, external_payload)
      select distinct
        source.category_slug,
        source.category_name,
        source.category_name,
        'price_part_categories',
        source.category_slug,
        jsonb_build_object('source', 'price_part_categories')
      from source
      where source.category_slug is not null and source.category_slug <> ''
      on conflict (slug) do update
      set name_it = excluded.name_it,
          name_zh = excluded.name_zh,
          external_payload = excluded.external_payload
      returning id
    ),
    brand_rows as (
      select id, name, slug
      from public.brands
    ),
    upsert_models as (
      insert into public.phone_models (brand_id, name, slug, model_codes, external_source, external_id, external_payload)
      select distinct
        brand_rows.id,
        source.model,
        coalesce(
          public.catalog_slugify(source.brand || '-' || source.model),
          'model-' || md5(source.brand || '-' || source.model)
        ),
        array[source.model],
        'price_models',
        coalesce(public.catalog_slugify(source.brand || '-' || source.model), md5(source.brand || '-' || source.model)),
        jsonb_build_object('brand', source.brand, 'model', source.model)
      from source
      join brand_rows on brand_rows.slug = coalesce(public.catalog_slugify(source.brand), 'brand-' || md5(source.brand))
      where source.model is not null and source.model <> ''
      on conflict (slug) do update
      set name = excluded.name,
          model_codes = excluded.model_codes,
          external_payload = excluded.external_payload
      returning id
    ),
    upsert_products as (
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
      select
        coalesce(
          public.catalog_slugify(source.brand || '-' || source.model || '-' || source.category_slug || '-' || coalesce(source.sku, source.id::text)),
          'product-' || source.id::text
        ),
        source.brand,
        source.model,
        source.category_slug,
        'High Quality Compatible',
        source.name,
        source.name,
        source.description,
        source.description,
        null,
        true,
        'price_products',
        source.id::text,
        to_jsonb(source)
      from source
      on conflict (external_source, external_id) do update
      set slug = excluded.slug,
          brand = excluded.brand,
          model = excluded.model,
          category = excluded.category,
          name_it = excluded.name_it,
          name_zh = excluded.name_zh,
          description_it = excluded.description_it,
          description_zh = excluded.description_zh,
          is_active = excluded.is_active,
          external_payload = excluded.external_payload,
          updated_at = now()
      returning id, external_id
    ),
    source_products as (
      select source.*, product.id as product_id
      from source
      join public.products product
        on product.external_source = 'price_products'
       and product.external_id = source.id::text
    ),
    upsert_skus as (
      insert into public.skus (
        product_id,
        sku,
        color,
        compatibility,
        moq,
        retail_price,
        b2b_price,
        vat_rate,
        is_active,
        external_source,
        external_id,
        external_payload
      )
      select
        source_products.product_id,
        coalesce(nullif(source_products.sku, ''), 'PRICE-' || source_products.id::text),
        null,
        array_remove(array[source_products.model], null),
        1,
        source_products.retail_price,
        source_products.b2b_price,
        0.22,
        true,
        'price_products',
        source_products.id::text,
        to_jsonb(source_products)
      from source_products
      on conflict (external_source, external_id) do update
      set product_id = excluded.product_id,
          sku = excluded.sku,
          retail_price = excluded.retail_price,
          b2b_price = excluded.b2b_price,
          compatibility = excluded.compatibility,
          external_payload = excluded.external_payload,
          is_active = excluded.is_active,
          updated_at = now()
      returning id
    )
    select
      (select count(*)::integer from source),
      (select count(*)::integer from upsert_products),
      (select count(*)::integer from upsert_skus)
  $sql$
  into processed, products_upserted, skus_upserted
  using safe_batch_size;

  message := 'ok';
  return next;
end;
$$;

revoke all on function public.import_price_catalog_batch(integer) from public, anon, authenticated;
grant execute on function public.import_price_catalog_batch(integer) to service_role;
