-- Configure the existing MEUTCC 2026.2 cohort by its stable business key.
do $guard$ begin
  if (select count(*) from public.cohorts where term='2026.2' and join_code='TCCII-2026') > 1 then
    raise exception 'Mais de uma turma corresponde à configuração da agenda';
  end if;
end $guard$;
update public.cohorts set weekly_limit = 8 where term='2026.2' and join_code='TCCII-2026';

create or replace function private.validate_orientation_schedule()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare local_start timestamp;
begin
  if new.status <> 'confirmado' then return new; end if;
  if not exists (select 1 from public.enrollments e where e.cohort_id=new.cohort_id and e.student_id=new.student_id) then
    raise exception 'Aluno não vinculado à turma' using errcode='42501';
  end if;
  if exists (select 1 from public.cohorts c where c.id=new.cohort_id and c.term='2026.2' and c.join_code='TCCII-2026') then
    local_start := new.starts_at at time zone 'America/Sao_Paulo';
    if new.starts_at <= statement_timestamp() then raise exception 'Não é possível reservar horário passado'; end if;
    if local_start::date < date '2026-09-01' or local_start::date > date '2026-11-30'
      or extract(second from local_start) <> 0
      or extract(minute from local_start)::integer not in (0,15,30,45)
      or not ((extract(isodow from local_start)=2 and extract(hour from local_start)=18)
        or (extract(isodow from local_start)=5 and extract(hour from local_start)=11))
      or new.mode <> 'presencial' then
      raise exception 'Horário fora da agenda autorizada: terças 18h–19h e sextas 11h–12h, setembro a novembro de 2026';
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function private.validate_orientation_schedule() from public, anon, authenticated;
create trigger appointments_00_validate_schedule before insert or update of starts_at,status,student_id,cohort_id,mode
on public.appointments for each row execute function private.validate_orientation_schedule();

-- Only occupancy times are exposed, never other students' identities.
create or replace function private.cohort_busy_slots(p_cohort_id uuid)
returns table(starts_at timestamptz)
language sql stable security definer set search_path = ''
as $function$
  select a.starts_at from public.appointments a
  where a.cohort_id=p_cohort_id and a.status='confirmado'
    and exists (
      select 1 from public.cohorts c join public.profiles p on p.id=(select auth.uid())
      where c.id=p_cohort_id and p.active=true
        and (c.advisor_id=p.id or (p.role='student' and exists(
          select 1 from public.enrollments e where e.cohort_id=c.id and e.student_id=p.id
        )))
    );
$function$;
revoke all on function private.cohort_busy_slots(uuid) from public,anon;
grant execute on function private.cohort_busy_slots(uuid) to authenticated;
create or replace function public.get_cohort_busy_slots(p_cohort_id uuid)
returns table(starts_at timestamptz)
language sql stable security invoker set search_path = ''
as $function$ select b.starts_at from private.cohort_busy_slots(p_cohort_id) b; $function$;
revoke all on function public.get_cohort_busy_slots(uuid) from public,anon;
grant execute on function public.get_cohort_busy_slots(uuid) to authenticated;
