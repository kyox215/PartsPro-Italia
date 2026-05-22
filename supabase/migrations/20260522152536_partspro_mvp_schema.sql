create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'customer'
    check (role in ('customer', 'sales', 'warehouse', 'purchasing', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_staff()
returns boolean
language sql
stable
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
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku_code text not null unique,
  name text not null,
  brand text not null,
  model text not null,
  model_code text not null default '',
  model_codes text[] not null default '{}',
  category text not null,
  quality_grade text not null,
  color text not null default '',
  frame text not null default 'N/A',
  stock_status text not null default 'incoming'
    check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'incoming')),
  moq integer not null default 1 check (moq > 0),
  cost_price numeric(12,2) not null default 0,
  retail_price numeric(12,2) not null default 0,
  b2b_price numeric(12,2) not null default 0,
  vat_mode text not null default 'IVA esclusa',
  warranty_days integer not null default 180,
  weight_gram integer not null default 0,
  stock_qty integer not null default 0,
  location text not null default '',
  batch_code text not null default '',
  supplier text not null default '',
  is_battery boolean not null default false,
  is_dangerous_goods boolean not null default false,
  msds_url text not null default '',
  un38_url text not null default '',
  compatibility jsonb not null default '[]'::jsonb,
  compatibility_models text[] not null default '{}',
  alternative_skus text[] not null default '{}',
  add_on_skus text[] not null default '{}',
  highlights text[] not null default '{}',
  tier_prices jsonb not null default '[]'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'draft', 'hidden', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_search_idx
  on public.products using gin (
    to_tsvector('simple', sku_code || ' ' || name || ' ' || brand || ' ' || model || ' ' || category)
  );

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create table if not exists public.price_groups (
  id text primary key,
  name text not null,
  description text not null default '',
  customer_count integer not null default 0,
  default_margin_percent numeric(5,2) not null default 0,
  payment_terms text not null default '',
  min_monthly_purchase text not null default '',
  visible_categories text[] not null default '{}',
  tier_rules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  vat_number text not null,
  sdi text not null default '',
  pec text not null default '',
  tier text not null default 'standard' check (tier in ('standard', 'silver', 'gold')),
  price_group_id text references public.price_groups(id),
  status text not null default 'pending' check (status in ('active', 'pending', 'suspended')),
  monthly_purchase text not null default '',
  orders_count integer not null default 0,
  revenue numeric(12,2) not null default 0,
  last_order_at timestamptz,
  credit_limit numeric(12,2) not null default 0,
  payment_terms text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_touch_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();

create table if not exists public.b2b_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null default '',
  whatsapp text not null default '',
  vat_number text not null,
  fiscal_code text not null default '',
  sdi text not null default '',
  pec text not null default '',
  company_type text not null default '',
  registered_address text not null default '',
  shipping_address text not null default '',
  monthly_purchase text not null default '',
  interested_categories text[] not null default '{}',
  payment_needs text[] not null default '{}',
  requested_price_group_id text references public.price_groups(id),
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected')),
  review_note text not null default '',
  accepts_terms boolean not null default false,
  accepts_privacy boolean not null default false,
  accepts_marketing boolean not null default false,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,
  supplier text not null,
  purchase_order text not null default '',
  status text not null default 'incoming'
    check (status in ('incoming', 'qc_hold', 'released', 'blocked')),
  qc_status text not null default 'pending' check (qc_status in ('pending', 'passed', 'failed')),
  sku_count integer not null default 0,
  received_at timestamptz,
  warehouse_location text not null default '',
  is_battery_batch boolean not null default false,
  msds_url text not null default '',
  un38_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger batches_touch_updated_at
before update on public.batches
for each row execute function public.touch_updated_at();

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku_code text not null references public.products(sku_code),
  product_name text not null,
  brand text not null default '',
  model text not null default '',
  quality_grade text not null default '',
  batch_code text not null default '',
  location text not null default '',
  actual_qty integer not null default 0,
  locked_qty integer not null default 0,
  available_qty integer not null default 0,
  incoming_qty integer not null default 0,
  qc_qty integer not null default 0,
  rma_qty integer not null default 0,
  defective_qty integer not null default 0,
  supplier text not null default '',
  last_movement_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null
    check (type in ('purchase_in', 'order_lock', 'ship_out', 'rma_in', 'qc_hold', 'adjustment')),
  sku_code text not null references public.products(sku_code),
  batch_code text not null default '',
  location text not null default '',
  quantity integer not null,
  reference text not null default '',
  operator text not null default '',
  note text not null default ''
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid references public.customers(id),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_tier text not null default 'standard',
  status text not null default 'submitted'
    check (status in ('submitted', 'accepted', 'picking', 'packed', 'shipped', 'completed')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'bank_waiting', 'failed')),
  stock_risk text not null default 'clear'
    check (stock_risk in ('clear', 'low', 'split', 'blocked')),
  total_net numeric(12,2) not null default 0,
  vat numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  shipping_method text not null default '',
  fiscal jsonb not null default '{}'::jsonb,
  delivery_address text not null default '',
  customer_note text not null default '',
  staff_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku_code text not null references public.products(sku_code),
  product_name text not null,
  quality_grade text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  stock_status text not null default 'available',
  batch_code text not null default '',
  location text not null default ''
);

