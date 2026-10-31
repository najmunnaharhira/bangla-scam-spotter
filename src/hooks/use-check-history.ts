import * as React from "react";

import type { CheckRecord } from "@/lib/types";

const HISTORY_KEY = "scamshield-check-history";
const MAX_ITEMS = 10;

function readHistory(): CheckRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CheckRecord =>
        item != null &&
        typeof item === "object" &&
        typeof (item as CheckRecord).id === "string" &&
        (item as CheckRecord).result != null,
    );
  } catch {
    return [];
  }
}

function writeHistory(items: CheckRecord[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Storage may be full or unavailable; history is best-effort.
  }
}

/** Recent checks, kept in localStorage only (no server storage). */
export function useHistory() {
  const [history, setHistory] = React.useState<CheckRecord[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHistory(readHistory());
    setHydrated(true);
  }, []);

  const add = React.useCallback((record: CheckRecord) => {
    setHistory((prev) => {
      const next = [record, ...prev.filter((item) => item.id !== record.id)].slice(0, MAX_ITEMS);
      writeHistory(next);
      return next;
    });
  }, []);

  const clear = React.useCallback(() => {
    window.localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { history, hydrated, add, clear };
}
