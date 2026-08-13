create table public.student_invitations (
  id bigint generated always as identity primary key,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  email text not null,
  name text not null check (char_length(btrim(name)) > 0),
  student_number text,
  theme text not null default 'Tema em definição',
  area text not null default 'Área a definir',
  status text not null default 'pending' check (status in ('pending', 'claimed')),
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cohort_id, email)
);

create index student_invitations_cohort_id_idx on public.student_invitations(cohort_id);
create index student_invitations_email_pending_idx on public.student_invitations(lower(email)) where status = 'pending';

alter table public.student_invitations enable row level security;

create policy student_invitations_select_advisor on public.student_invitations
for select to authenticated
using ((select private.is_advisor_for_cohort(cohort_id)));

create policy student_invitations_insert_advisor on public.student_invitations
for insert to authenticated
with check ((select private.is_advisor_for_cohort(cohort_id)));

create policy student_invitations_update_advisor on public.student_invitations
for update to authenticated
using ((select private.is_advisor_for_cohort(cohort_id)))
with check ((select private.is_advisor_for_cohort(cohort_id)));

create policy student_invitations_delete_advisor on public.student_invitations
for delete to authenticated
using ((select private.is_advisor_for_cohort(cohort_id)));

grant select, insert, update, delete on public.student_invitations to authenticated;
grant usage, select on sequence public.student_invitations_id_seq to authenticated;

create or replace function public.claim_student_invitation()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation public.student_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária';
  end if;

  select i.* into invitation
  from public.student_invitations i
  join public.profiles p on lower(p.email) = lower(i.email)
  where p.id = current_user_id and i.status = 'pending'
  order by i.created_at
  limit 1
  for update of i;

  if invitation.id is null then
    return null;
  end if;

  insert into public.enrollments (cohort_id, student_id, student_number)
  values (invitation.cohort_id, current_user_id, invitation.student_number)
  on conflict (cohort_id, student_id)
  do update set student_number = excluded.student_number;

  insert into public.tccs (cohort_id, student_id, theme, area)
  values (invitation.cohort_id, current_user_id, invitation.theme, invitation.area)
  on conflict (cohort_id, student_id)
  do update set theme = excluded.theme, area = excluded.area;

  update public.student_invitations
  set status = 'claimed', claimed_by = current_user_id, claimed_at = now()
  where id = invitation.id;

  return invitation.cohort_id;
end;
$$;

revoke all on function public.claim_student_invitation() from public, anon;
grant execute on function public.claim_student_invitation() to authenticated;
