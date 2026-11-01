import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHANNELS, GOLDEN_RULES, HELPLINES, SCAM_TYPES, type Helpline } from "@/lib/sample-data";

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
    };
  });
