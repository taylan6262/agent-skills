import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';
import { evaluateTrial, nextLength, type Direction, type TrialEvaluation } from './zahlenspur';

/**
 * Wegmarken: Felder eines Rasters leuchten nacheinander auf; der Weg wird danach in derselben
 * (oder umgekehrten) Reihenfolge nachgetippt. Trainiert das räumliche Arbeitsgedächtnis.
 */
export interface WegmarkenParams {
  size: number;
  startLength: number;
  maxLength: number;
  stepMs: number;
  backwardsChance: number;
  trials: number;
}

export function wegmarkenParams(difficulty: number): WegmarkenParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  const size = d <= 6 ? 3 : d <= 13 ? 4 : 5;
  return {
    size,
    startLength: 3 + Math.floor((d - 1) / 4),
    maxLength: Math.min(10, size * size),
    stepMs: Math.round(950 - (d - 1) * 22),
    backwardsChance: d < 10 ? 0 : d < 16 ? 0.35 : 0.5,
    trials: 5,
  };
}

/** Weg aus verschiedenen Feldern (Indizes zeilenweise). */
export function generatePath(length: number, size: number, rng: Rng): number[] {
  const cells = Array.from({ length: size * size }, (_, i) => i);
  return rng.shuffle(cells).slice(0, Math.min(length, cells.length));
}

export function pathDirection(trialIndex: number, params: WegmarkenParams, rng: Rng): Direction {
  if (trialIndex === 0) return 'vorwaerts';
  return rng.chance(params.backwardsChance) ? 'rueckwaerts' : 'vorwaerts';
}

export function evaluatePath(
  path: readonly number[],
  direction: Direction,
  input: readonly number[],
): TrialEvaluation {
  return evaluateTrial(path, direction, input);
}

export function nextPathLength(
  current: number,
  evaluation: TrialEvaluation,
  params: WegmarkenParams,
): number {
  return clamp(nextLength(current, evaluation), 3, params.maxLength);
}
