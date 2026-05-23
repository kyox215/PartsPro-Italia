alter table public.profiles
  add column if not exists permissions jsonb not null default '[]'::jsonb,
  add column if not exists staff_enabled boolean not null default false,
  add column if not exists staff_enabled_by uuid references auth.users(id) on delete set null,
  add column if not exists staff_enabled_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_permissions_json_array_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_permissions_json_array_check
      check (jsonb_typeof(permissions) = 'array');
  end if;
end $$;

update public.profiles
set
  staff_enabled = case
    when role in ('sales', 'warehouse', 'purchasing', 'admin') then true
    else staff_enabled
  end,
  staff_enabled_at = case
    when role in ('sales', 'warehouse', 'purchasing', 'admin')
      then coalesce(staff_enabled_at, updated_at, created_at, now())
    else staff_enabled_at
  end,
  permissions = case
    when role = 'admin' and permissions = '[]'::jsonb then
      '[
        "orders.view",
        "orders.manage",
        "products.view",
        "products.manage",
        "inventory.view",
        "inventory.manage",
        "customers.view",
        "customers.manage",
        "prices.view",
        "prices.manage",
        "staff_settings.view",
        "staff_settings.manage"
      ]'::jsonb
    when role = 'sales' and permissions = '[]'::jsonb then
      '[
        "orders.view",
        "orders.manage",
        "customers.view",
        "customers.manage",
        "prices.view",
        "prices.manage"
      ]'::jsonb
    when role = 'warehouse' and permissions = '[]'::jsonb then
      '[
        "orders.view",
        "orders.manage",
        "inventory.view",
        "inventory.manage"
      ]'::jsonb
    when role = 'purchasing' and permissions = '[]'::jsonb then
      '[
        "products.view",
        "products.manage",
        "inventory.view",
        "inventory.manage"
      ]'::jsonb
    else permissions
  end;

create or replace function private.has_staff_permission(permission_name text)
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
      and (
        role = 'admin'
        or permissions ? permission_name
      )
  );
$$;

revoke all on function private.has_staff_permission(text) from public, anon, authenticated;

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
      and (
        role in ('sales', 'warehouse', 'purchasing', 'admin')
        or staff_enabled = true
        or jsonb_array_length(coalesce(permissions, '[]'::jsonb)) > 0
      )
  );
$$;

revoke all on function private.is_staff() from public, anon, authenticated;

drop policy if exists "profiles_staff_insert" on public.profiles;
drop policy if exists "profiles_staff_update" on public.profiles;
drop policy if exists "profiles_staff_delete" on public.profiles;
drop policy if exists "profiles_admin_insert" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;
drop policy if exists "profiles_permission_manager_insert" on public.profiles;
drop policy if exists "profiles_permission_manager_update" on public.profiles;
drop policy if exists "profiles_permission_manager_delete" on public.profiles;

create policy "profiles_permission_manager_insert" on public.profiles
for insert to authenticated
with check (
  (select private.is_admin())
  or (
    (select private.has_staff_permission('staff_settings.manage'))
    and role <> 'admin'
    and not (permissions ? 'staff_settings.view')
    and not (permissions ? 'staff_settings.manage')
  )
);

create policy "profiles_permission_manager_update" on public.profiles
for update to authenticated
using (
  (select private.is_admin())
  or (
    (select private.has_staff_permission('staff_settings.manage'))
    and role <> 'admin'
    and not (permissions ? 'staff_settings.view')
    and not (permissions ? 'staff_settings.manage')
  )
)
with check (
  (select private.is_admin())
  or (
    (select private.has_staff_permission('staff_settings.manage'))
    and role <> 'admin'
    and not (permissions ? 'staff_settings.view')
    and not (permissions ? 'staff_settings.manage')
  )
);

create policy "profiles_permission_manager_delete" on public.profiles
for delete to authenticated
using ((select private.is_admin()));

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_entity_type_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_entity_type_check
  check (entity_type in (
    'product',
    'customer',
    'b2b_approval',
    'price_group',
    'inventory',
    'order',
    'staff_profile'
  ));
