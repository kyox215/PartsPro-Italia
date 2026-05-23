create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('sales', 'warehouse', 'purchasing', 'admin')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.stock_status_for_order_line(product_stock_status text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case product_stock_status
    when 'in_stock' then 'available'
    when 'low_stock' then 'low_stock'
    when 'incoming' then 'incoming'
    else 'reserved'
  end;
$$;

create or replace function private.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  requested_role text := coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'customer');
begin
  if requested_role not in ('customer', 'sales', 'warehouse', 'purchasing', 'admin') then
    requested_role := 'customer';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), requested_role)
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function private.handle_new_user_profile();

create table if not exists public.catalog_taxonomy (
  id text primary key default 'default',
  groups jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists catalog_taxonomy_touch_updated_at on public.catalog_taxonomy;
create trigger catalog_taxonomy_touch_updated_at
before update on public.catalog_taxonomy
for each row execute function public.touch_updated_at();

alter table public.catalog_taxonomy enable row level security;

drop policy if exists "catalog_taxonomy_public_select" on public.catalog_taxonomy;
create policy "catalog_taxonomy_public_select" on public.catalog_taxonomy
for select to anon, authenticated
using (id = 'default');

drop policy if exists "catalog_taxonomy_staff_all" on public.catalog_taxonomy;
create policy "catalog_taxonomy_staff_all" on public.catalog_taxonomy
for all to authenticated
using (private.is_staff())
with check (private.is_staff());

grant select on public.catalog_taxonomy to anon, authenticated;
grant insert, update, delete on public.catalog_taxonomy to authenticated;

insert into public.catalog_taxonomy (id, groups)
values (
  'default',
  '[
    {
      "id": "brand-apple",
      "labelZh": "Apple",
      "labelIt": "Apple",
      "value": "Apple",
      "children": [
        {
          "id": "model-apple-iphone-11",
          "labelZh": "iPhone 11",
          "labelIt": "iPhone 11",
          "value": "iPhone 11",
          "children": [
            {"id": "cat-apple-iphone-11-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"},
            {"id": "cat-apple-iphone-11-tools", "labelZh": "防水胶 / 耗材", "labelIt": "Adesivi e consumabili", "value": "Tools"}
          ]
        },
        {
          "id": "model-apple-iphone-12",
          "labelZh": "iPhone 12",
          "labelIt": "iPhone 12",
          "value": "iPhone 12",
          "children": [
            {"id": "cat-apple-iphone-12-batteries", "labelZh": "电池", "labelIt": "Batterie", "value": "Batteries"},
            {"id": "cat-apple-iphone-12-tools", "labelZh": "防水胶 / 耗材", "labelIt": "Adesivi e consumabili", "value": "Tools"}
          ]
        },
        {
          "id": "model-apple-iphone-13",
          "labelZh": "iPhone 13",
          "labelIt": "iPhone 13",
          "value": "iPhone 13",
          "children": [
            {"id": "cat-apple-iphone-13-cameras", "labelZh": "摄像头", "labelIt": "Fotocamere", "value": "Cameras"},
            {"id": "cat-apple-iphone-13-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"}
          ]
        }
      ]
    },
    {
      "id": "brand-samsung",
      "labelZh": "Samsung",
      "labelIt": "Samsung",
      "value": "Samsung",
      "children": [
        {
          "id": "model-samsung-a52",
          "labelZh": "Galaxy A52",
          "labelIt": "Galaxy A52",
          "value": "Galaxy A52",
          "children": [
            {"id": "cat-samsung-a52-charging", "labelZh": "尾插小板", "labelIt": "Connettori ricarica", "value": "Charging Ports"},
            {"id": "cat-samsung-a52-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"}
          ]
        },
        {
          "id": "model-samsung-s21",
          "labelZh": "Galaxy S21",
          "labelIt": "Galaxy S21",
          "value": "Galaxy S21",
          "children": [
            {"id": "cat-samsung-s21-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"},
            {"id": "cat-samsung-s21-charging", "labelZh": "尾插小板", "labelIt": "Connettori ricarica", "value": "Charging Ports"}
          ]
        }
      ]
    },
    {
      "id": "brand-xiaomi",
      "labelZh": "Xiaomi",
      "labelIt": "Xiaomi",
      "value": "Xiaomi",
      "children": [
        {
          "id": "model-xiaomi-redmi-note-10",
          "labelZh": "Redmi Note 10",
          "labelIt": "Redmi Note 10",
          "value": "Redmi Note 10",
          "children": [
            {"id": "cat-xiaomi-rn10-back-cover", "labelZh": "后盖", "labelIt": "Cover posteriori", "value": "Back Covers"},
            {"id": "cat-xiaomi-rn10-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"}
          ]
        }
      ]
    },
    {
      "id": "brand-huawei",
      "labelZh": "Huawei",
      "labelIt": "Huawei",
      "value": "Huawei",
      "children": [
        {
          "id": "model-huawei-p-series",
          "labelZh": "P 系列",
          "labelIt": "Serie P",
          "value": "P Series",
          "children": [
            {"id": "cat-huawei-p-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"},
            {"id": "cat-huawei-p-batteries", "labelZh": "电池", "labelIt": "Batterie", "value": "Batteries"}
          ]
        }
      ]
    },
    {
      "id": "brand-oppo",
      "labelZh": "Oppo",
      "labelIt": "Oppo",
      "value": "Oppo",
      "children": [
        {
          "id": "model-oppo-reno",
          "labelZh": "Reno 系列",
          "labelIt": "Serie Reno",
          "value": "Reno Series",
          "children": [
            {"id": "cat-oppo-reno-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"},
            {"id": "cat-oppo-reno-charging", "labelZh": "尾插小板", "labelIt": "Connettori ricarica", "value": "Charging Ports"}
          ]
        }
      ]
    },
    {
      "id": "brand-honor",
      "labelZh": "Honor",
      "labelIt": "Honor",
      "value": "Honor",
      "children": [
        {
          "id": "model-honor-number",
          "labelZh": "数字系列",
          "labelIt": "Serie numerica",
          "value": "Number Series",
          "children": [
            {"id": "cat-honor-number-screens", "labelZh": "屏幕总成", "labelIt": "Schermi", "value": "Screens"},
            {"id": "cat-honor-number-batteries", "labelZh": "电池", "labelIt": "Batterie", "value": "Batteries"}
          ]
        }
      ]
    }
  ]'::jsonb
)
on conflict (id) do nothing;

