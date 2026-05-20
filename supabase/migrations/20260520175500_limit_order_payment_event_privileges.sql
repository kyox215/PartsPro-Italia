revoke all on public.order_payment_records from anon;
revoke all on public.order_timeline_events from anon;
revoke all on public.order_payment_records from authenticated;
revoke all on public.order_timeline_events from authenticated;

grant select, insert, update, delete on public.order_payment_records to authenticated;
grant select, insert, update, delete on public.order_timeline_events to authenticated;
