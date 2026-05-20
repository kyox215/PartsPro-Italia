alter table public.companies
  add column if not exists contact_email text,
  add column if not exists crm_status text not null default 'lead',
  add column if not exists assigned_admin_id uuid references public.profiles(id) on delete set null,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists source_application_id uuid references public.b2b_applications(id) on delete set null;

alter table public.profiles
  add column if not exists account_status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('active', 'suspended', 'archived'));
  end if;
end $$;

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  display_name text,
  invited_email text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id),
  constraint staff_members_role_check check (
    role in ('owner', 'sales', 'catalog', 'warehouse', 'finance', 'support')
  ),
  constraint staff_members_status_check check (
    status in ('active', 'suspended', 'archived')
  )
);

create table if not exists public.customer_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  application_id uuid references public.b2b_applications(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists companies_source_application_idx
  on public.companies (source_application_id);

create index if not exists companies_contact_email_idx
  on public.companies (lower(contact_email));

create index if not exists companies_crm_status_idx
  on public.companies (crm_status, updated_at desc);

create index if not exists profiles_account_status_idx
  on public.profiles (account_status, updated_at desc);

create index if not exists staff_members_profile_idx
  on public.staff_members (profile_id);

create index if not exists staff_members_role_status_idx
  on public.staff_members (role, status);

create index if not exists customer_audit_events_customer_idx
  on public.customer_audit_events (customer_profile_id, created_at desc);

create index if not exists customer_audit_events_company_idx
  on public.customer_audit_events (company_id, created_at desc);

create index if not exists customer_audit_events_application_idx
  on public.customer_audit_events (application_id, created_at desc);

alter table public.staff_members enable row level security;
alter table public.customer_audit_events enable row level security;

drop policy if exists "staff_members_admin_manage" on public.staff_members;
create policy "staff_members_admin_manage"
on public.staff_members for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "customer_audit_events_admin_read" on public.customer_audit_events;
create policy "customer_audit_events_admin_read"
on public.customer_audit_events for select
to authenticated
using (app_private.current_user_role() = 'admin');

drop policy if exists "customer_audit_events_admin_insert" on public.customer_audit_events;
create policy "customer_audit_events_admin_insert"
on public.customer_audit_events for insert
to authenticated
with check (app_private.current_user_role() = 'admin');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;

drop policy if exists "profiles_update_own_public_fields" on public.profiles;
create policy "profiles_update_own_public_fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

revoke update on public.profiles from authenticated;
grant update (full_name, preferred_locale, updated_at) on public.profiles to authenticated;

grant select on public.staff_members to authenticated;
grant select, insert, update, delete on public.staff_members to authenticated;
grant select, insert on public.customer_audit_events to authenticated;

insert into public.profiles (
  id,
  email,
  full_name,
  preferred_locale,
  role,
  account_status
)
select
  users.id,
  coalesce(users.email, ''),
  users.raw_user_meta_data ->> 'full_name',
  coalesce(users.raw_user_meta_data ->> 'preferred_locale', 'it'),
  case
    when lower(coalesce(users.email, '')) = lower(coalesce(current_setting('app.admin_email', true), ''))
    then 'admin'::public.user_role
    else 'retail'::public.user_role
  end,
  'active'
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  account_status = coalesce(public.profiles.account_status, 'active'),
  updated_at = now();

insert into public.staff_members (
  profile_id,
  role,
  status,
  display_name,
  invited_email
)
select
  profiles.id,
  'owner',
  'active',
  profiles.full_name,
  profiles.email
from public.profiles
where profiles.role = 'admin'
on conflict (profile_id) do nothing;
