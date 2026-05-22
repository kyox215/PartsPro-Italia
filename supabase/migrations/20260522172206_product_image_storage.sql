-- Product cards use Supabase Storage paths so images can be managed outside the frontend bundle.
alter table public.products
  add column if not exists image_path text not null default '',
  add column if not exists image_alt text not null default '',
  add column if not exists gallery_image_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "product_images_staff_insert" on storage.objects;
create policy "product_images_staff_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and private.is_staff());

drop policy if exists "product_images_staff_update" on storage.objects;
create policy "product_images_staff_update" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and private.is_staff())
with check (bucket_id = 'product-images' and private.is_staff());

drop policy if exists "product_images_staff_delete" on storage.objects;
create policy "product_images_staff_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and private.is_staff());

grant select (image_path, image_alt, gallery_image_paths) on public.products to anon;

update public.products
set
  image_path = 'screens/IP11-SCR-SOFT-BLK.webp',
  image_alt = 'iPhone 11 display Soft OLED black without frame'
where sku_code = 'IP11-SCR-SOFT-BLK';

update public.products
set
  image_path = 'batteries/IP12-BAT-HQ-2815.webp',
  image_alt = 'iPhone 12 compatible high quality battery'
where sku_code = 'IP12-BAT-HQ-2815';

update public.products
set
  image_path = 'charging-ports/SA52-CHG-EU-BLK.webp',
  image_alt = 'Samsung Galaxy A52 charging port flex EU version'
where sku_code = 'SA52-CHG-EU-BLK';

update public.products
set
  image_path = 'back-covers/RN10-BKC-BLU.webp',
  image_alt = 'Xiaomi Redmi Note 10 blue back cover'
where sku_code = 'RN10-BKC-BLU';

update public.products
set
  image_path = 'cameras/IP13-CAM-REAR.webp',
  image_alt = 'iPhone 13 rear camera compatible module'
where sku_code = 'IP13-CAM-REAR';

update public.products
set
  image_path = 'tools/TOOL-WATERPROOF-SET.webp',
  image_alt = 'Waterproof adhesive set for iPhone 11 and 12 series'
where sku_code = 'TOOL-WATERPROOF-SET';
