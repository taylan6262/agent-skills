import { addDays, type DayKey } from '../lib/date';
import type { Rng } from '../lib/rng';
import type { CategoryId, Question } from './types';

/**
 * Leitner-System mit fünf Fächern.
 * Neue Fragen gelten als Fach 1. Richtig → ein Fach weiter, falsch → zurück in Fach 1.
 * Fach 1 ist in jeder Sitzung wieder fällig, danach wachsen die Abstände.
 */
export const LEITNER_BOXES = 5;
/** Wiederholungsabstand in Tagen, Index = Fach (0 ungenutzt). */
export const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 14] as const;
/** Ab diesem Fach gilt eine Frage als „sicher gelernt“. */
export const MASTERED_BOX = 4;

export interface LeitnerCard {
  box: number;
  due: DayKey;
  seen: number;
  correct: number;
  wrong: number;
}

export function intervalForBox(box: number): number {
  return BOX_INTERVAL_DAYS[Math.min(Math.max(box, 1), LEITNER_BOXES)] ?? 0;
}

export function reviewCard(
  card: LeitnerCard | undefined,
  correct: boolean,
  today: DayKey,
): LeitnerCard {
  const currentBox = card ? Math.max(1, card.box) : 1;
  const box = correct ? Math.min(LEITNER_BOXES, currentBox + 1) : 1;
  return {
    box,
    due: addDays(today, intervalForBox(box)),
    seen: (card?.seen ?? 0) + 1,
    correct: (card?.correct ?? 0) + (correct ? 1 : 0),
    wrong: (card?.wrong ?? 0) + (correct ? 0 : 1),
  };
}

export function isDue(card: LeitnerCard, today: DayKey): boolean {
  return card.due <= today;
}

/** Ob eine richtige Antwort eine echte Wiederholung war (Frage war zuvor falsch beantwortet). */
export function isLearnedFromMistake(card: LeitnerCard | undefined, correct: boolean): boolean {
  return correct && card !== undefined && card.box === 1 && card.wrong > 0;
}

export interface SelectOptions {
  count: number;
  today: DayKey;
  rng: Rng;
  categories?: readonly CategoryId[];
  minDifficulty?: number;
  maxDifficulty?: number;
  /** Anteil fälliger Wiederholungen in der Runde (0–1). */
  reviewShare?: number;
}

function byUrgency(cards: Readonly<Record<string, LeitnerCard>>) {
  return (a: Question, b: Question): number => {
    const ca = cards[a.id];
    const cb = cards[b.id];
    if (!ca || !cb) return 0;
    if (ca.box !== cb.box) return ca.box - cb.box;
    return ca.due < cb.due ? -1 : ca.due > cb.due ? 1 : 0;
  };
}

/**
 * Stellt eine Runde zusammen: zuerst fällige Wiederholungen (niedrigstes Fach zuerst),
 * dann neue Fragen im passenden Schwierigkeitsbereich, zuletzt nicht fällige Fragen.
 */
export function selectQuestions(
  pool: readonly Question[],
  cards: Readonly<Record<string, LeitnerCard>>,
  options: SelectOptions,
): Question[] {
  const { count, today, rng } = options;
  const minD = options.minDifficulty ?? 1;
  const maxD = options.maxDifficulty ?? 3;
  const reviewShare = options.reviewShare ?? 0.4;
  const categories = options.categories;
  const inCategory = (q: Question): boolean => !categories || categories.includes(q.category);
  const candidates = pool.filter(inCategory);

  const chosen: Question[] = [];
  const taken = new Set<string>();
  const take = (list: readonly Question[], limit: number): void => {
    for (const q of list) {
      if (chosen.length >= limit) break;
      if (taken.has(q.id)) continue;
      taken.add(q.id);
      chosen.push(q);
    }
  };

  const due = rng
    .shuffle(
      candidates.filter(
        (q) => cards[q.id] !== undefined && isDue(cards[q.id] as LeitnerCard, today),
      ),
    )
    .sort(byUrgency(cards));
  take(due, Math.min(count, Math.ceil(count * reviewShare)));

  const fresh = candidates.filter((q) => cards[q.id] === undefined);
  const freshInRange = rng.shuffle(
    fresh.filter((q) => q.difficulty >= minD && q.difficulty <= maxD),
  );
  take(freshInRange, count);

  // Falls nicht genug neue Fragen da sind: weitere fällige, dann bald fällige Fragen.
  take(due, count);
  const notDue = rng
    .shuffle(
      candidates.filter(
        (q) => cards[q.id] !== undefined && !isDue(cards[q.id] as LeitnerCard, today),
      ),
    )
    .sort((a, b) => {
      const da = cards[a.id]?.due ?? '';
      const db = cards[b.id]?.due ?? '';
      return da < db ? -1 : da > db ? 1 : 0;
    });
  take(notDue, count);
  take(rng.shuffle(fresh), count);

  return rng.shuffle(chosen);
}

export interface LeitnerSummary {
  /** Index 0 = noch nie gesehen, 1–5 = Fach. */
  boxes: number[];
  seen: number;
  mastered: number;
  due: number;
  total: number;
}

export function summarizeLeitner(
  pool: readonly Question[],
  cards: Readonly<Record<string, LeitnerCard>>,
  today: DayKey,
): LeitnerSummary {
  const boxes = new Array<number>(LEITNER_BOXES + 1).fill(0);
  let mastered = 0;
  let due = 0;
  for (const q of pool) {
    const card = cards[q.id];
    const box = card ? Math.min(Math.max(card.box, 1), LEITNER_BOXES) : 0;
    boxes[box] = (boxes[box] ?? 0) + 1;
    if (card && card.box >= MASTERED_BOX) mastered += 1;
    if (card && isDue(card, today)) due += 1;
  }
  return { boxes, seen: pool.length - (boxes[0] ?? 0), mastered, due, total: pool.length };
}
