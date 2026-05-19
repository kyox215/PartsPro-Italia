insert into public.categories (slug, name_it, name_zh) values
  ('screens', 'Display', '屏幕'),
  ('batteries', 'Batterie', '电池'),
  ('charging-ports', 'Connettori ricarica', '尾插'),
  ('back-covers', 'Back cover', '后盖'),
  ('cameras', 'Fotocamere', '摄像头'),
  ('tools', 'Strumenti', '工具耗材')
on conflict (slug) do nothing;

insert into public.brands (name, slug) values
  ('Apple', 'apple'),
  ('Samsung', 'samsung'),
  ('Xiaomi', 'xiaomi'),
  ('Tools', 'tools')
on conflict (slug) do nothing;
