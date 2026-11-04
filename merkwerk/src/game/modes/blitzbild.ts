import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';
import { TOKENS, type ShapeId } from '../symbols';

export type BlitzbildVariant = 'positionen' | 'formen';

export interface BlitzbildParams {
  size: number;
  count: number;
  showMs: number;
  variant: BlitzbildVariant;
  /** Anzahl verschiedener Formen (nur Variante „formen“). */
  kinds: number;
  rounds: number;
}

const TIERS = [
  { size: 3, from: 1, to: 4, minCount: 3, maxCount: 4 },
  { size: 4, from: 5, to: 9, minCount: 4, maxCount: 6 },
  { size: 5, from: 10, to: 14, minCount: 6, maxCount: 8 },
  { size: 6, from: 15, to: 20, minCount: 8, maxCount: 10 },
] as const;

export function blitzbildParams(difficulty: number): BlitzbildParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  const tier = TIERS.find((t) => d >= t.from && d <= t.to) ?? TIERS[0];
  const progress = (d - tier.from) / (tier.to - tier.from);
  const count = Math.round(tier.minCount + progress * (tier.maxCount - tier.minCount));
  const variant: BlitzbildVariant = d >= 6 ? 'formen' : 'positionen';
  const kinds = variant === 'formen' ? clamp(2 + Math.floor((d - 6) / 3), 2, 6) : 1;
  return {
    size: tier.size,
    count,
    showMs: Math.round(3200 - (d - 1) * 110),
    variant,
    kinds: Math.min(kinds, count),
    rounds: 3,
  };
}

/** Ein Raster als flache Liste (zeilenweise); `null` = leeres Feld. */
export type Board = (ShapeId | null)[];

export interface BlitzbildRound {
  size: number;
  board: Board;
}

export function generateRound(params: BlitzbildParams, rng: Rng): BlitzbildRound {
  const cellCount = params.size * params.size;
  const positions = rng.shuffle(Array.from({ length: cellCount }, (_, i) => i)).slice(0, params.count);
  const kinds =
    params.variant === 'positionen'
      ? (['quadrat'] as ShapeId[])
      : rng.shuffle(TOKENS.map((t) => t.shape)).slice(0, params.kinds);
  // Jede gewählte Form kommt mindestens einmal vor, der Rest zufällig.
  const shapes = rng.shuffle(
    positions.map((_, i) => (i < kinds.length ? kinds[i] : rng.pick(kinds)) as ShapeId),
  );
  const board: Board = new Array<ShapeId | null>(cellCount).fill(null);
  positions.forEach((pos, i) => {
    board[pos] = shapes[i] ?? null;
  });
  return { size: params.size, board };
}

/** Wie oft jede Form auf dem Brett vorkommt – daraus wird die Ablage für Variante „formen“. */
export function trayFor(board: Board): Map<ShapeId, number> {
  const tray = new Map<ShapeId, number>();
  for (const cell of board) if (cell) tray.set(cell, (tray.get(cell) ?? 0) + 1);
  return tray;
}

export interface RoundEvaluation {
  correct: number;
  wrong: number;
  missed: number;
  accuracy: number;
  perfect: boolean;
  score: number;
}

export function evaluateRound(round: BlitzbildRound, answer: Board, variant: BlitzbildVariant): RoundEvaluation {
  let correct = 0;
  let wrong = 0;
  let missed = 0;
  let target = 0;
  round.board.forEach((expected, i) => {
    const given = answer[i] ?? null;
    if (expected) target += 1;
    if (variant === 'positionen') {
      if (expected && given) correct += 1;
      else if (!expected && given) wrong += 1;
      else if (expected && !given) missed += 1;
    } else if (expected && given === expected) {
      correct += 1;
    } else if (given) {
      wrong += 1;
      if (expected) missed += 1;
    } else if (expected) {
      missed += 1;
    }
  });
  const accuracy = target === 0 ? 0 : clamp((correct - (variant === 'positionen' ? wrong : 0)) / target, 0, 1);
  const score = Math.max(0, correct * 10 * round.size - wrong * 5);
  return { correct, wrong, missed, accuracy, perfect: correct === target && wrong === 0, score };
}
