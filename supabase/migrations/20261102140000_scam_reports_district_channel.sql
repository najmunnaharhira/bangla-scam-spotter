-- Adds district + channel to community scam reports, so reports can be
-- browsed by location and by how the scam arrived. Nullable: existing rows
-- and reports that skip these fields stay valid.
alter table public.scam_reports
  add column if not exists district text,
  add column if not exists channel text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scam_reports_district_length') then
    alter table public.scam_reports
      add constraint scam_reports_district_length check (district is null or char_length(district) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'scam_reports_channel_length') then
    alter table public.scam_reports
      add constraint scam_reports_channel_length check (channel is null or char_length(channel) <= 40);
  end if;
end $$;

create index if not exists scam_reports_district_idx on public.scam_reports (district);
create index if not exists scam_reports_channel_idx on public.scam_reports (channel);
