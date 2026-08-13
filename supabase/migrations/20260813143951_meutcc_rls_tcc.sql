create policy enrollments_select on public.enrollments for select to authenticated using (student_id = (select auth.uid()) or (select private.is_advisor_for_cohort(cohort_id)));
create policy tccs_select on public.tccs for select to authenticated using (student_id = (select auth.uid()) or (select private.is_advisor_for_cohort(cohort_id)));
create policy tccs_update_advisor on public.tccs for update to authenticated using ((select private.is_advisor_for_cohort(cohort_id))) with check ((select private.is_advisor_for_cohort(cohort_id)));
create policy deliveries_select on public.deliveries for select to authenticated using ((select private.can_access_tcc(tcc_id)));
create policy deliveries_insert on public.deliveries for insert to authenticated with check ((select private.can_access_tcc(tcc_id)));
create policy deliveries_update_advisor on public.deliveries for update to authenticated
using (exists (select 1 from public.tccs t where t.id = deliveries.tcc_id and (select private.is_advisor_for_cohort(t.cohort_id))))
with check (exists (select 1 from public.tccs t where t.id = deliveries.tcc_id and (select private.is_advisor_for_cohort(t.cohort_id))));
