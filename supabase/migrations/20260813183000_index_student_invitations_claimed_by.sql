create index if not exists student_invitations_claimed_by_idx
  on public.student_invitations (claimed_by)
  where claimed_by is not null;
