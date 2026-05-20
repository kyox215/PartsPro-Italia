alter table public.orders
  add column if not exists payment_status text not null default 'pending_bank_transfer',
  add column if not exists fulfillment_status text not null default 'unfulfilled',
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists reserved_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists admin_note text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_payment_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (
        payment_status in (
          'pending_card',
          'pending_cash',
          'pending_bank_transfer',
          'paid',
          'failed',
          'cancelled',
          'refunded'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_fulfillment_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_fulfillment_status_check
      check (
        fulfillment_status in (
          'unfulfilled',
          'reserved',
          'awaiting_preorder',
          'picking',
          'shipped',
          'picked_up',
          'completed',
          'cancelled'
        )
      );
  end if;
end $$;

update public.orders
set payment_status = case
    when status = 'paid' then 'paid'
    when status = 'refunded' then 'refunded'
    when status = 'cancelled' then 'cancelled'
    when payment_method = 'stripe' then 'pending_card'
    when payment_method = 'cash' then 'pending_cash'
    when payment_method = 'bank_transfer' then 'pending_bank_transfer'
    else payment_status
  end,
  fulfillment_status = case
    when status = 'completed' then 'completed'
    when status = 'shipped' then 'shipped'
    when status = 'cancelled' then 'cancelled'
    when exists (
      select 1
      from public.order_items oi
      where oi.order_id = orders.id
        and coalesce(oi.preorder_qty, 0) > 0
    ) then 'awaiting_preorder'
    when status in ('paid', 'pending_payment', 'checkout_created', 'processing') then 'reserved'
    else fulfillment_status
  end,
  reserved_at = coalesce(reserved_at, created_at),
  reservation_expires_at = coalesce(reservation_expires_at, created_at + interval '24 hours')
where reserved_at is null
   or reservation_expires_at is null
   or payment_status = 'pending_bank_transfer'
   or fulfillment_status = 'unfulfilled';

alter table public.inventory_movements
  drop constraint if exists inventory_movements_movement_type_check;

alter table public.inventory_movements
  add constraint inventory_movements_movement_type_check
  check (
    movement_type in (
      'excel_import',
      'receive_stock',
      'mark_shortage',
      'reserve_stock',
      'reserve_incoming',
      'release_reservation',
      'allocate_preorder',
      'ship_stock',
      'manual_adjustment'
    )
  );

create index if not exists orders_payment_status_idx
  on public.orders (payment_status, created_at desc);

create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status, created_at desc);

create index if not exists orders_reservation_expiry_idx
  on public.orders (reservation_expires_at)
  where released_at is null
    and payment_status in ('pending_card', 'pending_cash', 'pending_bank_transfer');
