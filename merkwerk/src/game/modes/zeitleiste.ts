import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';

/** Zeitleiste: Ereignisse in die richtige zeitliche Reihenfolge bringen. */
export interface HistoricEvent {
  id: string;
  /** Jahr; negative Werte sind Jahre vor Christus. */
  year: number;
  text: string;
  /** Nur ungefähr datiert („um 2560 v. Chr.“). */
  approx?: boolean;
}

export interface ZeitleisteParams {
  count: number;
  /** Mindestabstand zwischen zwei Ereignissen einer Runde in Jahren. */
  minGap: number;
  rounds: number;
}

export function zeitleisteParams(difficulty: number): ZeitleisteParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  return {
    count: d <= 5 ? 3 : d <= 12 ? 4 : 5,
    minGap: d <= 4 ? 150 : d <= 8 ? 60 : d <= 12 ? 25 : d <= 16 ? 10 : 3,
    rounds: 4,
  };
}

export function formatYear(event: Pick<HistoricEvent, 'year' | 'approx'>): string {
  const base = event.year < 0 ? `${-event.year} v. Chr.` : String(event.year);
  return event.approx ? `um ${base}` : base;
}

/** Ungefähr datierte Ereignisse brauchen immer mindestens diesen Abstand zu anderen. */
export const APPROX_GAP = 50;

function farEnough(a: HistoricEvent, b: HistoricEvent, gap: number): boolean {
  const needed = a.approx || b.approx ? Math.max(gap, APPROX_GAP) : gap;
  return Math.abs(a.year - b.year) >= needed;
}

/**
 * Wählt Ereignisse mit ausreichend Abstand, die in dieser Partie noch nicht vorkamen.
 * Reicht der Vorrat nicht, wird der Mindestabstand schrittweise verringert.
 */
export function pickRound(
  events: readonly HistoricEvent[],
  params: ZeitleisteParams,
  rng: Rng,
  used: ReadonlySet<string>,
): HistoricEvent[] {
  const pool = rng.shuffle(events.filter((e) => !used.has(e.id)));
  for (let gap = params.minGap; gap >= 1; gap = Math.floor(gap / 2)) {
    const chosen: HistoricEvent[] = [];
    for (const event of pool) {
      if (chosen.every((c) => farEnough(c, event, gap))) chosen.push(event);
      if (chosen.length === params.count) return chosen;
    }
  }
  return pool.slice(0, params.count);
}

export function chronological(events: readonly HistoricEvent[]): HistoricEvent[] {
  return [...events].sort((a, b) => a.year - b.year);
}

export interface OrderEvaluation {
  correct: number;
  accuracy: number;
  perfect: boolean;
  score: number;
}

/** Bewertet die gelegte Reihenfolge Platz für Platz gegen die richtige. */
export function evaluateOrder(
  placedIds: readonly string[],
  events: readonly HistoricEvent[],
): OrderEvaluation {
  const expected = chronological(events).map((e) => e.id);
  const correct = expected.filter((id, i) => placedIds[i] === id).length;
  const perfect = correct === expected.length && placedIds.length === expected.length;
  return {
    correct,
    accuracy: expected.length === 0 ? 0 : correct / expected.length,
    perfect,
    score: correct * 25 + (perfect ? expected.length * 20 : 0),
  };
}
