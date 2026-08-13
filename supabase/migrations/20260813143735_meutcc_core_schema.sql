create schema if not exists private;
create table private.advisor_allowlist (email text primary key, created_at timestamptz not null default now());
insert into private.advisor_allowlist (email) values ('tmhadvogados.bsb@gmail.com'), ('marciomorais@gmail.com') on conflict (email) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique, name text not null,
  role text not null default 'student' check (role in ('advisor', 'student')),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table public.cohorts (
  id uuid primary key default gen_random_uuid(), name text not null, course text not null, term text not null,
  advisor_id uuid not null references public.profiles(id) on delete restrict, join_code text not null unique,
  chapter_days smallint not null default 15 check (chapter_days between 1 and 90),
  weekly_limit smallint not null default 6 check (weekly_limit between 1 and 30),
  absent_days smallint not null default 15 check (absent_days between 1 and 180), created_at timestamptz not null default now()
);
create table public.enrollments (
  id bigint generated always as identity primary key, cohort_id uuid not null references public.cohorts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, student_number text,
  created_at timestamptz not null default now(), unique (cohort_id, student_id)
);
create table public.tccs (
  id bigint generated always as identity primary key, cohort_id uuid not null references public.cohorts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, theme text not null default 'Tema em definição',
  area text not null default 'Direito Constitucional', current_stage text not null default 'Marco 1',
  progress smallint not null default 10 check (progress between 0 and 100),
  last_contact_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (cohort_id, student_id)
);
create table public.deliveries (
  id bigint generated always as identity primary key, tcc_id bigint not null references public.tccs(id) on delete cascade,
  kind text not null, version integer not null default 1 check (version > 0),
  status text not null default 'Pendente' check (status in ('Pendente', 'Em análise', 'Aprovado', 'Requer ajustes')),
  due_at timestamptz, file_path text, file_name text, student_note text, advisor_note text,
  created_at timestamptz not null default now(), reviewed_at timestamptz, unique (tcc_id, kind, version)
);
create table public.appointments (
  id bigint generated always as identity primary key, cohort_id uuid not null references public.cohorts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, week_start date not null,
  weekly_position smallint not null check (weekly_position > 0), starts_at timestamptz not null,
  mode text not null default 'presencial' check (mode in ('presencial', 'online')),
  subject text not null default 'Orientação de TCC',
  status text not null default 'confirmado' check (status in ('confirmado', 'cancelado', 'realizado', 'ausente')),
  created_at timestamptz not null default now()
);
create table public.messages (
  id bigint generated always as identity primary key, tcc_id bigint not null references public.tccs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, topic text not null default 'Orientações gerais',
  body text not null check (char_length(btrim(body)) > 0), file_path text, file_name text, read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.references (
  id bigint generated always as identity primary key, tcc_id bigint not null references public.tccs(id) on delete cascade,
  type text not null, title text not null check (char_length(btrim(title)) > 0), note text,
  topic text not null default 'Orientações gerais', created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index cohorts_advisor_id_idx on public.cohorts(advisor_id);
create index enrollments_student_id_idx on public.enrollments(student_id);
create index enrollments_cohort_id_idx on public.enrollments(cohort_id);
create index tccs_student_id_idx on public.tccs(student_id);
create index tccs_cohort_id_idx on public.tccs(cohort_id);
create index deliveries_tcc_id_idx on public.deliveries(tcc_id);
create index appointments_cohort_week_idx on public.appointments(cohort_id, week_start);
create index appointments_student_week_idx on public.appointments(student_id, week_start);
create unique index appointments_student_week_confirmed_uq on public.appointments(student_id, week_start) where status = 'confirmado';
create unique index appointments_slot_confirmed_uq on public.appointments(cohort_id, starts_at) where status = 'confirmado';
create index messages_tcc_created_idx on public.messages(tcc_id, created_at);
create index messages_author_id_idx on public.messages(author_id);
create index references_tcc_created_idx on public.references(tcc_id, created_at);
create index references_created_by_idx on public.references(created_by);
