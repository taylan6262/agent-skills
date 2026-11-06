/** Deterministischer Zufallsgenerator (mulberry32), damit Runden reproduzierbar und testbar sind. */
export interface Rng {
  /** Gleichverteilte Zahl in [0, 1). */
  next(): number;
  /** Ganze Zahl in [min, max] (beide inklusive). */
  int(min: number, max: number): number;
  /** Zufälliges Element einer nicht-leeren Liste. */
  pick<T>(items: readonly T[]): T;
  /** Neue, gemischte Kopie der Liste (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** true mit Wahrscheinlichkeit p. */
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('pick() braucht mindestens ein Element');
      return items[int(0, items.length - 1)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        const tmp = copy[i] as T;
        copy[i] = copy[j] as T;
        copy[j] = tmp;
      }
      return copy;
    },
    chance(p: number): boolean {
      return next() < p;
    },
  };
}

/** Stabiler 32-Bit-Hash (FNV-1a) für Seeds aus Text, z. B. dem Datum der Tagesaufgabe. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Zufälliger Seed für normale Runden. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}