alter table public.rma_requests
  add column if not exists quantity integer not null default 1 check (quantity > 0),
  add column if not exists tested_before_install boolean not null default false,
  add column if not exists installed boolean not null default false,
  add column if not exists has_physical_damage boolean not null default false,
  add column if not exists requested_resolution text not null default 'replacement'
    check (requested_resolution in ('replacement', 'refund', 'credit_note')),
  add column if not exists order_line_id uuid references public.order_lines(id) on delete set null;

create index if not exists b2b_applications_requested_price_group_id_idx
  on public.b2b_applications (requested_price_group_id);
create index if not exists customers_price_group_id_idx on public.customers (price_group_id);
create index if not exists customers_user_id_idx on public.customers (user_id);
create index if not exists inventory_items_sku_code_idx on public.inventory_items (sku_code);
create index if not exists order_events_actor_id_idx on public.order_events (actor_id);
create index if not exists order_events_order_id_idx on public.order_events (order_id);
create index if not exists order_lines_order_id_idx on public.order_lines (order_id);
create index if not exists order_lines_sku_code_idx on public.order_lines (sku_code);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists rma_requests_user_id_idx on public.rma_requests (user_id);
create index if not exists rma_requests_order_no_idx on public.rma_requests (order_no);
create index if not exists stock_movements_sku_code_idx on public.stock_movements (sku_code);

drop policy if exists "product_images_public_read" on storage.objects;

