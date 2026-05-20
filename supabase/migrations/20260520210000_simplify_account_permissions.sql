alter table public.staff_members
  drop constraint if exists staff_members_role_check;

alter table public.staff_members
  add constraint staff_members_role_check
  check (role in ('owner', 'manager', 'sales', 'catalog', 'warehouse', 'finance', 'support'));

create table if not exists public.staff_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  permission text not null,
  enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (role, permission),
  constraint staff_role_permissions_role_check check (
    role in ('manager', 'sales', 'catalog', 'warehouse', 'finance', 'support')
  ),
  constraint staff_role_permissions_permission_check check (
    permission in (
      'admin:access',
      'accounts:read',
      'accounts:write',
      'staff:manage',
      'audit:read',
      'products:write',
      'inventory:write',
      'orders:write',
      'payments:confirm',
      'rma:write',
      'system:read'
    )
  )
);

create index if not exists staff_role_permissions_role_idx
  on public.staff_role_permissions (role, enabled);

alter table public.staff_role_permissions enable row level security;

drop policy if exists "staff_role_permissions_admin_manage" on public.staff_role_permissions;
create policy "staff_role_permissions_admin_manage"
on public.staff_role_permissions for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

grant select, insert, update on public.staff_role_permissions to authenticated;

insert into public.staff_role_permissions (role, permission, enabled)
values
  ('manager', 'admin:access', true),
  ('manager', 'accounts:read', true),
  ('manager', 'accounts:write', true),
  ('manager', 'staff:manage', true),
  ('manager', 'audit:read', true),
  ('manager', 'products:write', true),
  ('manager', 'inventory:write', true),
  ('manager', 'orders:write', true),
  ('manager', 'payments:confirm', true),
  ('manager', 'rma:write', true),
  ('manager', 'system:read', false),
  ('sales', 'admin:access', true),
  ('sales', 'accounts:read', true),
  ('sales', 'accounts:write', true),
  ('sales', 'staff:manage', false),
  ('sales', 'audit:read', true),
  ('sales', 'products:write', false),
  ('sales', 'inventory:write', false),
  ('sales', 'orders:write', true),
  ('sales', 'payments:confirm', false),
  ('sales', 'rma:write', true),
  ('sales', 'system:read', false),
  ('catalog', 'admin:access', true),
  ('catalog', 'accounts:read', false),
  ('catalog', 'accounts:write', false),
  ('catalog', 'staff:manage', false),
  ('catalog', 'audit:read', false),
  ('catalog', 'products:write', true),
  ('catalog', 'inventory:write', false),
  ('catalog', 'orders:write', false),
  ('catalog', 'payments:confirm', false),
  ('catalog', 'rma:write', false),
  ('catalog', 'system:read', true),
  ('warehouse', 'admin:access', true),
  ('warehouse', 'accounts:read', false),
  ('warehouse', 'accounts:write', false),
  ('warehouse', 'staff:manage', false),
  ('warehouse', 'audit:read', false),
  ('warehouse', 'products:write', false),
  ('warehouse', 'inventory:write', true),
  ('warehouse', 'orders:write', true),
  ('warehouse', 'payments:confirm', false),
  ('warehouse', 'rma:write', false),
  ('warehouse', 'system:read', true),
  ('finance', 'admin:access', true),
  ('finance', 'accounts:read', false),
  ('finance', 'accounts:write', false),
  ('finance', 'staff:manage', false),
  ('finance', 'audit:read', true),
  ('finance', 'products:write', false),
  ('finance', 'inventory:write', false),
  ('finance', 'orders:write', true),
  ('finance', 'payments:confirm', true),
  ('finance', 'rma:write', false),
  ('finance', 'system:read', true),
  ('support', 'admin:access', true),
  ('support', 'accounts:read', true),
  ('support', 'accounts:write', false),
  ('support', 'staff:manage', false),
  ('support', 'audit:read', true),
  ('support', 'products:write', false),
  ('support', 'inventory:write', false),
  ('support', 'orders:write', false),
  ('support', 'payments:confirm', false),
  ('support', 'rma:write', true),
  ('support', 'system:read', false)
on conflict (role, permission) do nothing;
