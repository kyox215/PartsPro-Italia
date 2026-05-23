create or replace function private.ensure_customer_account_for_auth_user(
  p_user_id uuid,
  p_email text,
  p_raw_user_meta_data jsonb default '{}'::jsonb,
  p_created_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := coalesce(nullif(btrim(p_email), ''), 'unknown@partspro.local');
  metadata jsonb := coalesce(p_raw_user_meta_data, '{}'::jsonb);
  inferred_company_name text;
  inferred_contact_name text;
  inferred_phone text;
  default_price_group_id text;
begin
  if p_user_id is null then
    return;
  end if;

  inferred_company_name := coalesce(
    nullif(btrim(metadata->>'company_name'), ''),
    nullif(btrim(metadata->>'companyName'), ''),
    nullif(btrim(metadata->>'full_name'), ''),
    nullif(btrim(metadata->>'name'), ''),
    nullif(btrim(split_part(normalized_email, '@', 1)), ''),
    'Nuovo cliente'
  );
  inferred_contact_name := coalesce(
    nullif(btrim(metadata->>'contact_name'), ''),
    nullif(btrim(metadata->>'contactName'), ''),
    nullif(btrim(metadata->>'full_name'), ''),
    nullif(btrim(metadata->>'name'), ''),
    normalized_email
  );
  inferred_phone := btrim(coalesce(metadata->>'phone', ''));

  select id
  into default_price_group_id
  from public.price_groups
  order by case when id = 'pg-standard-b2b' then 0 else 1 end, id
  limit 1;

  if exists (
    select 1
    from public.customers
    where user_id = p_user_id
  ) then
    update public.customers
    set email = normalized_email,
        company_name = case
          when profile_completed_at is null and nullif(btrim(company_name), '') is null then inferred_company_name
          else company_name
        end,
        contact_name = case
          when profile_completed_at is null and nullif(btrim(contact_name), '') is null then inferred_contact_name
          else contact_name
        end,
        phone = case
          when profile_completed_at is null and nullif(btrim(phone), '') is null then inferred_phone
          else phone
        end,
        price_group_id = coalesce(price_group_id, default_price_group_id),
        updated_at = now()
    where user_id = p_user_id;

    return;
  end if;

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
    price_group_id,
    status,
    tier,
    created_at,
    updated_at
  ) values (
    p_user_id,
    inferred_company_name,
    inferred_contact_name,
    normalized_email,
    inferred_phone,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    default_price_group_id,
    'pending',
    'standard',
    coalesce(p_created_at, now()),
    now()
  );
end;
$$;

revoke all on function private.ensure_customer_account_for_auth_user(uuid, text, jsonb, timestamptz)
  from public, anon, authenticated;

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

  perform private.ensure_customer_account_for_auth_user(
    new.id,
    new.email,
    new.raw_user_meta_data,
    new.created_at
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function private.handle_new_user_profile();

select private.ensure_customer_account_for_auth_user(
  auth_user.id,
  auth_user.email,
  auth_user.raw_user_meta_data,
  auth_user.created_at
)
from auth.users as auth_user
where not exists (
  select 1
  from public.customers
  where customers.user_id = auth_user.id
);
