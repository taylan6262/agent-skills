import { diffDays, type DayKey } from '../lib/date';

export interface StreakState {
  current: number;
  best: number;
  lastActiveDay: DayKey | null;
}

/** Zählt einen aktiven Tag. Mehrere Spiele am selben Tag zählen einmal. */
export function registerActivity(streak: StreakState, today: DayKey): StreakState {
  if (streak.lastActiveDay === today) return streak;
  const gap = streak.lastActiveDay === null ? Infinity : diffDays(streak.lastActiveDay, today);
  if (gap < 0) {
    // Gerätezeit wurde zurückgestellt – Serie nicht verfälschen.
    return streak;
  }
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastActiveDay: today };
}

/** Serie, wie sie heute angezeigt wird: verfällt, wenn gestern nicht gespielt wurde. */
export function visibleStreak(streak: StreakState, today: DayKey): number {
  if (streak.lastActiveDay === null) return 0;
  const gap = diffDays(streak.lastActiveDay, today);
  return gap <= 1 && gap >= 0 ? streak.current : 0;
}

/** Ob heute schon gespielt wurde (sonst ist die Serie „in Gefahr“). */
export function playedToday(streak: StreakState, today: DayKey): boolean {
  return streak.lastActiveDay === today;
}
