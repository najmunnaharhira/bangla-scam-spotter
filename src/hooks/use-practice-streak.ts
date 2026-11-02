import * as React from "react";

const STORAGE_KEY = "scamshield-practice-streak";

interface StreakState {
  current: number;
  best: number;
  lastPlayedDate: string | null; // YYYY-MM-DD, local
  roundsCompleted: number;
  correctTotal: number;
}

const EMPTY: StreakState = { current: 0, best: 0, lastPlayedDate: null, roundsCompleted: 0, correctTotal: 0 };

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);
}

function read(): StreakState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function write(state: StreakState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private browsing); streak just won't persist.
  }
}

export interface Badge {
  id: string;
  threshold: number;
}

export const STREAK_BADGES: Badge[] = [
  { id: "streak_3", threshold: 3 },
  { id: "streak_7", threshold: 7 },
  { id: "streak_30", threshold: 30 },
];

export const ANSWER_BADGES: Badge[] = [
  { id: "answers_25", threshold: 25 },
  { id: "answers_100", threshold: 100 },
];

/** Daily practice streak + simple badges, kept in localStorage only. */
export function usePracticeStreak() {
  const [state, setState] = React.useState<StreakState>(EMPTY);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  /** Call once per completed round, with that round's correct-answer count. */
  const recordRound = React.useCallback((correctCount: number) => {
    setState((prev) => {
      const today = todayKey();
      let current = prev.current;
      if (prev.lastPlayedDate === today) {
        // Already played today: streak unchanged.
      } else if (prev.lastPlayedDate && daysBetween(prev.lastPlayedDate, today) === 1) {
        current = prev.current + 1;
      } else {
        current = 1;
      }
      const next: StreakState = {
        current,
        best: Math.max(prev.best, current),
        lastPlayedDate: today,
        roundsCompleted: prev.roundsCompleted + 1,
        correctTotal: prev.correctTotal + correctCount,
      };
      write(next);
      return next;
    });
  }, []);

  const earnedBadges = React.useMemo(
    () => [
      ...STREAK_BADGES.filter((b) => state.best >= b.threshold),
      ...ANSWER_BADGES.filter((b) => state.correctTotal >= b.threshold),
    ],
    [state.best, state.correctTotal],
  );

  return { ...state, hydrated, recordRound, earnedBadges };
}
