import { clamp } from '../lib/math';
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from './types';

/**
 * Adaptive Schwierigkeit pro Modus.
 * - `offset` verschiebt die feste Stufe der Kampagnen-Level (−2 … +2), damit Sterne vergleichbar bleiben.
 * - `rating` ist die absolute Stufe im freien Training und in der Tagesaufgabe (1 … 20).
 */
export interface AdaptiveState {
  offset: number;
  rating: number;
  winStreak: number;
  failStreak: number;
}

export const ADAPTIVE_RULES = {
  /** Ab dieser Leistung gilt eine Runde als „zu leicht gewonnen“. */
  winThreshold: 0.9,
  /** Unter dieser Leistung gilt eine Runde als gescheitert. */
  failThreshold: 0.5,
  /** So viele Runden in Folge lösen eine Anpassung aus. */
  streakLength: 2,
  offsetMin: -2,
  offsetMax: 2,
} as const;

export function defaultAdaptive(rating = 1): AdaptiveState {
  return {
    offset: 0,
    rating: clamp(rating, MIN_DIFFICULTY, MAX_DIFFICULTY),
    winStreak: 0,
    failStreak: 0,
  };
}

export interface AdaptiveStep {
  delta: -1 | 0 | 1;
  winStreak: number;
  failStreak: number;
}

/** Reine Regel: Wer zweimal in Folge sehr gut ist, bekommt +1; wer zweimal scheitert, −1. */
export function adaptiveStep(
  winStreak: number,
  failStreak: number,
  performance: number,
): AdaptiveStep {
  if (performance >= ADAPTIVE_RULES.winThreshold) {
    const wins = winStreak + 1;
    if (wins >= ADAPTIVE_RULES.streakLength) return { delta: 1, winStreak: 0, failStreak: 0 };
    return { delta: 0, winStreak: wins, failStreak: 0 };
  }
  if (performance < ADAPTIVE_RULES.failThreshold) {
    const fails = failStreak + 1;
    if (fails >= ADAPTIVE_RULES.streakLength) return { delta: -1, winStreak: 0, failStreak: 0 };
    return { delta: 0, winStreak: 0, failStreak: fails };
  }
  return { delta: 0, winStreak: 0, failStreak: 0 };
}

export type PlayKind = 'level' | 'training' | 'daily';

export interface AdaptiveUpdate {
  state: AdaptiveState;
  /** Tatsächliche Änderung nach Begrenzung (0, wenn bereits am Rand). */
  change: -1 | 0 | 1;
}

export function updateAdaptive(
  state: AdaptiveState,
  performance: number,
  kind: PlayKind,
): AdaptiveUpdate {
  const step = adaptiveStep(state.winStreak, state.failStreak, performance);
  let { offset, rating } = state;
  if (kind === 'level') {
    offset = clamp(offset + step.delta, ADAPTIVE_RULES.offsetMin, ADAPTIVE_RULES.offsetMax);
  } else {
    rating = clamp(rating + step.delta, MIN_DIFFICULTY, MAX_DIFFICULTY);
  }
  const before = kind === 'level' ? state.offset : state.rating;
  const after = kind === 'level' ? offset : rating;
  const change = Math.sign(after - before) as -1 | 0 | 1;
  return {
    state: { offset, rating, winStreak: step.winStreak, failStreak: step.failStreak },
    change,
  };
}

/** Stufe eines Kampagnen-Levels inklusive adaptivem Versatz. */
export function effectiveDifficulty(baseDifficulty: number, offset: number): number {
  return clamp(Math.round(baseDifficulty + offset), MIN_DIFFICULTY, MAX_DIFFICULTY);
}
