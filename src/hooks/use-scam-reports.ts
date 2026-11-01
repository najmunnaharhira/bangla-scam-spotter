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

export async function reportScamSender(identifier: string, note?: string): Promise<boolean> {
  const trimmed = identifier.trim();
  if (trimmed.length < 3) return false;
  const { error } = await supabase.from("scam_reports").insert({
    identifier: trimmed.slice(0, 120),
    identifier_key: normalizeIdentifier(trimmed),
    note: note?.trim() ? note.trim().slice(0, 500) : null,
  });
  return !error;
}
