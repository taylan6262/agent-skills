import { clamp } from '../../lib/math';
import type { DayKey } from '../../lib/date';
import type { Rng } from '../../lib/rng';
import { selectQuestions, type LeitnerCard } from '../leitner';
import type { CategoryId, Question } from '../types';

export interface WissenParams {
  count: number;
  timeLimitMs: number | null;
  minDifficulty: 1 | 2 | 3;
  maxDifficulty: 1 | 2 | 3;
}

export function wissenParams(difficulty: number): WissenParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  const range: [1 | 2 | 3, 1 | 2 | 3] =
    d <= 4 ? [1, 1] : d <= 8 ? [1, 2] : d <= 13 ? [1, 3] : [2, 3];
  return {
    count: d <= 3 ? 5 : d <= 10 ? 7 : 8,
    timeLimitMs: d < 6 ? null : Math.max(10_000, 25_000 - d * 700),
    minDifficulty: range[0],
    maxDifficulty: range[1],
  };
}

export interface RoundQuestion {
  question: Question;
  /** Anzeige-Reihenfolge der Antworten als Indizes in `question.answers`. */
  order: number[];
}

export interface WissenRoundOptions {
  today: DayKey;
  categories?: readonly CategoryId[];
  /** Nur fällige Wiederholungen (Training „Wiederholen“). */
  reviewOnly?: boolean;
}

export function prepareRound(
  pool: readonly Question[],
  cards: Readonly<Record<string, LeitnerCard>>,
  params: WissenParams,
  rng: Rng,
  options: WissenRoundOptions,
): RoundQuestion[] {
  const questions = selectQuestions(pool, cards, {
    count: params.count,
    today: options.today,
    rng,
    minDifficulty: params.minDifficulty,
    maxDifficulty: params.maxDifficulty,
    reviewShare: options.reviewOnly ? 1 : 0.4,
    ...(options.categories ? { categories: options.categories } : {}),
  });
  return questions.map((question) => ({ question, order: rng.shuffle([0, 1, 2, 3]) }));
}

export function pointsForAnswer(correct: boolean, remainingMs: number | null, limitMs: number | null): number {
  if (!correct) return 0;
  if (remainingMs === null || limitMs === null || limitMs <= 0) return 100;
  return 100 + Math.round(50 * clamp(remainingMs / limitMs, 0, 1));
}
