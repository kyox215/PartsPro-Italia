create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_actor_created_idx
  on public.admin_activity_logs (actor_profile_id, created_at desc);

create index if not exists admin_activity_logs_entity_created_idx
  on public.admin_activity_logs (entity_type, entity_id, created_at desc);

create index if not exists admin_activity_logs_action_created_idx
  on public.admin_activity_logs (action, created_at desc);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "admin_activity_logs_admin_select" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_select"
on public.admin_activity_logs for select
to authenticated
using (app_private.current_user_role() = 'admin');

drop policy if exists "admin_activity_logs_admin_insert" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_insert"
on public.admin_activity_logs for insert
to authenticated
with check (app_private.current_user_role() = 'admin');

grant select, insert on public.admin_activity_logs to authenticated;
