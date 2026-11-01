-- Community scam reports: anyone can flag a sender (phone number, bKash
-- number, handle, etc.) as a scam, and anyone can look up how many times a
-- sender has been reported. No auth required — this is a public signal, like
-- flagging a spam caller.
create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  identifier_key text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint scam_reports_identifier_length check (char_length(identifier) between 3 and 120),
  constraint scam_reports_identifier_key_length check (char_length(identifier_key) between 1 and 120),
  constraint scam_reports_note_length check (note is null or char_length(note) <= 500)
);

create index if not exists scam_reports_identifier_key_idx on public.scam_reports (identifier_key);

alter table public.scam_reports enable row level security;

drop policy if exists "public_insert_scam_reports" on public.scam_reports;
create policy "public_insert_scam_reports"
  on public.scam_reports
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public_select_scam_reports" on public.scam_reports;
create policy "public_select_scam_reports"
  on public.scam_reports
  for select
  to anon, authenticated
  using (true);
