revoke insert, update on public.companies from authenticated;

grant insert (
  owner_id,
  company_name,
  vat_number,
  fiscal_code,
  sdi,
  pec,
  billing_address,
  shipping_address,
  contact_name,
  phone,
  whatsapp,
  company_type,
  monthly_volume,
  interested_categories
)
on public.companies to authenticated;

grant update (
  company_name,
  vat_number,
  fiscal_code,
  sdi,
  pec,
  billing_address,
  shipping_address,
  contact_name,
  phone,
  whatsapp,
  company_type,
  monthly_volume,
  interested_categories,
  updated_at
)
on public.companies to authenticated;
