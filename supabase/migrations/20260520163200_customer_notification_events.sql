create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete cascade,
  rma_id uuid references public.rmas(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email')),
  locale text not null default 'it' check (locale in ('it', 'zh')),
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'skipped', 'failed')
  ),
  provider text,
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_events_profile_created_idx
  on public.notification_events (profile_id, created_at desc);

create index if not exists notification_events_order_created_idx
  on public.notification_events (order_id, created_at desc)
  where order_id is not null;

create index if not exists notification_events_rma_created_idx
  on public.notification_events (rma_id, created_at desc)
  where rma_id is not null;

create index if not exists notification_events_status_created_idx
  on public.notification_events (status, created_at desc);

alter table public.notification_events enable row level security;

drop policy if exists "notification_events_admin_manage" on public.notification_events;
create policy "notification_events_admin_manage"
on public.notification_events for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "notification_events_owner_select" on public.notification_events;
create policy "notification_events_owner_select"
on public.notification_events for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.orders
    where orders.id = notification_events.order_id
      and orders.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.rmas
    where rmas.id = notification_events.rma_id
      and rmas.profile_id = auth.uid()
  )
);

revoke all on public.notification_events from anon;
revoke all on public.notification_events from authenticated;
grant select, insert, update, delete on public.notification_events to authenticated;
