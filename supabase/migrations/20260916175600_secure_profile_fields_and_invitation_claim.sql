-- Protect authorization fields; keep existing SELECT/RLS and name editing.
revoke insert, update, delete, truncate, references, trigger on public.profiles from public, anon, authenticated;
revoke update (id, email, name, role, active, created_at) on public.profiles from public, anon, authenticated;
revoke insert (id, email, name, role, active, created_at) on public.profiles from public, anon, authenticated;
grant update (name) on public.profiles to authenticated;

create or replace function public.claim_student_invitation()
returns uuid language plpgsql security definer set search_path = ''
as $function$
declare
  current_user_id uuid := (select auth.uid());
  verified_email text;
  invitation public.student_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária' using errcode = '42501';
  end if;
  select lower(u.email) into verified_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = current_user_id
    and u.email_confirmed_at is not null
    and p.role = 'student' and p.active = true;
  if verified_email is null then
    raise exception 'Aluno ativo com e-mail confirmado necessário' using errcode = '42501';
  end if;
  select i.* into invitation
  from public.student_invitations i
  where lower(i.email) = verified_email and i.status = 'pending'
  order by i.created_at, i.id limit 1 for update of i;
  if invitation.id is null then return null; end if;
  insert into public.enrollments (cohort_id, student_id, student_number)
  values (invitation.cohort_id, current_user_id, invitation.student_number)
  on conflict (cohort_id, student_id) do update set student_number = excluded.student_number;
  insert into public.tccs (cohort_id, student_id, theme, area)
  values (invitation.cohort_id, current_user_id, invitation.theme, invitation.area)
  on conflict (cohort_id, student_id) do update set theme = excluded.theme, area = excluded.area;
  update public.student_invitations
  set status = 'claimed', claimed_by = current_user_id, claimed_at = now()
  where id = invitation.id;
  return invitation.cohort_id;
end;
$function$;
revoke all on function public.claim_student_invitation() from public, anon;
grant execute on function public.claim_student_invitation() to authenticated;
