alter table public.orders
  add column if not exists stripe_payment_intent_id text,
  add column if not exists refund_total numeric(12, 2) not null default 0 check (refund_total >= 0),
  add column if not exists refunded_at timestamptz;

create index if not exists orders_stripe_payment_intent_idx
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_record_id uuid references public.order_payment_records(id) on delete set null,
  payment_method text not null check (payment_method in ('stripe', 'cash', 'bank_transfer')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  reason text not null default 'requested_by_customer' check (
    reason in (
      'duplicate',
      'fraudulent',
      'requested_by_customer',
      'order_cancelled',
      'rma_refund',
      'other'
    )
  ),
  note text,
  provider text,
  provider_refund_id text,
  provider_payment_intent_id text,
  provider_status text,
  status text not null default 'succeeded' check (
    status in ('pending', 'succeeded', 'failed', 'cancelled')
  ),
  recorded_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists order_refunds_provider_refund_id_idx
  on public.order_refunds (provider_refund_id)
  where provider_refund_id is not null;

create index if not exists order_refunds_order_created_idx
  on public.order_refunds (order_id, created_at desc);

create index if not exists order_refunds_status_created_idx
  on public.order_refunds (status, created_at desc);

alter table public.order_refunds enable row level security;

drop policy if exists "order_refunds_admin_manage" on public.order_refunds;
create policy "order_refunds_admin_manage"
on public.order_refunds for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "order_refunds_owner_select" on public.order_refunds;
create policy "order_refunds_owner_select"
on public.order_refunds for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_refunds.order_id
      and orders.profile_id = auth.uid()
  )
);

revoke all on public.order_refunds from anon;
revoke all on public.order_refunds from authenticated;
grant select, insert, update, delete on public.order_refunds to authenticated;
