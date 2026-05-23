create or replace function private.is_admin()
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
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;

drop policy if exists "profiles_staff_insert" on public.profiles;
drop policy if exists "profiles_staff_update" on public.profiles;
drop policy if exists "profiles_staff_delete" on public.profiles;

create policy "profiles_admin_insert" on public.profiles
for insert to authenticated with check ((select private.is_admin()));

create policy "profiles_admin_update" on public.profiles
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "profiles_admin_delete" on public.profiles
for delete to authenticated using ((select private.is_admin()));

create or replace function private.customer_tier_for_price_group(price_group_id text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when lower(coalesce(price_group_id, '')) like '%gold%' then 'gold'
    when lower(coalesce(price_group_id, '')) like '%silver%' then 'silver'
    else 'standard'
  end;
$$;

create or replace function private.credit_limit_for_customer_tier(customer_tier text)
returns numeric
language sql
immutable
set search_path = public, pg_temp
as $$
  select case customer_tier
    when 'gold' then 2500
    when 'silver' then 900
    else 0
  end;
$$;

create or replace function private.ensure_customer_from_b2b_application(
  approval_record public.b2b_applications
)
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  resolved_price_group_id text := coalesce(
    nullif((approval_record).requested_price_group_id, ''),
    'pg-standard-b2b'
  );
  resolved_tier text := private.customer_tier_for_price_group(resolved_price_group_id);
  existing_customer_id uuid;
  saved_customer_id uuid;
  price_terms text := '';
  registered_address_value text := coalesce(
    nullif((approval_record).registered_address, ''),
    nullif((approval_record).shipping_address, ''),
    ''
  );
  shipping_address_value text := coalesce(
    nullif((approval_record).shipping_address, ''),
    registered_address_value,
    ''
  );
  profile_completed_at_value timestamptz;
begin
  if (approval_record).status <> 'approved' then
    return null;
  end if;

  select payment_terms
  into price_terms
  from public.price_groups
  where id = resolved_price_group_id;

  select id
  into existing_customer_id
  from public.customers
  where lower(email) = lower((approval_record).email)
     or (
       nullif((approval_record).vat_number, '') is not null
       and vat_number = (approval_record).vat_number
     )
  order by created_at desc
  limit 1;

  if registered_address_value <> ''
     and shipping_address_value <> ''
     and nullif((approval_record).phone, '') is not null
     and (
       nullif((approval_record).sdi, '') is not null
       or nullif((approval_record).pec, '') is not null
     ) then
    profile_completed_at_value := now();
  end if;

  if existing_customer_id is not null then
    update public.customers
    set company_name = coalesce(nullif((approval_record).company_name, ''), (approval_record).email),
        contact_name = coalesce(nullif((approval_record).contact_name, ''), (approval_record).email),
        email = (approval_record).email,
        phone = coalesce((approval_record).phone, ''),
        vat_number = coalesce((approval_record).vat_number, ''),
        fiscal_code = coalesce((approval_record).fiscal_code, ''),
        sdi = coalesce((approval_record).sdi, ''),
        pec = coalesce((approval_record).pec, ''),
        registered_address = registered_address_value,
        billing_address = registered_address_value,
        shipping_address = shipping_address_value,
        tier = resolved_tier,
        price_group_id = resolved_price_group_id,
        status = 'active',
        monthly_purchase = coalesce((approval_record).monthly_purchase, ''),
        credit_limit = private.credit_limit_for_customer_tier(resolved_tier),
        payment_terms = coalesce(price_terms, payment_terms, ''),
        profile_completed_at = coalesce(
          public.customers.profile_completed_at,
          profile_completed_at_value
        )
    where id = existing_customer_id
    returning id into saved_customer_id;

    return saved_customer_id;
  end if;

  insert into public.customers (
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
    tier,
    price_group_id,
    status,
    monthly_purchase,
    credit_limit,
    payment_terms,
    profile_completed_at
  ) values (
    coalesce(nullif((approval_record).company_name, ''), (approval_record).email),
    coalesce(nullif((approval_record).contact_name, ''), (approval_record).email),
    (approval_record).email,
    coalesce((approval_record).phone, ''),
    coalesce((approval_record).vat_number, ''),
    coalesce((approval_record).fiscal_code, ''),
    coalesce((approval_record).sdi, ''),
    coalesce((approval_record).pec, ''),
    registered_address_value,
    registered_address_value,
    shipping_address_value,
    resolved_tier,
    resolved_price_group_id,
    'active',
    coalesce((approval_record).monthly_purchase, ''),
    private.credit_limit_for_customer_tier(resolved_tier),
    coalesce(price_terms, ''),
    profile_completed_at_value
  )
  returning id into saved_customer_id;

  return saved_customer_id;
end;
$$;

revoke all on function private.ensure_customer_from_b2b_application(public.b2b_applications)
from public, anon, authenticated;

create or replace function private.sync_customer_from_b2b_application_trigger()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  perform private.ensure_customer_from_b2b_application(new);
  return new;
end;
$$;

revoke all on function private.sync_customer_from_b2b_application_trigger()
from public, anon, authenticated;

drop trigger if exists b2b_applications_sync_customer on public.b2b_applications;
create trigger b2b_applications_sync_customer
after insert or update of status, requested_price_group_id
on public.b2b_applications
for each row
when (new.status = 'approved')
execute function private.sync_customer_from_b2b_application_trigger();

do $$
declare
  approval_record public.b2b_applications%rowtype;
begin
  for approval_record in
    select *
    from public.b2b_applications
    where status = 'approved'
  loop
    perform private.ensure_customer_from_b2b_application(approval_record);
  end loop;
end;
$$;
