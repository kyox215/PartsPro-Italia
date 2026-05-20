alter table public.rmas
  add column if not exists rma_number text,
  add column if not exists resolution_type text,
  add column if not exists resolution_note text,
  add column if not exists refund_amount numeric(12, 2) check (refund_amount is null or refund_amount >= 0),
  add column if not exists replacement_sku text,
  add column if not exists closed_at timestamptz;

update public.rmas
set rma_number = 'RMA-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where rma_number is null;

create unique index if not exists rmas_rma_number_key
  on public.rmas (rma_number)
  where rma_number is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rmas_resolution_type_check'
      and conrelid = 'public.rmas'::regclass
  ) then
    alter table public.rmas
      add constraint rmas_resolution_type_check
      check (
        resolution_type is null
        or resolution_type in (
          'pending',
          'repair',
          'replace',
          'refund',
          'reject',
          'credit_note'
        )
      );
  end if;
end $$;

create table if not exists public.rma_events (
  id uuid primary key default gen_random_uuid(),
  rma_id uuid not null references public.rmas(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rma_events_rma_created_idx
  on public.rma_events (rma_id, created_at desc);

create index if not exists rma_events_type_created_idx
  on public.rma_events (event_type, created_at desc);

alter table public.rma_events enable row level security;

drop policy if exists "rma_events_admin_manage" on public.rma_events;
create policy "rma_events_admin_manage"
on public.rma_events for all
to authenticated
using (app_private.current_user_role() = 'admin')
with check (app_private.current_user_role() = 'admin');

drop policy if exists "rma_events_owner_select" on public.rma_events;
create policy "rma_events_owner_select"
on public.rma_events for select
to authenticated
using (
  exists (
    select 1
    from public.rmas
    where rmas.id = rma_events.rma_id
      and rmas.profile_id = auth.uid()
  )
);

revoke all on public.rma_events from anon;
revoke all on public.rma_events from authenticated;
grant select, insert, update, delete on public.rma_events to authenticated;
