import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';

/**
 * Rechenwaage: Zwei Rechenausdrücke liegen auf einer Waage. Welche Seite wiegt mehr –
 * oder sind beide gleich? Trainiert Kopfrechnen unter Zeitdruck.
 */
export type Side = 'links' | 'rechts' | 'gleich';

export interface Term {
  /** Anzeige, z. B. „7 × 8“. */
  text: string;
  /** Für Screenreader, z. B. „7 mal 8“. */
  spoken: string;
  value: number;
}

export interface ScaleTrial {
  left: Term;
  right: Term;
  answer: Side;
}

export interface RechenwaageParams {
  durationMs: number;
  target: number;
  tier: 1 | 2 | 3 | 4 | 5;
  maxDiff: number;
  equalChance: number;
}

export const RECHENWAAGE_DURATION_MS = 40_000;

export function rechenwaageParams(difficulty: number): RechenwaageParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  const tier: RechenwaageParams['tier'] = d <= 3 ? 1 : d <= 7 ? 2 : d <= 11 ? 3 : d <= 15 ? 4 : 5;
  return {
    durationMs: RECHENWAAGE_DURATION_MS,
    target: Math.round(8 + 0.8 * d),
    tier,
    maxDiff: Math.max(2, 10 - Math.floor(d / 2)),
    equalChance: 0.2,
  };
}

const SPOKEN: Record<string, string> = {
  '+': 'plus',
  '−': 'minus',
  '×': 'mal',
  ':': 'geteilt durch',
};

function term(parts: (number | string)[]): Omit<Term, 'value'> {
  const text = parts.join(' ');
  const spoken = parts.map((p) => (typeof p === 'string' ? (SPOKEN[p] ?? p) : String(p))).join(' ');
  return { text, spoken };
}

/** Ein zufälliger Ausdruck der jeweiligen Stufe; das Ergebnis ist immer eine nicht negative ganze Zahl. */
export function makeTerm(tier: RechenwaageParams['tier'], rng: Rng): Term {
  const kind = rng.int(0, 2);
  if (tier === 1) {
    const a = rng.int(1, 9);
    const b = rng.int(1, 9);
    return { ...term([a, '+', b]), value: a + b };
  }
  if (tier === 2) {
    if (kind === 0) {
      const a = rng.int(10, 20);
      const b = rng.int(1, 9);
      return { ...term([a, '−', b]), value: a - b };
    }
    const a = rng.int(2, 19);
    const b = rng.int(2, 12);
    return { ...term([a, '+', b]), value: a + b };
  }
  if (tier === 3) {
    if (kind === 0) {
      const a = rng.int(10, 40);
      const b = rng.int(5, 30);
      return { ...term([a, '+', b]), value: a + b };
    }
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    return { ...term([a, '×', b]), value: a * b };
  }
  if (tier === 4) {
    if (kind === 0) {
      const a = rng.int(20, 60);
      const b = rng.int(3, 19);
      return { ...term([a, '−', b]), value: a - b };
    }
    if (kind === 1) {
      const b = rng.int(2, 9);
      const q = rng.int(2, 12);
      return { ...term([b * q, ':', b]), value: q };
    }
    const a = rng.int(3, 12);
    const b = rng.int(3, 12);
    return { ...term([a, '×', b]), value: a * b };
  }
  if (kind === 0) {
    const a = rng.int(12, 25);
    const b = rng.int(2, 5);
    return { ...term([a, '×', b]), value: a * b };
  }
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const c = rng.int(1, 20);
  if (kind === 1 && a * b > c) return { ...term([a, '×', b, '−', c]), value: a * b - c };
  return { ...term([a, '×', b, '+', c]), value: a * b + c };
}

/** Sucht einen Ausdruck mit genau diesem Wert; notfalls eine einfache Summe oder Differenz. */
export function termWithValue(
  tier: RechenwaageParams['tier'],
  value: number,
  rng: Rng,
  avoid: string,
): Term {
  for (let attempt = 0; attempt < 250; attempt++) {
    const candidate = makeTerm(tier, rng);
    if (candidate.value === value && candidate.text !== avoid) return candidate;
  }
  if (value >= 2) {
    const a = rng.int(1, value - 1);
    const fallback = { ...term([a, '+', value - a]), value };
    if (fallback.text !== avoid) return fallback;
  }
  const b = rng.int(1, 9);
  return { ...term([value + b, '−', b]), value };
}

export function createScaleTrial(params: RechenwaageParams, rng: Rng): ScaleTrial {
  const first = makeTerm(params.tier, rng);
  let second: Term;
  if (rng.chance(params.equalChance)) {
    second = termWithValue(params.tier, first.value, rng, first.text);
  } else {
    let target = first.value + rng.int(1, params.maxDiff) * (rng.chance(0.5) ? 1 : -1);
    if (target < 0) target = first.value + rng.int(1, params.maxDiff);
    second = termWithValue(params.tier, target, rng, first.text);
  }
  const [left, right] = rng.chance(0.5) ? [first, second] : [second, first];
  const answer: Side =
    left.value === right.value ? 'gleich' : left.value > right.value ? 'links' : 'rechts';
  return { left, right, answer };
}
