import { clamp } from '../lib/math';
import type { ModeId } from './types';

export interface PlacementResult {
  /** Startstufe im freien Training je Modus. */
  ratings: Record<ModeId, number>;
  /** Versatz für Gedächtnis-Level in der Kampagne (−1 … +1). */
  memoryOffset: -1 | 0 | 1;
}

/**
 * Leitet aus der Merkspanne des Einstufungstests (Ziffern vorwärts) Startstufen ab.
 * Eine typische Spanne liegt bei 5 bis 7 Ziffern; Tempo und Wissen werden nicht getestet.
 */
export function placementFromSpan(span: number): PlacementResult {
  const s = clamp(Math.round(span), 2, 12);
  const memory = clamp(1 + (s - 3) * 2, 1, 10);
  return {
    ratings: {
      zahlenspur: clamp(1 + (s - 3) * 3, 1, 12),
      blitzbild: memory,
      detailblick: memory,
      tempo: 1,
      wissen: 1,
    },
    memoryOffset: s >= 7 ? 1 : s <= 3 ? -1 : 0,
  };
}
