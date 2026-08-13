create policy messages_select on public.messages for select to authenticated using ((select private.can_access_tcc(tcc_id)));
create policy messages_insert on public.messages for insert to authenticated with check (author_id = (select auth.uid()) and (select private.can_access_tcc(tcc_id)));
