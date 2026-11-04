import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';

export type Direction = 'vorwaerts' | 'rueckwaerts';

export interface ZahlenspurParams {
  startLength: number;
  digitMs: number;
  backwardsChance: number;
  trials: number;
}

export const MIN_SPAN = 3;
export const MAX_SPAN = 12;

export function zahlenspurParams(difficulty: number): ZahlenspurParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  return {
    startLength: MIN_SPAN + Math.floor((d - 1) / 3),
    digitMs: Math.round(1000 - (d - 1) * 20),
    backwardsChance: d < 6 ? 0 : d < 12 ? 0.4 : 0.6,
    trials: 5,
  };
}

/** Ziffernfolge ohne direkt aufeinanderfolgende gleiche Ziffern. */
export function generateSequence(length: number, rng: Rng): number[] {
  const digits: number[] = [];
  while (digits.length < length) {
    const digit = rng.int(0, 9);
    if (digit !== digits[digits.length - 1]) digits.push(digit);
  }
  return digits;
}

export function directionFor(trialIndex: number, params: ZahlenspurParams, rng: Rng): Direction {
  if (trialIndex === 0) return 'vorwaerts';
  return rng.chance(params.backwardsChance) ? 'rueckwaerts' : 'vorwaerts';
}

export interface TrialEvaluation {
  positionsCorrect: number;
  accuracy: number;
  perfect: boolean;
  score: number;
}

export function expectedInput(sequence: readonly number[], direction: Direction): number[] {
  return direction === 'rueckwaerts' ? [...sequence].reverse() : [...sequence];
}

export function evaluateTrial(
  sequence: readonly number[],
  direction: Direction,
  input: readonly number[],
): TrialEvaluation {
  const expected = expectedInput(sequence, direction);
  let positionsCorrect = 0;
  expected.forEach((digit, i) => {
    if (input[i] === digit) positionsCorrect += 1;
  });
  const perfect = positionsCorrect === expected.length && input.length === expected.length;
  const accuracy = expected.length === 0 ? 0 : positionsCorrect / expected.length;
  const factor = direction === 'rueckwaerts' ? 1.5 : 1;
  const score = Math.round(perfect ? expected.length * 15 * factor : positionsCorrect * 3);
  return { positionsCorrect, accuracy, perfect, score };
}

/** Länge der nächsten Folge: nach einer perfekten Folge länger, nach einem klaren Fehlschlag kürzer. */
export function nextLength(current: number, evaluation: TrialEvaluation): number {
  if (evaluation.perfect) return Math.min(MAX_SPAN, current + 1);
  if (evaluation.accuracy < 0.5) return Math.max(MIN_SPAN, current - 1);
  return current;
}
