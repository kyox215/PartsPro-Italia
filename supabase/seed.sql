-- Local development seed data for PartsPro.
-- The local admin auth user from SEED_DATA.md should be created through
-- Supabase Auth locally. Do not seed weak production credentials in SQL.

insert into public.brands (name, slug, sort_order, is_active)
values
  ('Apple', 'apple', 10, true),
  ('Samsung', 'samsung', 20, true),
  ('Xiaomi', 'xiaomi', 30, true),
  ('Oppo', 'oppo', 40, true),
  ('Huawei', 'huawei', 50, true),
  ('Honor', 'honor', 60, true),
  ('Realme', 'realme', 70, true),
  ('Motorola', 'motorola', 80, true)
on conflict (slug) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.categories (name_it, name_en, name_zh, slug, icon, sort_order, is_active)
values
  ('Schermi', 'Screens', '屏幕总成', 'screens', 'MonitorSmartphone', 10, true),
  ('Batterie', 'Batteries', '电池', 'batteries', 'Battery', 20, true),
  ('Connettori di ricarica', 'Charging Ports', '充电接口', 'charging-ports', 'Cable', 30, true),
  ('Cover posteriori', 'Back Covers', '后盖', 'back-covers', 'PanelBack', 40, true),
  ('Fotocamere', 'Cameras', '摄像头', 'cameras', 'Camera', 50, true),
  ('Flex Cables', 'Flex Cables', '排线', 'flex-cables', 'Cable', 60, true),
  ('Altoparlanti', 'Speakers', '听筒/扬声器', 'speakers', 'Volume2', 70, true),
  ('Strumenti', 'Tools', '工具', 'tools', 'Wrench', 80, true),
  ('Adesivi', 'Adhesives', '胶', 'adhesives', 'Sticker', 90, true)
on conflict (slug) do update
set
  name_it = excluded.name_it,
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (
  brand_id,
  category_id,
  name_it,
  name_en,
  name_zh,
  slug,
  description_it,
  description_en,
  description_zh,
  product_type,
  phone_model,
  model_codes,
  status,
  image_urls
)
values
  (
    (select id from public.brands where slug = 'apple'),
    (select id from public.categories where slug = 'screens'),
    'Display iPhone 11',
    'iPhone 11 Display',
    'iPhone 11 屏幕总成',
    'iphone-11-display',
    'Display di ricambio per iPhone 11.',
    'Replacement display for iPhone 11.',
    'iPhone 11 维修屏幕总成。',
    'screen',
    'iPhone 11',
    array['A2111', 'A2221', 'A2223'],
    'active',
    '{}'
  ),
  (
    (select id from public.brands where slug = 'apple'),
    (select id from public.categories where slug = 'batteries'),
    'Batteria iPhone 12',
    'iPhone 12 Battery',
    'iPhone 12 电池',
    'iphone-12-battery',
    'Batteria di ricambio per iPhone 12.',
    'Replacement battery for iPhone 12.',
    'iPhone 12 维修电池。',
    'battery',
    'iPhone 12',
    array['A2172', 'A2402', 'A2403'],
    'active',
    '{}'
  ),
  (
    (select id from public.brands where slug = 'samsung'),
    (select id from public.categories where slug = 'charging-ports'),
    'Connettore ricarica Galaxy A52',
    'Galaxy A52 Charging Port',
    'Galaxy A52 充电接口',
    'galaxy-a52-charging-port',
    'Connettore di ricarica EU per Galaxy A52.',
    'EU charging port for Galaxy A52.',
    'Galaxy A52 欧版充电接口。',
    'charging_port',
    'Galaxy A52',
    array['SM-A525F'],
    'active',
    '{}'
  )
on conflict (slug) do update
set
  brand_id = excluded.brand_id,
  category_id = excluded.category_id,
  name_it = excluded.name_it,
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  description_it = excluded.description_it,
  description_en = excluded.description_en,
  description_zh = excluded.description_zh,
  product_type = excluded.product_type,
  phone_model = excluded.phone_model,
  model_codes = excluded.model_codes,
  status = excluded.status,
  image_urls = excluded.image_urls;

