import type { CategoryId, Question } from '../../game/types';

/**
 * Hilfsfunktion für Fragendateien. Die richtige Antwort steht immer an erster Stelle –
 * die Reihenfolge wird im Spiel gemischt. IDs dürfen sich nie ändern (Lernstand hängt daran).
 */
export function make(category: CategoryId, prefix: string) {
  return (
    num: number,
    difficulty: 1 | 2 | 3,
    question: string,
    answers: readonly [string, string, string, string],
    explanation: string,
  ): Question => ({
    id: `${prefix}-${String(num).padStart(3, '0')}`,
    category,
    difficulty,
    question,
    answers,
    explanation,
  });
}
