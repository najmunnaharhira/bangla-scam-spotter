-- Adds a scam_type column to community scam reports, filled in from the AI's
-- own classification of the message at the moment it's reported (no extra
-- input required from the user). Backs the "trending scam types" view.
alter table public.scam_reports
  add column if not exists scam_type text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scam_reports_scam_type_length') then
    alter table public.scam_reports
      add constraint scam_reports_scam_type_length check (scam_type is null or char_length(scam_type) <= 80);
  end if;
end $$;

create index if not exists scam_reports_scam_type_idx on public.scam_reports (scam_type);
