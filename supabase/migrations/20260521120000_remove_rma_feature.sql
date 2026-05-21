do $$
begin
  if to_regclass('public.order_refunds') is not null then
    update public.order_refunds
    set reason = 'other'
    where reason = 'rma_refund';

    alter table public.order_refunds
      drop constraint if exists order_refunds_reason_check;

    alter table public.order_refunds
      add constraint order_refunds_reason_check
      check (
        reason in (
          'duplicate',
          'fraudulent',
          'requested_by_customer',
          'order_cancelled',
          'other'
        )
      );
  end if;
end $$;

delete from public.staff_role_permissions
where permission = 'rma:write';

alter table public.staff_role_permissions
  drop constraint if exists staff_role_permissions_permission_check;

alter table public.staff_role_permissions
  add constraint staff_role_permissions_permission_check
  check (
    permission in (
      'admin:access',
      'accounts:read',
      'accounts:write',
      'staff:manage',
      'audit:read',
      'products:write',
      'inventory:write',
      'orders:write',
      'payments:confirm',
      'system:read'
    )
  );

drop policy if exists "notification_events_owner_select" on public.notification_events;

drop index if exists public.notification_events_rma_created_idx;

alter table public.notification_events
  drop constraint if exists notification_events_rma_id_fkey,
  drop column if exists rma_id;

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
);

drop table if exists public.rma_events cascade;
drop table if exists public.rmas cascade;
drop type if exists public.rma_status;
