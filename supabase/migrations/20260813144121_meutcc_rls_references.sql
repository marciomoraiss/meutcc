create policy references_select on public.references for select to authenticated using ((select private.can_access_tcc(tcc_id)));
create policy references_insert on public.references for insert to authenticated
with check (created_by = (select auth.uid()) and exists (select 1 from public.tccs t where t.id = "references".tcc_id and (select private.is_advisor_for_cohort(t.cohort_id))));
