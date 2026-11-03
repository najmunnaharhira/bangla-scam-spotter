-- New scam reports must belong to the signed-in Supabase user who creates them.
-- The column remains nullable only so historical anonymous reports can be preserved.
alter table public.scam_reports
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists scam_reports_user_id_idx on public.scam_reports (user_id);

drop policy if exists "public_insert_scam_reports" on public.scam_reports;
drop policy if exists "authenticated_insert_own_scam_reports" on public.scam_reports;
create policy "authenticated_insert_own_scam_reports"
  on public.scam_reports
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on column public.scam_reports.user_id is
  'The authenticated reporter. Null is reserved for reports created before sign-in was required.';
