create index if not exists catalog_taxonomy_updated_by_idx
  on public.catalog_taxonomy (updated_by);

create index if not exists rma_requests_order_line_id_idx
  on public.rma_requests (order_line_id);

drop policy if exists "b2b_public_insert" on public.b2b_applications;
drop policy if exists "b2b_staff_all" on public.b2b_applications;
create policy "b2b_public_insert" on public.b2b_applications
for insert to anon, authenticated
with check (
  accepts_terms = true
  and accepts_privacy = true
  and status = 'submitted'
  and review_note = ''
  and reviewed_at is null
);
create policy "b2b_staff_select" on public.b2b_applications
for select to authenticated using ((select private.is_staff()));
create policy "b2b_staff_update" on public.b2b_applications
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "b2b_staff_delete" on public.b2b_applications
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "catalog_taxonomy_public_select" on public.catalog_taxonomy;
drop policy if exists "catalog_taxonomy_staff_all" on public.catalog_taxonomy;
create policy "catalog_taxonomy_anon_select" on public.catalog_taxonomy
for select to anon using (id = 'default');
create policy "catalog_taxonomy_authenticated_select" on public.catalog_taxonomy
for select to authenticated using (id = 'default' or (select private.is_staff()));
create policy "catalog_taxonomy_staff_insert" on public.catalog_taxonomy
for insert to authenticated with check ((select private.is_staff()));
create policy "catalog_taxonomy_staff_update" on public.catalog_taxonomy
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "catalog_taxonomy_staff_delete" on public.catalog_taxonomy
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "customers_self_select" on public.customers;
drop policy if exists "customers_staff_all" on public.customers;
create policy "customers_authenticated_select" on public.customers
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_staff()));
create policy "customers_staff_insert" on public.customers
for insert to authenticated with check ((select private.is_staff()));
create policy "customers_staff_update" on public.customers
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "customers_staff_delete" on public.customers
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "order_events_self_select" on public.order_events;
drop policy if exists "order_events_staff_all" on public.order_events;
create policy "order_events_authenticated_select" on public.order_events
for select to authenticated using (
  exists (
    select 1
    from public.orders
    where orders.id = order_events.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_staff()))
  )
);
create policy "order_events_staff_insert" on public.order_events
for insert to authenticated with check ((select private.is_staff()));
create policy "order_events_staff_update" on public.order_events
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "order_events_staff_delete" on public.order_events
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "order_lines_self_select" on public.order_lines;
drop policy if exists "order_lines_staff_all" on public.order_lines;
create policy "order_lines_authenticated_select" on public.order_lines
for select to authenticated using (
  exists (
    select 1
    from public.orders
    where orders.id = order_lines.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_staff()))
  )
);
create policy "order_lines_staff_insert" on public.order_lines
for insert to authenticated with check ((select private.is_staff()));
create policy "order_lines_staff_update" on public.order_lines
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "order_lines_staff_delete" on public.order_lines
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "orders_self_select" on public.orders;
drop policy if exists "orders_staff_all" on public.orders;
create policy "orders_authenticated_select" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_staff()));
create policy "orders_staff_insert" on public.orders
for insert to authenticated with check ((select private.is_staff()));
create policy "orders_staff_update" on public.orders
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "orders_staff_delete" on public.orders
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "price_groups_staff_all" on public.price_groups;
drop policy if exists "price_groups_staff_select" on public.price_groups;
create policy "price_groups_staff_select" on public.price_groups
for select to authenticated using ((select private.is_staff()));
create policy "price_groups_staff_insert" on public.price_groups
for insert to authenticated with check ((select private.is_staff()));
create policy "price_groups_staff_update" on public.price_groups
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "price_groups_staff_delete" on public.price_groups
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "products_public_active_select" on public.products;
drop policy if exists "products_staff_all" on public.products;
create policy "products_anon_active_select" on public.products
for select to anon using (status = 'active');
create policy "products_authenticated_select" on public.products
for select to authenticated using (status = 'active' or (select private.is_staff()));
create policy "products_staff_insert" on public.products
for insert to authenticated with check ((select private.is_staff()));
create policy "products_staff_update" on public.products
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "products_staff_delete" on public.products
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_staff_all" on public.profiles;
create policy "profiles_authenticated_select" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select private.is_staff()));
create policy "profiles_staff_insert" on public.profiles
for insert to authenticated with check ((select private.is_staff()));
create policy "profiles_staff_update" on public.profiles
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "profiles_staff_delete" on public.profiles
for delete to authenticated using ((select private.is_staff()));

drop policy if exists "rma_self_insert" on public.rma_requests;
drop policy if exists "rma_self_select_insert" on public.rma_requests;
drop policy if exists "rma_staff_all" on public.rma_requests;
create policy "rma_authenticated_select" on public.rma_requests
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_staff()));
create policy "rma_authenticated_insert" on public.rma_requests
for insert to authenticated with check (
  (user_id = (select auth.uid()) and status = 'submitted')
  or (select private.is_staff())
);
create policy "rma_staff_update" on public.rma_requests
for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "rma_staff_delete" on public.rma_requests
for delete to authenticated using ((select private.is_staff()));
