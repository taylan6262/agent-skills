import type { DayKey } from '../lib/date';
import { SKILL_IDS, type SkillId } from '../game/types';
import type { DayStat } from './schema';

export interface SkillSeries {
  days: DayKey[];
  values: Record<SkillId, (number | null)[]>;
}

/** Tageswerte (Durchschnitt) je Fähigkeit für die letzten `limit` Tage mit Daten. */
export function skillSeries(
  days: Readonly<Record<DayKey, Partial<Record<SkillId, DayStat>>>>,
  limit = 30,
): SkillSeries {
  const keys = Object.keys(days)
    .filter((key) => Object.keys(days[key] ?? {}).length > 0)
    .sort()
    .slice(-limit);
  const values = Object.fromEntries(
    SKILL_IDS.map((skill) => [
      skill,
      keys.map((key) => {
        const stat = days[key]?.[skill];
        return stat && stat.n > 0 ? Math.round(stat.sum / stat.n) : null;
      }),
    ]),
  ) as Record<SkillId, (number | null)[]>;
  return { days: keys, values };
}

export interface SkillTrend {
  latest: number | null;
  first: number | null;
  change: number | null;
}

/** Erster und letzter vorhandener Wert einer Reihe – für „seit Beginn“-Angaben. */
export function trendOf(values: readonly (number | null)[]): SkillTrend {
  const present = values.filter((v): v is number => v !== null);
  const first = present[0] ?? null;
  const latest = present[present.length - 1] ?? null;
  return {
    first,
    latest,
    change: first !== null && latest !== null && present.length > 1 ? latest - first : null,
  };
}
