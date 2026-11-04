import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/rng';
import { isDue, isLearnedFromMistake, reviewCard, selectQuestions, summarizeLeitner, type LeitnerCard } from './leitner';
import type { Question } from './types';

const TODAY = '2026-11-04';

function q(id: string, difficulty: 1 | 2 | 3 = 1, category: Question['category'] = 'geografie'): Question {
  return { id, category, difficulty, question: `Frage ${id}?`, answers: ['a', 'b', 'c', 'd'], explanation: 'x' };
}

describe('reviewCard', () => {
  it('legt eine neue, richtig beantwortete Frage in Fach 2, fällig morgen', () => {
    expect(reviewCard(undefined, true, TODAY)).toEqual({ box: 2, due: '2026-11-05', seen: 1, correct: 1, wrong: 0 });
  });

  it('legt eine neue, falsch beantwortete Frage in Fach 1, heute erneut fällig', () => {
    expect(reviewCard(undefined, false, TODAY)).toEqual({ box: 1, due: TODAY, seen: 1, correct: 0, wrong: 1 });
  });

  it('befördert bei richtiger Antwort ein Fach weiter mit wachsendem Abstand', () => {
    const card: LeitnerCard = { box: 3, due: TODAY, seen: 4, correct: 3, wrong: 1 };
    const next = reviewCard(card, true, TODAY);
    expect(next.box).toBe(4);
    expect(next.due).toBe('2026-11-11');
  });

  it('bleibt in Fach 5 mit 14 Tagen Abstand', () => {
    const card: LeitnerCard = { box: 5, due: TODAY, seen: 9, correct: 9, wrong: 0 };
    expect(reviewCard(card, true, TODAY)).toMatchObject({ box: 5, due: '2026-11-18' });
  });

  it('schickt eine Frage bei Fehler aus jedem Fach zurück in Fach 1', () => {
    const card: LeitnerCard = { box: 4, due: TODAY, seen: 5, correct: 4, wrong: 1 };
    expect(reviewCard(card, false, TODAY)).toMatchObject({ box: 1, due: TODAY, wrong: 2 });
  });
});

describe('isDue und isLearnedFromMistake', () => {
  it('ist fällig am Fälligkeitstag und danach', () => {
    const card: LeitnerCard = { box: 2, due: TODAY, seen: 1, correct: 1, wrong: 0 };
    expect(isDue(card, TODAY)).toBe(true);
    expect(isDue(card, '2026-11-03')).toBe(false);
  });

  it('erkennt eine korrigierte frühere Fehlantwort', () => {
    const card: LeitnerCard = { box: 1, due: TODAY, seen: 1, correct: 0, wrong: 1 };
    expect(isLearnedFromMistake(card, true)).toBe(true);
    expect(isLearnedFromMistake(card, false)).toBe(false);
    expect(isLearnedFromMistake(undefined, true)).toBe(false);
  });
});

describe('selectQuestions', () => {
  const pool = Array.from({ length: 20 }, (_, i) => q(`q${i}`, ((i % 3) + 1) as 1 | 2 | 3));

  it('nimmt fällige Wiederholungen zuerst, niedrigstes Fach vorn', () => {
    const cards: Record<string, LeitnerCard> = {
      q0: { box: 3, due: TODAY, seen: 3, correct: 2, wrong: 1 },
      q3: { box: 1, due: TODAY, seen: 1, correct: 0, wrong: 1 },
      q6: { box: 2, due: '2026-12-01', seen: 1, correct: 1, wrong: 0 },
    };
    const chosen = selectQuestions(pool, cards, { count: 5, today: TODAY, rng: createRng(1), reviewShare: 0.4 });
    const ids = chosen.map((c) => c.id);
    expect(ids).toHaveLength(5);
    expect(ids).toContain('q0');
    expect(ids).toContain('q3');
    expect(ids).not.toContain('q6');
  });

  it('füllt mit neuen Fragen im erlaubten Schwierigkeitsbereich auf', () => {
    const chosen = selectQuestions(pool, {}, { count: 5, today: TODAY, rng: createRng(2), minDifficulty: 1, maxDifficulty: 1 });
    expect(chosen.every((c) => c.difficulty === 1)).toBe(true);
    expect(new Set(chosen.map((c) => c.id)).size).toBe(5);
  });

  it('beschränkt sich auf die gewählten Kategorien', () => {
    const mixed = [...pool, q('n1', 1, 'natur'), q('n2', 1, 'natur')];
    const chosen = selectQuestions(mixed, {}, { count: 5, today: TODAY, rng: createRng(3), categories: ['natur'] });
    expect(chosen.map((c) => c.id).sort()).toEqual(['n1', 'n2']);
  });

  it('greift auf nicht fällige Fragen zurück, wenn alles gesehen ist', () => {
    const small = [q('a'), q('b')];
    const cards: Record<string, LeitnerCard> = {
      a: { box: 5, due: '2026-12-30', seen: 5, correct: 5, wrong: 0 },
      b: { box: 4, due: '2026-12-01', seen: 4, correct: 4, wrong: 0 },
    };
    expect(selectQuestions(small, cards, { count: 2, today: TODAY, rng: createRng(4) })).toHaveLength(2);
  });
});

describe('summarizeLeitner', () => {
  it('zählt Fächer, gesehene, sichere und fällige Fragen', () => {
    const pool = [q('a'), q('b'), q('c'), q('d')];
    const cards: Record<string, LeitnerCard> = {
      a: { box: 1, due: TODAY, seen: 1, correct: 0, wrong: 1 },
      b: { box: 4, due: '2026-12-01', seen: 4, correct: 4, wrong: 0 },
      c: { box: 5, due: TODAY, seen: 6, correct: 6, wrong: 0 },
    };
    expect(summarizeLeitner(pool, cards, TODAY)).toEqual({
      boxes: [1, 1, 0, 0, 1, 1],
      seen: 3,
      mastered: 2,
      due: 2,
      total: 4,
    });
  });
});
