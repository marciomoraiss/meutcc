-- Expose only the advisor identity, never the full profile.
create or replace function private.cohort_advisor_identity(p_cohort_id uuid)
returns table (id uuid, name text)
language sql stable security definer set search_path = ''
as $function$
  select advisor.id, advisor.name
  from public.cohorts c
  join public.profiles advisor on advisor.id = c.advisor_id
  join public.profiles caller on caller.id = (select auth.uid())
  where c.id = p_cohort_id and caller.active = true
    and (c.advisor_id = caller.id or (
      caller.role = 'student' and exists (
        select 1 from public.enrollments e
        where e.cohort_id = c.id and e.student_id = caller.id
      )
    ));
$function$;
revoke all on function private.cohort_advisor_identity(uuid) from public, anon;
grant execute on function private.cohort_advisor_identity(uuid) to authenticated;

create or replace function public.get_cohort_advisor_identity(p_cohort_id uuid)
returns table (id uuid, name text)
language sql stable security invoker set search_path = ''
as $function$
  select identity.id, identity.name
  from private.cohort_advisor_identity(p_cohort_id) identity;
$function$;
revoke all on function public.get_cohort_advisor_identity(uuid) from public, anon;
grant execute on function public.get_cohort_advisor_identity(uuid) to authenticated;
