create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'customer'
    check (role in ('admin', 'manager', 'staff', 'warehouse', 'customer', 'b2b_customer')),
  locale text not null default 'it'
    check (locale in ('it', 'en', 'zh')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  customer_type text not null default 'retail'
    check (customer_type in ('retail', 'b2b')),
  company_name text,
  vat_number text,
  codice_fiscale text,
  sdi text,
  pec text,
  phone text,
  whatsapp text,
  billing_address jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  price_group text not null default 'retail'
    check (price_group in ('retail', 'b2b_basic', 'silver', 'gold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id)
);

create table public.brands (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name_it text not null,
  name_en text not null,
  name_zh text not null,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name_it text not null,
  name_en text not null,
  name_zh text not null,
  slug text not null unique,
  description_it text,
  description_en text,
  description_zh text,
  product_type text not null
    check (product_type in ('screen', 'battery', 'flex', 'tool', 'back_cover', 'camera', 'speaker', 'charging_port', 'adhesive', 'accessory')),
  phone_model text,
  model_codes text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_skus (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  barcode text,
  quality_grade text not null default 'A'
    check (quality_grade in ('A+', 'A', 'B', 'C')),
  color text,
  frame_type text
    check (frame_type is null or frame_type in ('with_frame', 'without_frame')),
  retail_price numeric(12, 2) not null check (retail_price >= 0),
  b2b_price numeric(12, 2) check (b2b_price is null or b2b_price >= 0),
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  vat_rate numeric(5, 2) not null default 22 check (vat_rate >= 0),
  moq integer not null default 1 check (moq >= 1),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  is_battery boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default extensions.gen_random_uuid(),
  sku_id uuid not null unique references public.product_skus(id) on delete cascade,
  quantity_available integer not null default 0 check (quantity_available >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  quantity_incoming integer not null default 0 check (quantity_incoming >= 0),
  warehouse_location text,
  batch_number text,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'defective', 'quarantine')),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  vat_total numeric(12, 2) not null default 0 check (vat_total >= 0),
  shipping_total numeric(12, 2) not null default 0 check (shipping_total >= 0),
  grand_total numeric(12, 2) not null default 0 check (grand_total >= 0),
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  sku_id uuid not null references public.product_skus(id) on delete restrict,
  sku_snapshot jsonb not null default '{}'::jsonb,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  vat_rate numeric(5, 2) not null default 22 check (vat_rate >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, sku_id)
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function private.set_updated_at();

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function private.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();

create trigger product_skus_set_updated_at
  before update on public.product_skus
  for each row execute function private.set_updated_at();

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function private.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

create index idx_customers_profile_id on public.customers(profile_id);
create index idx_brands_slug on public.brands(slug);
create index idx_categories_parent_id on public.categories(parent_id);
create index idx_categories_slug on public.categories(slug);
create index idx_products_brand_id on public.products(brand_id);
create index idx_products_category_id on public.products(category_id);
create index idx_products_slug on public.products(slug);
create index idx_products_status on public.products(status);
create index idx_product_skus_product_id on public.product_skus(product_id);
create index idx_product_skus_sku on public.product_skus(sku);
create index idx_inventory_sku_id on public.inventory(sku_id);
create index idx_orders_customer_id on public.orders(customer_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_sku_id on public.order_items(sku_id);

create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
$$;

create or replace function private.has_backoffice_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(private.current_profile_role() in ('admin', 'manager', 'staff'), false)
$$;

create or replace function private.has_inventory_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(private.current_profile_role() in ('admin', 'manager', 'staff', 'warehouse'), false)
$$;

create or replace function private.owns_customer(customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.customers as c
    where c.id = customer_id
      and c.profile_id = auth.uid()
  )
$$;

create or replace function private.owns_order(order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.orders as o
    join public.customers as c on c.id = o.customer_id
    where o.id = order_id
      and c.profile_id = auth.uid()
  )
$$;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.has_backoffice_access() to authenticated;
grant execute on function private.has_inventory_access() to authenticated;
grant execute on function private.owns_customer(uuid) to authenticated;
grant execute on function private.owns_order(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_skus enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles select own or backoffice"
on public.profiles for select to authenticated
using (id = auth.uid() or private.has_backoffice_access());

create policy "profiles insert own customer profile"
on public.profiles for insert to authenticated
with check (id = auth.uid() and role = 'customer');

create policy "profiles backoffice manage"
on public.profiles for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "customers select own or backoffice"
on public.customers for select to authenticated
using (profile_id = auth.uid() or private.has_backoffice_access());

create policy "customers insert own pending retail"
on public.customers for insert to authenticated
with check (
  profile_id = auth.uid()
  and status = 'pending'
  and price_group = 'retail'
);

create policy "customers backoffice manage"
on public.customers for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "brands public read active"
on public.brands for select to anon, authenticated
using (is_active = true);

create policy "brands backoffice manage"
on public.brands for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "categories public read active"
on public.categories for select to anon, authenticated
using (is_active = true);

create policy "categories backoffice manage"
on public.categories for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "products public read active"
on public.products for select to anon, authenticated
using (status = 'active');

create policy "products backoffice manage"
on public.products for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "product skus public read active"
on public.product_skus for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products as p
    where p.id = product_skus.product_id
      and p.status = 'active'
  )
);

create policy "product skus backoffice manage"
on public.product_skus for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "inventory public read active sku availability"
on public.inventory for select to anon, authenticated
using (
  exists (
    select 1
    from public.product_skus as ps
    join public.products as p on p.id = ps.product_id
    where ps.id = inventory.sku_id
      and ps.is_active = true
      and p.status = 'active'
  )
);

create policy "inventory backoffice manage"
on public.inventory for all to authenticated
using (private.has_inventory_access())
with check (private.has_inventory_access());

create policy "orders select own or backoffice"
on public.orders for select to authenticated
using (private.owns_customer(customer_id) or private.has_backoffice_access());

create policy "orders insert own customer"
on public.orders for insert to authenticated
with check (private.owns_customer(customer_id));

create policy "orders backoffice manage"
on public.orders for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

create policy "order items select own or backoffice"
on public.order_items for select to authenticated
using (private.owns_order(order_id) or private.has_backoffice_access());

create policy "order items insert own order"
on public.order_items for insert to authenticated
with check (private.owns_order(order_id));

create policy "order items backoffice manage"
on public.order_items for all to authenticated
using (private.has_backoffice_access())
with check (private.has_backoffice_access());

grant usage on schema public to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
revoke all on public.customers from anon, authenticated;
revoke all on public.brands from anon, authenticated;
revoke all on public.categories from anon, authenticated;
revoke all on public.products from anon, authenticated;
revoke all on public.product_skus from anon, authenticated;
revoke all on public.inventory from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;

grant select, insert on public.profiles to authenticated;
grant select, insert on public.customers to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

grant select on public.brands to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;

grant select (
  id,
  product_id,
  sku,
  barcode,
  quality_grade,
  color,
  frame_type,
  retail_price,
  vat_rate,
  moq,
  weight_grams,
  is_battery,
  is_active,
  created_at,
  updated_at
) on public.product_skus to anon, authenticated;

grant select (
  id,
  sku_id,
  quantity_available,
  status,
  low_stock_threshold,
  updated_at
) on public.inventory to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('category-icons', 'category-icons', true, 1048576, array['image/svg+xml', 'image/png', 'image/webp']),
  ('brand-logos', 'brand-logos', true, 1048576, array['image/svg+xml', 'image/png', 'image/webp']),
  ('rma-uploads', 'rma-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public read catalog storage"
on storage.objects for select to anon, authenticated
using (bucket_id in ('product-images', 'category-icons', 'brand-logos'));

create policy "authenticated read own rma uploads"
on storage.objects for select to authenticated
using (
  bucket_id = 'rma-uploads'
  and owner = auth.uid()
);

create policy "authenticated upload own rma files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rma-uploads'
  and owner = auth.uid()
);

create policy "backoffice manage catalog storage"
on storage.objects for all to authenticated
using (
  bucket_id in ('product-images', 'category-icons', 'brand-logos')
  and private.has_inventory_access()
)
with check (
  bucket_id in ('product-images', 'category-icons', 'brand-logos')
  and private.has_inventory_access()
);
