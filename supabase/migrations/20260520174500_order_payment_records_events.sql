create table if not exists public.order_payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method text not null check (payment_method in ('stripe', 'cash', 'bank_transfer')),
  payment_status text not null check (
    payment_status in (
      'pending_card',
      'pending_cash',
      'pending_bank_transfer',
      'paid',
      'failed',
      'cancelled',
      'refunded'
    )
  ),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  currency text not null default 'EUR',
  provider text,
  provider_reference text,
  recorded_by uuid references public.profiles(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_timeline_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_payment_records_order_created_idx
  on public.order_payment_records (order_id, created_at desc);

create index if not exists order_payment_records_method_status_idx
  on public.order_payment_records (payment_method, payment_status, created_at desc);

create index if not exists order_timeline_events_order_created_idx
  on public.order_timeline_events (order_id, created_at desc);

create index if not exists order_timeline_events_type_created_idx
  on public.order_timeline_events (event_type, created_at desc);

alter table public.order_payment_records enable row level security;
alter table public.order_timeline_events enable row level security;

drop policy if exists "order_payment_records_admin_manage" on public.order_payment_records;
create policy "order_payment_records_admin_manage"
on public.order_payment_records for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "order_payment_records_owner_select" on public.order_payment_records;
create policy "order_payment_records_owner_select"
on public.order_payment_records for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_payment_records.order_id
      and orders.profile_id = auth.uid()
  )
);

drop policy if exists "order_timeline_events_admin_manage" on public.order_timeline_events;
create policy "order_timeline_events_admin_manage"
on public.order_timeline_events for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "order_timeline_events_owner_select" on public.order_timeline_events;
create policy "order_timeline_events_owner_select"
on public.order_timeline_events for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_timeline_events.order_id
      and orders.profile_id = auth.uid()
  )
);

revoke all on public.order_payment_records from anon;
revoke all on public.order_timeline_events from anon;
revoke all on public.order_payment_records from authenticated;
revoke all on public.order_timeline_events from authenticated;

grant select, insert, update, delete on public.order_payment_records to authenticated;
grant select, insert, update, delete on public.order_timeline_events to authenticated;
