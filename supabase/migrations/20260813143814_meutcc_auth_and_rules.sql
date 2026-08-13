create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare resolved_role text; resolved_name text;
begin
  select case when exists (select 1 from private.advisor_allowlist a where a.email = lower(new.email)) then 'advisor' else 'student' end into resolved_role;
  resolved_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, email, name, role) values (new.id, lower(new.email), resolved_name, resolved_role)
  on conflict (id) do update set email = excluded.email, name = excluded.name;
  return new;
end; $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert or update of email, raw_user_meta_data on auth.users for each row execute function private.handle_new_user();

create or replace function private.is_advisor_for_cohort(target_cohort uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cohorts c where c.id = target_cohort and c.advisor_id = (select auth.uid()));
$$;
create or replace function private.can_access_tcc(target_tcc bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tccs t join public.cohorts c on c.id = t.cohort_id where t.id = target_tcc and (t.student_id = (select auth.uid()) or c.advisor_id = (select auth.uid())));
$$;
create or replace function private.is_advisor_for_student(target_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e join public.cohorts c on c.id = e.cohort_id where e.student_id = target_student and c.advisor_id = (select auth.uid()));
$$;
revoke all on function private.is_advisor_for_cohort(uuid) from public, anon;
revoke all on function private.can_access_tcc(bigint) from public, anon;
revoke all on function private.is_advisor_for_student(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_advisor_for_cohort(uuid) to authenticated;
grant execute on function private.can_access_tcc(bigint) to authenticated;
grant execute on function private.is_advisor_for_student(uuid) to authenticated;

create or replace function public.join_cohort(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_cohort uuid; current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then raise exception 'Autenticação necessária'; end if;
  if not exists (select 1 from public.profiles p where p.id = current_user_id and p.role = 'student' and p.active) then raise exception 'Perfil de aluno necessário'; end if;
  select c.id into target_cohort from public.cohorts c where upper(c.join_code) = upper(btrim(p_code)) limit 1;
  if target_cohort is null then raise exception 'Código da turma inválido'; end if;
  insert into public.enrollments (cohort_id, student_id) values (target_cohort, current_user_id) on conflict (cohort_id, student_id) do nothing;
  insert into public.tccs (cohort_id, student_id) values (target_cohort, current_user_id) on conflict (cohort_id, student_id) do nothing;
  return target_cohort;
end; $$;
revoke all on function public.join_cohort(text) from public, anon;
grant execute on function public.join_cohort(text) to authenticated;

create or replace function private.enforce_appointment_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare allowed_limit smallint; confirmed_count integer; computed_week date;
begin
  if (select auth.uid()) is null then raise exception 'Autenticação necessária'; end if;
  if new.student_id <> (select auth.uid()) and not (select private.is_advisor_for_cohort(new.cohort_id)) then raise exception 'Acesso negado'; end if;
  computed_week := ((new.starts_at at time zone 'America/Sao_Paulo')::date - ((extract(isodow from (new.starts_at at time zone 'America/Sao_Paulo'))::integer) - 1));
  new.week_start := computed_week;
  select c.weekly_limit into allowed_limit from public.cohorts c where c.id = new.cohort_id for update;
  if new.status = 'confirmado' then
    if exists (select 1 from public.appointments a where a.student_id = new.student_id and a.week_start = computed_week and a.status = 'confirmado' and a.id <> coalesce(new.id, 0)) then raise exception 'Este aluno já possui encontro nesta semana'; end if;
    select count(*) into confirmed_count from public.appointments a where a.cohort_id = new.cohort_id and a.week_start = computed_week and a.status = 'confirmado' and a.id <> coalesce(new.id, 0);
    if confirmed_count >= allowed_limit then raise exception 'Teto semanal de atendimentos atingido'; end if;
    new.weekly_position := confirmed_count + 1;
  end if;
  return new;
end; $$;
revoke all on function private.enforce_appointment_limits() from public, anon, authenticated;
create trigger appointments_enforce_limits before insert or update of starts_at, status, student_id, cohort_id on public.appointments for each row execute function private.enforce_appointment_limits();

create or replace function private.touch_tcc_contact()
returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.tccs set last_contact_at = now() where id = new.tcc_id; return new; end; $$;
revoke all on function private.touch_tcc_contact() from public, anon, authenticated;
create trigger deliveries_touch_contact after insert on public.deliveries for each row execute function private.touch_tcc_contact();
create trigger messages_touch_contact after insert on public.messages for each row execute function private.touch_tcc_contact();
