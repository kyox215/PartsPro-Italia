grant select (
  id,
  product_id,
  sku,
  barcode_ean13,
  color,
  compatibility,
  moq,
  preorder_lead_time_min_days,
  preorder_lead_time_max_days,
  is_active
) on public.skus to anon, authenticated;

grant select on public.catalog_public_items to anon, authenticated;
grant select on public.catalog_private_items to authenticated;
