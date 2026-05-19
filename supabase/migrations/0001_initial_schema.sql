create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum (
    'retail',
    'b2b_pending',
    'b2b_basic',
    'b2b_silver',
    'b2b_gold',
    'distributor',
    'admin'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'draft',
    'checkout_created',
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'completed',
    'cancelled',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.rma_status as enum (
    'submitted',
    'waiting_information',
    'approved_return',
    'waiting_receive',
    'testing',
    'approved',
    'rejected',
    'replacement_sent',
    'refund_processing',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

create schema if not exists app_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  preferred_locale text not null default 'it',
  role public.user_role not null default 'retail',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  vat_number text,
  fiscal_code text,
  sdi text,
  pec text,
  billing_address text,
  shipping_address text,
  contact_name text,
  phone text,
  whatsapp text,
  company_type text,
  monthly_volume text,
  interested_categories text,
  status text not null default 'pending',
  price_group text not null default 'retail',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2b_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  company_name text not null,
  vat_number text,
  email text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.phone_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null unique,
  model_codes text[] not null default '{}'
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_it text not null,
  name_zh text not null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  model text not null,
  category text not null,
  quality_grade text not null,
  name_it text not null,
  name_zh text not null,
  description_it text,
  description_zh text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skus (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color text,
  compatibility text[] not null default '{}',
  moq integer not null default 1 check (moq > 0),
  retail_price numeric(12,2) not null check (retail_price >= 0),
  b2b_price numeric(12,2) not null check (b2b_price >= 0),
  vat_rate numeric(4,2) not null default 0.22,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  warehouse_code text not null default 'MAIN',
  location_code text,
  stock_on_hand integer not null default 0,
  stock_reserved integer not null default 0,
  incoming_qty integer not null default 0,
  batch_code text,
  updated_at timestamptz not null default now()
);

create table if not exists public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references public.skus(id) on delete cascade,
  price_group text not null default 'b2b_basic',
  min_qty integer not null check (min_qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unique (sku_id, price_group, min_qty)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'draft',
  payment_method text not null,
  stripe_checkout_session_id text,
  email text,
  customer_name text,
  company_name text,
  vat_number text,
  fiscal_code text,
  sdi text,
  pec text,
  shipping_address text,
  subtotal numeric(12,2) not null default 0,
  vat numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  vat_rate numeric(4,2) not null default 0.22,
  created_at timestamptz not null default now()
);

create table if not exists public.rmas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status public.rma_status not null default 'submitted',
  order_number text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  issue_type text not null,
  description text,
  installation_tested boolean,
  installed boolean,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app_private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.b2b_applications enable row level security;
alter table public.brands enable row level security;
alter table public.phone_models enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.skus enable row level security;
alter table public.inventory enable row level security;
alter table public.price_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.rmas enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or app_private.current_user_role() = 'admin')
with check (id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "companies_owner_or_admin"
on public.companies for all
to authenticated
using (owner_id = auth.uid() or app_private.current_user_role() = 'admin')
with check (owner_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "b2b_applications_admin_read"
on public.b2b_applications for select
to authenticated
using (app_private.current_user_role() = 'admin');

create policy "public_read_active_products"
on public.products for select
to anon, authenticated
using (is_active = true);

create policy "public_read_active_skus"
on public.skus for select
to anon, authenticated
using (is_active = true);

create policy "public_read_reference_data"
on public.brands for select
to anon, authenticated
using (true);

create policy "public_read_models"
on public.phone_models for select
to anon, authenticated
using (true);

create policy "public_read_categories"
on public.categories for select
to anon, authenticated
using (true);

create policy "authenticated_read_inventory"
on public.inventory for select
to authenticated
using (true);

create policy "authenticated_read_price_tiers"
on public.price_tiers for select
to authenticated
using (true);

create policy "orders_owner_or_admin"
on public.orders for select
to authenticated
using (profile_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "order_items_owner_or_admin"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.profile_id = auth.uid() or app_private.current_user_role() = 'admin')
  )
);

create policy "rmas_owner_or_admin"
on public.rmas for select
to authenticated
using (profile_id = auth.uid() or app_private.current_user_role() = 'admin');

create policy "admin_manage_catalog"
on public.products for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create policy "admin_manage_skus"
on public.skus for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create policy "admin_manage_inventory"
on public.inventory for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create policy "admin_manage_orders"
on public.orders for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

create policy "admin_manage_rmas"
on public.rmas for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

grant usage on schema public to anon, authenticated;
grant select on public.brands, public.phone_models, public.categories, public.products, public.skus to anon, authenticated;
grant select on public.inventory, public.price_tiers to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.companies to authenticated;
grant select on public.orders, public.order_items, public.rmas to authenticated;
