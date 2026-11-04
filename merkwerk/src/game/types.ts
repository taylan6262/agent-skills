export type ModeId = 'blitzbild' | 'detailblick' | 'zahlenspur' | 'tempo' | 'wissen';
export const MODE_IDS: readonly ModeId[] = [
  'blitzbild',
  'detailblick',
  'zahlenspur',
  'tempo',
  'wissen',
];

export type SkillId = 'gedaechtnis' | 'tempo' | 'lernen' | 'wissen';
export const SKILL_IDS: readonly SkillId[] = ['gedaechtnis', 'tempo', 'lernen', 'wissen'];

export type CategoryId =
  'geografie' | 'natur' | 'wissenschaft' | 'geschichte' | 'sprache' | 'mathe';
export const CATEGORY_IDS: readonly CategoryId[] = [
  'geografie',
  'natur',
  'wissenschaft',
  'geschichte',
  'sprache',
  'mathe',
];

export type Stars = 0 | 1 | 2 | 3;

/** Eine Wissensfrage. Die richtige Antwort steht in den Daten immer an Position 0. */
export interface Question {
  id: string;
  category: CategoryId;
  difficulty: 1 | 2 | 3;
  question: string;
  answers: readonly [string, string, string, string];
  explanation: string;
}

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
}

/** Messwerte einer Runde, aus denen Bestwerte und Erfolge abgeleitet werden. */
export interface GameMetrics {
  /** Größtes Raster (Kantenlänge), das in einer Blitzbild-Runde fehlerfrei gelöst wurde. */
  perfectGrid?: number;
  /** Anzahl fehlerfrei beantworteter Detailblick-Szenen. */
  perfectScenes?: number;
  spanForward?: number;
  spanBackward?: number;
  bestCombo?: number;
  medianRtMs?: number;
  answers?: AnswerRecord[];
}

export interface GameResult {
  mode: ModeId;
  difficulty: number;
  /** Leistung zwischen 0 und 1 – Grundlage für Sterne und adaptive Schwierigkeit. */
  performance: number;
  score: number;
  correct: number;
  total: number;
  durationMs: number;
  metrics: GameMetrics;
}

export const MODE_SKILL: Record<ModeId, SkillId> = {
  blitzbild: 'gedaechtnis',
  detailblick: 'gedaechtnis',
  zahlenspur: 'gedaechtnis',
  tempo: 'tempo',
  wissen: 'wissen',
};

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 20;
