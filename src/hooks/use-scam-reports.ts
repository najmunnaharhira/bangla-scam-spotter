import * as React from "react";

import { supabase } from "@/integrations/supabase/client";
import { normalizeIdentifier } from "@/lib/report-utils";

/** Community scam-sender reports, backed by a public Supabase table (no auth
 * required). Degrades silently if the table isn't reachable yet. */
export function useScamReportCount(identifier: string | undefined) {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    const trimmed = identifier?.trim();
    if (!trimmed) {
      setCount(null);
      return;
    }
    let cancelled = false;
    const key = normalizeIdentifier(trimmed);
    supabase
      .from("scam_reports")
      .select("id", { count: "exact", head: true })
      .eq("identifier_key", key)
      .then(({ count: result, error }) => {
        if (cancelled) return;
        setCount(error ? null : (result ?? 0));
      });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return count;
}

/** Non-hook version for use outside React (e.g. the MCP server's lookup tool). */
export async function getScamReportCount(identifier: string): Promise<number> {
  const trimmed = identifier.trim();
  if (!trimmed) return 0;
  const { count, error } = await supabase
    .from("scam_reports")
    .select("id", { count: "exact", head: true })
    .eq("identifier_key", normalizeIdentifier(trimmed));
  if (error) return 0;
  return count ?? 0;
}

export interface ReportScamSenderInput {
  identifier: string;
  note?: string | undefined;
  district?: string | undefined;
  channel?: string | undefined;
  scamType?: string | undefined;
}

export async function reportScamSender(input: ReportScamSenderInput): Promise<boolean> {
  const trimmed = input.identifier.trim();
  if (trimmed.length < 3) return false;
  const { error } = await supabase.from("scam_reports").insert({
    identifier: trimmed.slice(0, 120),
    identifier_key: normalizeIdentifier(trimmed),
    note: input.note?.trim() ? input.note.trim().slice(0, 500) : null,
    district: input.district?.trim() ? input.district.trim().slice(0, 60) : null,
    channel: input.channel?.trim() ? input.channel.trim().slice(0, 40) : null,
    scam_type: input.scamType?.trim() ? input.scamType.trim().slice(0, 80) : null,
  });
  return !error;
}

export interface DistrictCount {
  district: string;
  count: number;
}

/** Report counts grouped by district, optionally filtered by channel (sender
 * type). Aggregates client-side over the row set — fine at community-reports
 * scale; swap for a DB-side `group by` RPC if volume grows. */
export async function getDistrictReportCounts(channel?: string): Promise<DistrictCount[]> {
  let query = supabase.from("scam_reports").select("district").not("district", "is", null);
  if (channel) query = query.eq("channel", channel);
  const { data, error } = await query;
  if (error || !data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    const district = row.district;
    if (!district) continue;
    counts.set(district, (counts.get(district) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ScamTypeCount {
  scamType: string;
  count: number;
}

/** Most-reported scam types, derived from the AI's classification of each
 * reported message at the moment it was reported (no separate category
 * input needed from the user). */
export async function getTrendingScamTypes(limit = 10): Promise<ScamTypeCount[]> {
  const { data, error } = await supabase.from("scam_reports").select("scam_type").not("scam_type", "is", null);
  if (error || !data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    const scamType = row.scam_type;
    if (!scamType) continue;
    counts.set(scamType, (counts.get(scamType) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([scamType, count]) => ({ scamType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
