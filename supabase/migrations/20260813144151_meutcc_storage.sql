insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tcc-files', 'tcc-files', false, 20971520, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy tcc_files_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'tcc-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tcc_files_select_access on storage.objects for select to authenticated
using (bucket_id = 'tcc-files' and (owner_id = (select auth.uid()::text) or exists (select 1 from public.tccs t where t.id = ((storage.foldername(name))[2])::bigint and (select private.is_advisor_for_cohort(t.cohort_id)))));
create policy tcc_files_update_own on storage.objects for update to authenticated using (bucket_id = 'tcc-files' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'tcc-files' and owner_id = (select auth.uid()::text));
