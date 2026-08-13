alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.enrollments enable row level security;
alter table public.tccs enable row level security;
alter table public.deliveries enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.references enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()) or (select private.is_advisor_for_student(id)));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy cohorts_select on public.cohorts for select to authenticated using (advisor_id = (select auth.uid()) or exists (select 1 from public.enrollments e where e.cohort_id = cohorts.id and e.student_id = (select auth.uid())));
create policy cohorts_insert_advisor on public.cohorts for insert to authenticated with check (advisor_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'advisor' and p.active));
create policy cohorts_update_advisor on public.cohorts for update to authenticated using (advisor_id = (select auth.uid())) with check (advisor_id = (select auth.uid()));
