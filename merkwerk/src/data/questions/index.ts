import type { CategoryId, Question } from '../../game/types';
import { GEOGRAFIE } from './geografie';
import { GESCHICHTE } from './geschichte';
import { KULTUR } from './kultur';
import { MATHE } from './mathe';
import { NATUR } from './natur';
import { SPRACHE } from './sprache';
import { TECHNIK } from './technik';
import { WISSENSCHAFT } from './wissenschaft';

/**
 * Alle Wissensfragen. Neue Fragen kommen in die Datei ihrer Kategorie –
 * mit fortlaufender, nie wiederverwendeter Nummer. Die richtige Antwort steht an erster Stelle.
 */
export const QUESTIONS: readonly Question[] = [
  ...GEOGRAFIE,
  ...NATUR,
  ...WISSENSCHAFT,
  ...GESCHICHTE,
  ...SPRACHE,
  ...MATHE,
  ...KULTUR,
  ...TECHNIK,
];

export function questionsByCategory(category: CategoryId): Question[] {
  return QUESTIONS.filter((q) => q.category === category);
}
