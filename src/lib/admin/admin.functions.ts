import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHANNELS, GOLDEN_RULES, HELPLINES, SCAM_TYPES, type Helpline } from "@/lib/sample-data";

export interface RecentReport {
  id: string;
  identifier: string;
  district: string | null;
  channel: string | null;
  scamType: string | null;
  createdAt: string;
}

export interface AdminOverview {
  email: string;
  stats: {
    helplines: number;
    scamTypes: number;
    goldenRules: number;
    channels: number;
  };
  helplines: Helpline[];
  goldenRules: string[];
  scamTypes: { title: string; description: string }[];
  reportStats: {
    total: number;
    today: number;
    thisWeek: number;
    topDistrict: { district: string; count: number } | null;
    topScamType: { scamType: string; count: number } | null;
  };
  recentReports: RecentReport[];
}

/** Idempotent: creates the single admin account the first time it's missing. */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { ensureAdminAccountExists } = await import("./admin-auth.server");
  await ensureAdminAccountExists();
});

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { isAdminEmail } = await import("./admin-auth.server");
    const email = typeof context.claims["email"] === "string" ? (context.claims["email"] as string) : undefined;
    if (!isAdminEmail(email)) {
      throw new Error("FORBIDDEN: You are not authorized to view the admin dashboard.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("scam_reports")
      .select("id, identifier, district, channel, scam_type, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const reports = rows ?? [];
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const districtCounts = new Map<string, number>();
    const scamTypeCounts = new Map<string, number>();
    let today = 0;
    let thisWeek = 0;
    for (const row of reports) {
      const createdAt = new Date(row.created_at).getTime();
      if (createdAt >= todayStart.getTime()) today += 1;
      if (createdAt >= weekAgo) thisWeek += 1;
      if (row.district) districtCounts.set(row.district, (districtCounts.get(row.district) ?? 0) + 1);
      if (row.scam_type) scamTypeCounts.set(row.scam_type, (scamTypeCounts.get(row.scam_type) ?? 0) + 1);
    }
    const topOf = (counts: Map<string, number>) => {
      let best: { key: string; count: number } | null = null;
      for (const [key, count] of counts) {
        if (!best || count > best.count) best = { key, count };
      }
      return best;
    };
    const topDistrictEntry = topOf(districtCounts);
    const topScamTypeEntry = topOf(scamTypeCounts);

    return {
      email: email!,
      stats: {
        helplines: HELPLINES.length,
        scamTypes: SCAM_TYPES.length,
        goldenRules: GOLDEN_RULES.length,
        channels: CHANNELS.length,
      },
      helplines: HELPLINES,
      goldenRules: GOLDEN_RULES,
      scamTypes: SCAM_TYPES.map((scam) => ({ title: scam.title, description: scam.description })),
      reportStats: {
        total: reports.length,
        today,
        thisWeek,
        topDistrict: topDistrictEntry ? { district: topDistrictEntry.key, count: topDistrictEntry.count } : null,
        topScamType: topScamTypeEntry ? { scamType: topScamTypeEntry.key, count: topScamTypeEntry.count } : null,
      },
      recentReports: reports.slice(0, 10).map((row) => ({
        id: row.id,
        identifier: row.identifier,
        district: row.district,
        channel: row.channel,
        scamType: row.scam_type,
        createdAt: row.created_at,
      })),
    };
  });
