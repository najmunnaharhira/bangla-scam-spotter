// Server-only: never import this from a route file or any *.functions.ts at the
// top level, or the admin email/password constants would ship to the client bundle.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function adminEmail(): string | undefined {
  return process.env["ADMIN_EMAIL"]?.trim() || undefined;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  const configured = adminEmail();
  return !!email && !!configured && email.toLowerCase() === configured.toLowerCase();
}

/**
 * Creates the one admin account if it doesn't exist yet. Safe to call on every
 * login attempt: it never touches the account once it's there, so a password
 * changed later in Supabase keeps working.
 */
export async function ensureAdminAccountExists(): Promise<void> {
  const email = adminEmail();
  const seedPassword = process.env["ADMIN_SEED_PASSWORD"];
  if (!email || !seedPassword) {
    throw new Error(
      "UNAVAILABLE: The admin account has not been set up yet. Set ADMIN_EMAIL and ADMIN_SEED_PASSWORD in the project's environment variables, then try signing in again.",
    );
  }

  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`UNAVAILABLE: Could not reach the admin account service (${error.message}).`);
    }
    if (data.users.some((user) => isAdminEmail(user.email))) return;
    if (data.users.length < perPage) break;
    page += 1;
  }

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });
  if (createError) {
    throw new Error(`UNAVAILABLE: Could not set up the admin account (${createError.message}).`);
  }
}
