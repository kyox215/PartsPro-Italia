-- Keep storefront browsing public while preventing anonymous access to B2B price fields.
revoke all on
  public.profiles,
  public.products,
  public.price_groups,
  public.customers,
  public.b2b_applications,
  public.batches,
  public.inventory_items,
  public.stock_movements,
  public.orders,
  public.order_lines,
  public.rma_requests
from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select (
  sku_code,
  name,
  brand,
  model,
  model_code,
  model_codes,
  category,
  quality_grade,
  color,
  frame,
  stock_status,
  moq,
  vat_mode,
  warranty_days,
  weight_gram,
  is_battery,
  is_dangerous_goods,
  msds_url,
  un38_url,
  compatibility,
  compatibility_models,
  alternative_skus,
  add_on_skus,
  highlights,
  status
) on public.products to anon;

grant select, insert, update, delete on public.products to authenticated;
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

grant insert on public.b2b_applications to anon;

drop policy if exists "b2b_public_insert" on public.b2b_applications;
create policy "b2b_public_insert" on public.b2b_applications
for insert to anon, authenticated
with check (
  accepts_terms = true
  and accepts_privacy = true
  and status = 'submitted'
  and review_note = ''
  and reviewed_at is null
);

drop policy if exists "rma_self_insert" on public.rma_requests;
create policy "rma_self_insert" on public.rma_requests
for insert to authenticated
with check (user_id = auth.uid() and status = 'submitted');

revoke execute on function public.staff_ship_order(uuid) from public, anon;
grant execute on function public.staff_ship_order(uuid) to authenticated;