create table if not exists public.rma_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_no text not null,
  sku_code text not null,
  status text not null default 'submitted',
  problem_type text not null default '',
  description text not null default '',
  evidence_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger rma_requests_touch_updated_at
before update on public.rma_requests
for each row execute function public.touch_updated_at();

create or replace function public.staff_ship_order(target_order_id uuid)
returns public.orders
language plpgsql
as $$
declare
  shipped_order public.orders;
begin
  if not private.is_staff() then
    raise exception 'staff access required';
  end if;

  update public.orders
  set status = 'shipped',
      staff_note = trim(coalesce(staff_note, '') || ' staff_ship_order RPC called.')
  where id = target_order_id
  returning * into shipped_order;

  if shipped_order.id is null then
    raise exception 'order not found';
  end if;

  return shipped_order;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.price_groups enable row level security;
alter table public.customers enable row level security;
alter table public.b2b_applications enable row level security;
alter table public.batches enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.rma_requests enable row level security;

create policy "profiles_self_select" on public.profiles
for select to authenticated using (id = auth.uid() or private.is_staff());
create policy "profiles_staff_all" on public.profiles
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "products_public_active_select" on public.products
for select to anon, authenticated using (status = 'active');
create policy "products_staff_all" on public.products
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "price_groups_staff_select" on public.price_groups
for select to authenticated using (private.is_staff());
create policy "price_groups_staff_all" on public.price_groups
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "customers_self_select" on public.customers
for select to authenticated using (user_id = auth.uid() or private.is_staff());
create policy "customers_staff_all" on public.customers
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "b2b_public_insert" on public.b2b_applications
for insert to anon, authenticated with check (accepts_terms = true and accepts_privacy = true);
create policy "b2b_staff_all" on public.b2b_applications
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "batches_staff_all" on public.batches
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "inventory_staff_all" on public.inventory_items
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "stock_movements_staff_all" on public.stock_movements
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "orders_self_select" on public.orders
for select to authenticated using (user_id = auth.uid() or private.is_staff());
create policy "orders_staff_all" on public.orders
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "order_lines_self_select" on public.order_lines
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_lines.order_id
      and (orders.user_id = auth.uid() or private.is_staff())
  )
);
create policy "order_lines_staff_all" on public.order_lines
for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy "rma_self_select_insert" on public.rma_requests
for select to authenticated using (user_id = auth.uid() or private.is_staff());
create policy "rma_self_insert" on public.rma_requests
for insert to authenticated with check (user_id = auth.uid());
create policy "rma_staff_all" on public.rma_requests
for all to authenticated using (private.is_staff()) with check (private.is_staff());

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert on public.b2b_applications to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.price_groups,
  public.customers,
  public.b2b_applications,
  public.batches,
  public.inventory_items,
  public.stock_movements,
  public.orders,
  public.order_lines,
  public.rma_requests
to authenticated;
grant execute on function public.staff_ship_order(uuid) to authenticated;

