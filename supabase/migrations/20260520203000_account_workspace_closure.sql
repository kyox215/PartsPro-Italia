alter table public.notification_events
  add column if not exists read_at timestamptz;

create index if not exists notification_events_profile_unread_idx
  on public.notification_events (profile_id, created_at desc)
  where read_at is null;

create index if not exists rmas_profile_order_sku_idx
  on public.rmas (profile_id, order_number, sku, created_at desc);
