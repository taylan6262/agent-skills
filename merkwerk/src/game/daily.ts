import type { DayKey } from '../lib/date';
import { clamp } from '../lib/math';
import { createRng, hashString } from '../lib/rng';
import type { AdaptiveState } from './adaptive';
import { MAX_DIFFICULTY, MIN_DIFFICULTY, MODE_IDS, type ModeId } from './types';

export interface DailyChallenge {
  day: DayKey;
  mode: ModeId;
  difficulty: number;
  seed: number;
}

/** Die Tagesaufgabe ergibt sich aus dem Datum – für alle gleich im Modus, in der Stufe angepasst. */
export function dailyChallenge(
  day: DayKey,
  adaptive: Readonly<Record<ModeId, AdaptiveState>>,
): DailyChallenge {
  const seed = hashString(`merkwerk:${day}`);
  const rng = createRng(seed);
  const mode = rng.pick(MODE_IDS);
  const difficulty = clamp(adaptive[mode].rating + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);
  return { day, mode, difficulty, seed };
}

export function isDailyDone(lastCompletedDay: DayKey | null, today: DayKey): boolean {
  return lastCompletedDay === today;
}
