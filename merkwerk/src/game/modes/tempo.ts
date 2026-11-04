import { clamp, clamp01 } from '../../lib/math';
import type { Rng } from '../../lib/rng';
import type { PaletteColor } from '../levels';
import { TOKENS, type ShapeId } from '../symbols';

export type TempoKind = 'farbwort' | 'formwort' | 'gleich';

export interface TempoParams {
  durationMs: number;
  /** Richtige Antworten, die für volle Leistung nötig sind. */
  target: number;
  /** Zeitlimit pro Entscheidung (ab Stufe 5), sonst null. */
  trialLimitMs: number | null;
  kinds: TempoKind[];
  blockLength: number;
}

export const TEMPO_DURATION_MS = 30_000;

/**
 * @param colorAssist Bei aktivierter Farbsehhilfe wird „Farbe ↔ Wort“ durch „Form ↔ Wort“ ersetzt,
 *   damit die Aufgabe nicht allein über Farbe lösbar sein muss.
 */
export function tempoParams(difficulty: number, rng: Rng, colorAssist = false): TempoParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  const available: TempoKind[] = colorAssist
    ? ['formwort', 'gleich']
    : ['farbwort', 'gleich', 'formwort'];
  const n = d <= 3 ? 1 : d <= 8 ? 2 : 3;
  return {
    durationMs: TEMPO_DURATION_MS,
    target: Math.round(10 + 1.2 * d),
    trialLimitMs: d < 5 ? null : Math.round(3800 - d * 120),
    kinds: rng.shuffle(available).slice(0, Math.min(n, available.length)),
    blockLength: 6,
  };
}

export const COLOR_WORDS: Record<PaletteColor, string> = {
  rot: 'ROT',
  blau: 'BLAU',
  gelb: 'GELB',
  tinte: 'SCHWARZ',
};

export const SHAPE_WORDS: Partial<Record<ShapeId, string>> = {
  kreis: 'KREIS',
  quadrat: 'QUADRAT',
  dreieck: 'DREIECK',
  raute: 'RAUTE',
};

const WORD_COLORS: readonly PaletteColor[] = ['rot', 'blau', 'gelb', 'tinte'];
const WORD_SHAPES: readonly ShapeId[] = ['kreis', 'quadrat', 'dreieck', 'raute'];
const SAME_TOKENS: readonly ShapeId[] = TOKENS.slice(0, 6).map((t) => t.shape);

export type TempoTrial =
  | { kind: 'farbwort'; word: PaletteColor; fill: PaletteColor; match: boolean }
  | { kind: 'formwort'; word: ShapeId; shape: ShapeId; match: boolean }
  | { kind: 'gleich'; token: ShapeId; match: boolean; intro: boolean };

export interface TrialStream {
  next(): TempoTrial;
}

function other<T>(value: T, all: readonly T[], rng: Rng): T {
  return rng.pick(all.filter((v) => v !== value));
}

export function createTrialStream(params: TempoParams, rng: Rng): TrialStream {
  let kindIndex = -1;
  let remaining = 0;
  let lastToken: ShapeId | null = null;
  return {
    next(): TempoTrial {
      if (remaining <= 0) {
        kindIndex = (kindIndex + 1) % params.kinds.length;
        remaining = params.kinds.length > 1 ? params.blockLength : Number.POSITIVE_INFINITY;
        lastToken = null;
      }
      remaining -= 1;
      const kind = params.kinds[kindIndex] ?? 'gleich';
      const match = rng.chance(0.5);
      if (kind === 'farbwort') {
        const word = rng.pick(WORD_COLORS);
        return { kind, word, fill: match ? word : other(word, WORD_COLORS, rng), match };
      }
      if (kind === 'formwort') {
        const word = rng.pick(WORD_SHAPES);
        return { kind, word, shape: match ? word : other(word, WORD_SHAPES, rng), match };
      }
      if (lastToken === null) {
        lastToken = rng.pick(SAME_TOKENS);
        // Erstes Symbol eines Blocks nur einprägen – es gibt noch kein „vorher“.
        remaining += 1;
        return { kind: 'gleich', token: lastToken, match: false, intro: true };
      }
      const token: ShapeId = match ? lastToken : other(lastToken, SAME_TOKENS, rng);
      lastToken = token;
      return { kind: 'gleich', token, match, intro: false };
    },
  };
}

/** Combo-Multiplikator nach einer richtigen Antwort: ×1 bis ×4 in 5er-Schritten. */
export function comboMultiplier(combo: number): number {
  return Math.min(4, 1 + Math.floor(Math.max(0, combo) / 5));
}

export function pointsForAnswer(reactionMs: number, comboAfter: number): number {
  const speedBonus = clamp(Math.round((1500 - reactionMs) / 100), 0, 15);
  return 10 * comboMultiplier(comboAfter) + speedBonus;
}

export function tempoPerformance(correct: number, wrong: number, target: number): number {
  const total = correct + wrong;
  if (total === 0 || target <= 0) return 0;
  return clamp01(correct / target) * (correct / total);
}
