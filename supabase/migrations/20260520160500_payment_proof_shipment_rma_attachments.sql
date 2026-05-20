alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipment_note text,
  add column if not exists shipped_at timestamptz,
  add column if not exists customer_note text;

create index if not exists orders_tracking_number_idx
  on public.orders (tracking_number)
  where tracking_number is not null;

alter table public.order_payment_records
  add column if not exists proof_url text,
  add column if not exists proof_label text;

create index if not exists order_payment_records_proof_url_idx
  on public.order_payment_records (proof_url)
  where proof_url is not null;

alter table public.order_timeline_events
  add column if not exists customer_visible boolean not null default true;

alter table public.rma_events
  add column if not exists customer_visible boolean not null default true;
