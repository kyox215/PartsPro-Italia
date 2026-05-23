alter table public.products
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archive_reason text not null default '';

alter table public.customers
  add column if not exists admin_note text not null default '',
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archive_reason text not null default '';

create index if not exists products_archived_at_idx on public.products (archived_at);
create index if not exists customers_archived_at_idx on public.customers (archived_at);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null default '',
  entity_type text not null
    check (entity_type in ('product', 'customer', 'b2b_approval', 'price_group', 'inventory', 'order')),
  entity_id text not null,
  action text not null,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs (entity_type, entity_id, created_at desc);
create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs (actor_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_staff_select" on public.admin_audit_logs;
create policy "admin_audit_logs_staff_select" on public.admin_audit_logs
for select to authenticated using ((select private.is_staff()));

drop policy if exists "admin_audit_logs_staff_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_staff_insert" on public.admin_audit_logs
for insert to authenticated with check ((select private.is_staff()));

revoke all on public.admin_audit_logs from anon, authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

drop policy if exists "products_anon_active_select" on public.products;
drop policy if exists "products_authenticated_select" on public.products;
drop policy if exists "products_staff_update" on public.products;
drop policy if exists "products_staff_delete" on public.products;

create policy "products_anon_active_select" on public.products
for select to anon using (status = 'active' and archived_at is null);

create policy "products_authenticated_select" on public.products
for select to authenticated
using ((status = 'active' and archived_at is null) or (select private.is_staff()));

create policy "products_staff_update_active" on public.products
for update to authenticated
using ((select private.is_staff()) and archived_at is null)
with check ((select private.is_staff()));

create policy "products_admin_update_archived" on public.products
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "products_admin_delete" on public.products
for delete to authenticated using ((select private.is_admin()));

drop policy if exists "customers_authenticated_select" on public.customers;
drop policy if exists "customers_staff_update" on public.customers;
drop policy if exists "customers_staff_delete" on public.customers;

create policy "customers_authenticated_select" on public.customers
for select to authenticated
using ((user_id = (select auth.uid()) and archived_at is null) or (select private.is_staff()));

create policy "customers_staff_update_active" on public.customers
for update to authenticated
using ((select private.is_staff()) and archived_at is null)
with check ((select private.is_staff()));

create policy "customers_admin_update_archived" on public.customers
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "customers_admin_delete" on public.customers
for delete to authenticated using ((select private.is_admin()));

create or replace function private.get_my_customer_profile_impl()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  customer_record public.customers%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into customer_record
  from public.customers
  where user_id = current_user_id
    and archived_at is null
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'email', coalesce(nullif(auth.jwt()->>'email', ''), ''),
      'companyName', '',
      'contactName', '',
      'phone', '',
      'vatNumber', '',
      'fiscalCode', '',
      'sdi', '',
      'pec', '',
      'registeredAddress', '',
      'billingAddress', '',
      'shippingAddress', '',
      'isComplete', false
    );
  end if;

  return private.customer_profile_json(customer_record);
end;
$$;

revoke all on function private.get_my_customer_profile_impl() from public, anon, authenticated;
grant execute on function private.get_my_customer_profile_impl() to authenticated;

create or replace function private.upsert_my_customer_profile_impl(profile jsonb)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  existing_customer public.customers%rowtype;
  saved_customer public.customers%rowtype;
  company_name_value text := nullif(btrim(coalesce(profile->>'companyName', profile->>'company_name', '')), '');
  contact_name_value text := nullif(btrim(coalesce(profile->>'contactName', profile->>'contact_name', '')), '');
  email_value text := coalesce(
    nullif(btrim(coalesce(auth.jwt()->>'email', '')), ''),
    nullif(btrim(coalesce(profile->>'email', '')), ''),
    'customer@partspro.local'
  );
  phone_value text := nullif(btrim(coalesce(profile->>'phone', '')), '');
  vat_number_value text := nullif(btrim(coalesce(profile->>'vatNumber', profile->>'vat_number', '')), '');
  fiscal_code_value text := btrim(coalesce(profile->>'fiscalCode', profile->>'fiscal_code', ''));
  sdi_value text := btrim(coalesce(profile->>'sdi', ''));
  pec_value text := btrim(coalesce(profile->>'pec', ''));
  billing_address_value text := nullif(btrim(coalesce(profile->>'billingAddress', profile->>'billing_address', '')), '');
  shipping_address_value text := nullif(btrim(coalesce(profile->>'shippingAddress', profile->>'shipping_address', '')), '');
  registered_address_value text := nullif(btrim(coalesce(profile->>'registeredAddress', profile->>'registered_address', '')), '');
  completed_at_value timestamptz;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if company_name_value is null
     or contact_name_value is null
     or phone_value is null
     or vat_number_value is null
     or billing_address_value is null
     or shipping_address_value is null
     or (nullif(sdi_value, '') is null and nullif(pec_value, '') is null) then
    raise exception 'customer profile incomplete';
  end if;

  registered_address_value := coalesce(registered_address_value, billing_address_value);
  completed_at_value := now();

  select *
  into existing_customer
  from public.customers
  where user_id = current_user_id
    and archived_at is null
  order by created_at desc
  limit 1;

  if found then
    update public.customers
    set company_name = company_name_value,
        contact_name = contact_name_value,
        email = email_value,
        phone = phone_value,
        vat_number = vat_number_value,
        fiscal_code = fiscal_code_value,
        sdi = sdi_value,
        pec = pec_value,
        registered_address = registered_address_value,
        billing_address = billing_address_value,
        shipping_address = shipping_address_value,
        profile_completed_at = completed_at_value
    where id = existing_customer.id
    returning * into saved_customer;
  else
    insert into public.customers (
      user_id,
      company_name,
      contact_name,
      email,
      phone,
      vat_number,
      fiscal_code,
      sdi,
      pec,
      registered_address,
      billing_address,
      shipping_address,
      profile_completed_at,
      status,
      tier
    ) values (
      current_user_id,
      company_name_value,
      contact_name_value,
      email_value,
      phone_value,
      vat_number_value,
      fiscal_code_value,
      sdi_value,
      pec_value,
      registered_address_value,
      billing_address_value,
      shipping_address_value,
      completed_at_value,
      'pending',
      'standard'
    )
    returning * into saved_customer;
  end if;

  return private.customer_profile_json(saved_customer);
end;
$$;

revoke all on function private.upsert_my_customer_profile_impl(jsonb) from public, anon, authenticated;
grant execute on function private.upsert_my_customer_profile_impl(jsonb) to authenticated;