insert into public.products (
  sku_code, name, brand, model, model_code, model_codes, category,
  quality_grade, color, frame, stock_status, moq, cost_price,
  retail_price, b2b_price, warranty_days, weight_gram, stock_qty,
  location, batch_code, supplier, is_battery, is_dangerous_goods,
  msds_url, un38_url, compatibility, compatibility_models,
  alternative_skus, add_on_skus, highlights, tier_prices, status,
  image_path, image_alt
) values
  (
    'SA52-CHG-EU-BLK',
    'Samsung Galaxy A52 Charging Port Flex EU Version',
    'Samsung',
    'Galaxy A52',
    'SM-A525F / SM-A526B',
    array['SM-A525F', 'SM-A526B'],
    'Charging Ports',
    'Compatible High Quality',
    'Black',
    'N/A',
    'in_stock',
    2,
    3.2,
    12.9,
    5.9,
    120,
    14,
    8,
    'C-02-01',
    'BATCH-CHG-0422',
    'FlexParts EU',
    false,
    false,
    '',
    '',
    '[{"model":"Galaxy A52","code":"SM-A525F","note":"EU version"},{"model":"Galaxy A52 5G","code":"SM-A526B","note":"Verificare versione"}]'::jsonb,
    array['Galaxy A52 SM-A525F', 'Galaxy A52 5G SM-A526B'],
    array[]::text[],
    array['TOOL-WATERPROOF-SET'],
    array['EU version', 'MOQ 2', 'Fast dispatch'],
    '[{"minQty":10,"unitPrice":5.5},{"minQty":30,"unitPrice":5.1}]'::jsonb,
    'active',
    'charging-ports/SA52-CHG-EU-BLK.webp',
    'Samsung Galaxy A52 charging port flex EU version'
  ),
  (
    'RN10-BKC-BLU',
    'Xiaomi Redmi Note 10 Back Cover Blue',
    'Xiaomi',
    'Redmi Note 10',
    'M2101K7AG',
    array['M2101K7AG'],
    'Back Covers',
    'Compatible High Quality',
    'Blue',
    'N/A',
    'incoming',
    1,
    4.5,
    14.9,
    7.8,
    90,
    32,
    0,
    'INCOMING',
    'BATCH-XIA-0501',
    'CoverLab SZ',
    false,
    false,
    '',
    '',
    '[{"model":"Redmi Note 10","code":"M2101K7AG","note":"Blue version"}]'::jsonb,
    array['Redmi Note 10 M2101K7AG'],
    array[]::text[],
    array[]::text[],
    array['Incoming stock', 'Color matched', 'B2B reserved price'],
    '[{"minQty":10,"unitPrice":7.2},{"minQty":30,"unitPrice":6.8}]'::jsonb,
    'active',
    'back-covers/RN10-BKC-BLU.webp',
    'Xiaomi Redmi Note 10 blue back cover'
  ),
  (
    'IP13-CAM-REAR',
    'iPhone 13 Rear Camera Compatible Module',
    'Apple',
    'iPhone 13',
    'A2482 / A2631 / A2633',
    array['A2482', 'A2631', 'A2633'],
    'Cameras',
    'Refurbished Original',
    'Black',
    'N/A',
    'out_of_stock',
    1,
    26.5,
    59.9,
    38,
    120,
    18,
    0,
    'OUT',
    'BATCH-CAM-0319',
    'Camera Refurb EU',
    false,
    false,
    '',
    '',
    '[{"model":"iPhone 13","code":"A2482 / A2631 / A2633","note":"Verificare iOS warning"}]'::jsonb,
    array['iPhone 13 A2482', 'iPhone 13 A2631', 'iPhone 13 A2633'],
    array[]::text[],
    array[]::text[],
    array['Out of stock', 'Alternative SKU recommended', 'RMA rules apply'],
    '[{"minQty":5,"unitPrice":36.5},{"minQty":10,"unitPrice":35.5}]'::jsonb,
    'active',
    'cameras/IP13-CAM-REAR.webp',
    'iPhone 13 rear camera compatible module'
  ),
  (
    'TOOL-WATERPROOF-SET',
    'Waterproof Adhesive Set for iPhone 11/12 Series',
    'PartsPro',
    'iPhone 11/12 Series',
    'Universal',
    array['Universal'],
    'Tools',
    'Consumable',
    'Mixed',
    'N/A',
    'in_stock',
    5,
    0.45,
    3.2,
    1.2,
    30,
    3,
    240,
    'T-01-01',
    'BATCH-TOOL-0502',
    'PartsPro Consumables',
    false,
    false,
    '',
    '',
    '[{"model":"iPhone 11/12 Series","code":"Universal","note":"Scegliere modello corretto"}]'::jsonb,
    array['Universal'],
    array[]::text[],
    array[]::text[],
    array['Add-on item', 'MOQ 5', 'Recommended with screens'],
    '[{"minQty":20,"unitPrice":1.05},{"minQty":100,"unitPrice":0.95}]'::jsonb,
    'active',
    'tools/TOOL-WATERPROOF-SET.webp',
    'Waterproof adhesive set for iPhone 11 and 12 series'
  )
on conflict (sku_code) do update set
  name = excluded.name,
  brand = excluded.brand,
  model = excluded.model,
  model_code = excluded.model_code,
  model_codes = excluded.model_codes,
  category = excluded.category,
  quality_grade = excluded.quality_grade,
  color = excluded.color,
  frame = excluded.frame,
  stock_status = excluded.stock_status,
  moq = excluded.moq,
  cost_price = excluded.cost_price,
  retail_price = excluded.retail_price,
  b2b_price = excluded.b2b_price,
  warranty_days = excluded.warranty_days,
  weight_gram = excluded.weight_gram,
  stock_qty = excluded.stock_qty,
  location = excluded.location,
  batch_code = excluded.batch_code,
  supplier = excluded.supplier,
  is_battery = excluded.is_battery,
  is_dangerous_goods = excluded.is_dangerous_goods,
  msds_url = excluded.msds_url,
  un38_url = excluded.un38_url,
  compatibility = excluded.compatibility,
  compatibility_models = excluded.compatibility_models,
  alternative_skus = excluded.alternative_skus,
  add_on_skus = excluded.add_on_skus,
  highlights = excluded.highlights,
  tier_prices = excluded.tier_prices,
  status = excluded.status,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  updated_at = now();