insert into public.price_groups (
  id, name, description, customer_count, default_margin_percent,
  payment_terms, min_monthly_purchase, visible_categories, tier_rules
) values
  (
    'pg-standard-b2b',
    'Standard B2B',
    'Listino base per clienti approvati e piccoli laboratori.',
    34,
    32,
    'Stripe / PayPal / Bonifico anticipato',
    '< €1.000',
    array['Screens', 'Batteries', 'Charging Ports', 'Tools'],
    '[{"minQty":1,"unitPrice":32},{"minQty":5,"unitPrice":30.8}]'::jsonb
  ),
  (
    'pg-silver-shop',
    'Silver Repair Shop',
    'Prezzi dedicati a negozi con acquisto ricorrente.',
    18,
    26,
    'Bonifico anticipato / 7gg previa approvazione',
    '€1.000 - €3.000',
    array['Screens', 'Batteries', 'Charging Ports', 'Back Covers'],
    '[{"minQty":1,"unitPrice":30.8},{"minQty":10,"unitPrice":29.6}]'::jsonb
  ),
  (
    'pg-gold-lab',
    'Gold Lab / Reseller',
    'Listino alto volume per laboratori e rivenditori.',
    9,
    20,
    'Bonifico 7gg / 15gg con limite credito',
    '€3.000+',
    array['Screens', 'Batteries', 'Charging Ports', 'Back Covers', 'Cameras'],
    '[{"minQty":1,"unitPrice":29.8},{"minQty":20,"unitPrice":28.4}]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  customer_count = excluded.customer_count,
  default_margin_percent = excluded.default_margin_percent,
  payment_terms = excluded.payment_terms,
  min_monthly_purchase = excluded.min_monthly_purchase,
  visible_categories = excluded.visible_categories,
  tier_rules = excluded.tier_rules,
  updated_at = now();

insert into public.products (
  sku_code, name, brand, model, model_code, model_codes, category,
  quality_grade, color, frame, stock_status, moq, cost_price,
  retail_price, b2b_price, warranty_days, weight_gram, stock_qty,
  location, batch_code, supplier, is_battery, is_dangerous_goods,
  msds_url, un38_url, compatibility, compatibility_models,
  alternative_skus, add_on_skus, highlights, tier_prices, status
) values
  (
    'IP11-SCR-SOFT-BLK',
    'iPhone 11 Display Soft OLED Black Without Frame',
    'Apple',
    'iPhone 11',
    'A2111 / A2221 / A2223',
    array['A2111', 'A2221', 'A2223'],
    'Screens',
    'Soft OLED',
    'Black',
    'Without Frame',
    'in_stock',
    1,
    24.8,
    49.9,
    32,
    180,
    92,
    46,
    'A-01-03',
    'BATCH-MI-0520',
    'Shenzhen Display Co.',
    false,
    false,
    '',
    '',
    '[{"model":"iPhone 11","code":"A2111 / A2221 / A2223","note":"Compatibile"}]'::jsonb,
    array['iPhone 11 A2111', 'iPhone 11 A2221', 'iPhone 11 A2223'],
    array['IP11-SCR-HARD-BLK', 'IP11-SCR-TFT-BLK'],
    array['TOOL-WATERPROOF-SET'],
    array['Test before installation', 'B2B price after login', 'RMA tracciabile'],
    '[{"minQty":5,"unitPrice":30.8},{"minQty":10,"unitPrice":29.6}]'::jsonb,
    'active'
  ),
  (
    'IP12-BAT-HQ-2815',
    'iPhone 12 Battery 2815mAh Compatible High Quality',
    'Apple',
    'iPhone 12',
    'A2172 / A2402 / A2403',
    array['A2172', 'A2402', 'A2403'],
    'Batteries',
    'High Quality Compatible',
    'Black',
    'N/A',
    'low_stock',
    1,
    9.8,
    24.9,
    14.5,
    180,
    48,
    25,
    'B-04-02',
    'BATCH-BAT-0418',
    'Battery Lab HK',
    true,
    true,
    'MSDS-IP12-BAT-HQ.pdf',
    'UN38.3-IP12-BAT-HQ.pdf',
    '[{"model":"iPhone 12","code":"A2172 / A2402 / A2403","note":"Verificare connettore"}]'::jsonb,
    array['iPhone 12 A2172', 'iPhone 12 A2402', 'iPhone 12 A2403'],
    array['IP12-BAT-OEM-PULL'],
    array['TOOL-WATERPROOF-SET'],
    array['Battery safety notice', 'MSDS/UN38.3 required', 'Low stock'],
    '[{"minQty":5,"unitPrice":13.8},{"minQty":20,"unitPrice":12.9}]'::jsonb,
    'active'
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
  updated_at = now();
