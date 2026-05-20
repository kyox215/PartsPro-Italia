alter table public.products
  add column if not exists archived_at timestamptz;

alter table public.skus
  add column if not exists archived_at timestamptz;

alter table public.companies
  add column if not exists contact_email text,
  add column if not exists crm_status text not null default 'lead',
  add column if not exists assigned_admin_id uuid references public.profiles(id) on delete set null,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists source_application_id uuid references public.b2b_applications(id) on delete set null;

alter table public.inventory
  add column if not exists reorder_point integer not null default 0 check (reorder_point >= 0),
  add column if not exists safety_stock integer not null default 0 check (safety_stock >= 0);

alter table public.inventory_movements
  drop constraint if exists inventory_movements_movement_type_check;

alter table public.inventory_movements
  add constraint inventory_movements_movement_type_check
  check (
    movement_type in (
      'excel_import',
      'receive_stock',
      'mark_shortage',
      'reserve_stock',
      'reserve_incoming',
      'release_reservation',
      'allocate_preorder',
      'ship_stock',
      'manual_adjustment',
      'stock_correction',
      'low_stock_review'
    )
  );

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'slate',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_tag_links (
  company_id uuid not null references public.companies(id) on delete cascade,
  tag_id uuid not null references public.customer_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_id, tag_id)
);

create index if not exists companies_crm_status_idx
  on public.companies (crm_status, updated_at desc);

create index if not exists companies_source_application_idx
  on public.companies (source_application_id);

create index if not exists customer_notes_company_created_idx
  on public.customer_notes (company_id, created_at desc);

create index if not exists customer_tasks_company_status_idx
  on public.customer_tasks (company_id, status, due_at);

create index if not exists inventory_reorder_idx
  on public.inventory (warehouse_code, reorder_point, safety_stock);

alter table public.customer_notes enable row level security;
alter table public.customer_tasks enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_tag_links enable row level security;

drop policy if exists "customer_notes_admin_manage" on public.customer_notes;
create policy "customer_notes_admin_manage"
on public.customer_notes for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "customer_tasks_admin_manage" on public.customer_tasks;
create policy "customer_tasks_admin_manage"
on public.customer_tasks for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "customer_tags_admin_manage" on public.customer_tags;
create policy "customer_tags_admin_manage"
on public.customer_tags for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "customer_tag_links_admin_manage" on public.customer_tag_links;
create policy "customer_tag_links_admin_manage"
on public.customer_tag_links for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

grant select, insert, update, delete on public.customer_notes to authenticated;
grant select, insert, update, delete on public.customer_tasks to authenticated;
grant select, insert, update, delete on public.customer_tags to authenticated;
grant select, insert, update, delete on public.customer_tag_links to authenticated;
