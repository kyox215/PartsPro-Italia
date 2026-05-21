begin;

delete from public.staff_role_permissions
where permission = 'b2b:review';

drop index if exists public.companies_source_application_idx;
drop index if exists public.customer_audit_events_application_idx;

alter table if exists public.customer_audit_events
  drop column if exists application_id;

alter table if exists public.companies
  drop column if exists source_application_id;

drop table if exists public.b2b_applications cascade;

commit;