insert into public.product_skus (
  product_id,
  sku,
  quality_grade,
  color,
  frame_type,
  retail_price,
  b2b_price,
  cost_price,
  vat_rate,
  moq,
  weight_grams,
  is_battery,
  is_active
)
values
  ((select id from public.products where slug = 'iphone-11-display'), 'IP11-SCR-SOFT-BLK', 'A+', 'black', 'with_frame', 45.90, 38.00, 24.00, 22, 1, 80, false, true),
  ((select id from public.products where slug = 'iphone-11-display'), 'IP11-SCR-HARD-BLK', 'A', 'black', 'with_frame', 39.90, 33.00, 21.00, 22, 1, 82, false, true),
  ((select id from public.products where slug = 'iphone-11-display'), 'IP11-SCR-TFT-BLK', 'B', 'black', 'with_frame', 29.90, 24.00, 15.00, 22, 1, 84, false, true),
  ((select id from public.products where slug = 'iphone-12-battery'), 'IP12-BAT-HQ', 'A', null, null, 28.50, 22.00, 13.00, 22, 1, 42, true, true),
  ((select id from public.products where slug = 'galaxy-a52-charging-port'), 'SA52-CHG-EU', 'A+', null, null, 12.90, 9.50, 5.20, 22, 1, 8, false, true)
on conflict (sku) do update
set
  product_id = excluded.product_id,
  quality_grade = excluded.quality_grade,
  color = excluded.color,
  frame_type = excluded.frame_type,
  retail_price = excluded.retail_price,
  b2b_price = excluded.b2b_price,
  cost_price = excluded.cost_price,
  vat_rate = excluded.vat_rate,
  moq = excluded.moq,
  weight_grams = excluded.weight_grams,
  is_battery = excluded.is_battery,
  is_active = excluded.is_active;

insert into public.inventory (
  sku_id,
  quantity_available,
  quantity_reserved,
  quantity_incoming,
  warehouse_location,
  status,
  low_stock_threshold
)
values
  ((select id from public.product_skus where sku = 'IP11-SCR-SOFT-BLK'), 120, 0, 20, 'A-01-01', 'available', 10),
  ((select id from public.product_skus where sku = 'IP11-SCR-HARD-BLK'), 80, 0, 10, 'A-01-02', 'available', 10),
  ((select id from public.product_skus where sku = 'IP11-SCR-TFT-BLK'), 200, 0, 0, 'A-01-03', 'available', 15),
  ((select id from public.product_skus where sku = 'IP12-BAT-HQ'), 60, 0, 15, 'B-02-01', 'available', 8),
  ((select id from public.product_skus where sku = 'SA52-CHG-EU'), 35, 0, 0, 'C-03-01', 'available', 6)
on conflict (sku_id) do update
set
  quantity_available = excluded.quantity_available,
  quantity_reserved = excluded.quantity_reserved,
  quantity_incoming = excluded.quantity_incoming,
  warehouse_location = excluded.warehouse_location,
  status = excluded.status,
  low_stock_threshold = excluded.low_stock_threshold;

insert into public.customers (
  id,
  customer_type,
  company_name,
  vat_number,
  phone,
  whatsapp,
  status,
  price_group,
  billing_address,
  shipping_address
)
values
  ('00000000-0000-0000-0000-000000000101', 'retail', 'Mario Rossi', null, '+39 333 000 0101', '+39 333 000 0101', 'approved', 'retail', '{"city":"Milano","country":"IT"}', '{"city":"Milano","country":"IT"}'),
  ('00000000-0000-0000-0000-000000000102', 'b2b', 'FixLab Milano', 'IT0000000102', '+39 333 000 0102', '+39 333 000 0102', 'pending', 'b2b_basic', '{"city":"Milano","country":"IT"}', '{"city":"Milano","country":"IT"}'),
  ('00000000-0000-0000-0000-000000000103', 'b2b', 'Smart Repair Roma', 'IT0000000103', '+39 333 000 0103', '+39 333 000 0103', 'approved', 'silver', '{"city":"Roma","country":"IT"}', '{"city":"Roma","country":"IT"}')
on conflict (id) do update
set
  customer_type = excluded.customer_type,
  company_name = excluded.company_name,
  vat_number = excluded.vat_number,
  phone = excluded.phone,
  whatsapp = excluded.whatsapp,
  status = excluded.status,
  price_group = excluded.price_group,
  billing_address = excluded.billing_address,
  shipping_address = excluded.shipping_address;

insert into public.orders (
  id,
  order_number,
  customer_id,
  status,
  payment_status,
  subtotal,
  vat_total,
  shipping_total,
  grand_total,
  notes
)
values
  ('00000000-0000-0000-0000-000000001001', 'ORD-1001', '00000000-0000-0000-0000-000000000101', 'pending', 'unpaid', 45.90, 10.10, 0, 56.00, 'Seed order pending'),
  ('00000000-0000-0000-0000-000000001002', 'ORD-1002', '00000000-0000-0000-0000-000000000102', 'paid', 'paid', 28.50, 6.27, 0, 34.77, 'Seed order paid'),
  ('00000000-0000-0000-0000-000000001003', 'ORD-1003', '00000000-0000-0000-0000-000000000103', 'shipped', 'paid', 12.90, 2.84, 0, 15.74, 'Seed order shipped'),
  ('00000000-0000-0000-0000-000000001004', 'ORD-1004', '00000000-0000-0000-0000-000000000103', 'completed', 'paid', 39.90, 8.78, 0, 48.68, 'Seed order completed')
on conflict (order_number) do update
set
  customer_id = excluded.customer_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  vat_total = excluded.vat_total,
  shipping_total = excluded.shipping_total,
  grand_total = excluded.grand_total,
  notes = excluded.notes;

insert into public.order_items (
  id,
  order_id,
  sku_id,
  sku_snapshot,
  quantity,
  unit_price,
  vat_rate,
  line_total
)
values
  ('00000000-0000-0000-0000-000000002001', (select id from public.orders where order_number = 'ORD-1001'), (select id from public.product_skus where sku = 'IP11-SCR-SOFT-BLK'), jsonb_build_object('sku', 'IP11-SCR-SOFT-BLK', 'name', 'iPhone 11 Display', 'quality_grade', 'A+'), 1, 45.90, 22, 45.90),
  ('00000000-0000-0000-0000-000000002002', (select id from public.orders where order_number = 'ORD-1002'), (select id from public.product_skus where sku = 'IP12-BAT-HQ'), jsonb_build_object('sku', 'IP12-BAT-HQ', 'name', 'iPhone 12 Battery', 'quality_grade', 'A'), 1, 28.50, 22, 28.50),
  ('00000000-0000-0000-0000-000000002003', (select id from public.orders where order_number = 'ORD-1003'), (select id from public.product_skus where sku = 'SA52-CHG-EU'), jsonb_build_object('sku', 'SA52-CHG-EU', 'name', 'Galaxy A52 Charging Port', 'quality_grade', 'A+'), 1, 12.90, 22, 12.90),
  ('00000000-0000-0000-0000-000000002004', (select id from public.orders where order_number = 'ORD-1004'), (select id from public.product_skus where sku = 'IP11-SCR-HARD-BLK'), jsonb_build_object('sku', 'IP11-SCR-HARD-BLK', 'name', 'iPhone 11 Display', 'quality_grade', 'A'), 1, 39.90, 22, 39.90)
on conflict (id) do update
set
  order_id = excluded.order_id,
  sku_id = excluded.sku_id,
  sku_snapshot = excluded.sku_snapshot,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  vat_rate = excluded.vat_rate,
  line_total = excluded.line_total;
