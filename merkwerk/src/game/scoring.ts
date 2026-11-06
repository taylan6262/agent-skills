import { clamp, clamp01 } from '../lib/math';
import { MAX_DIFFICULTY, MIN_DIFFICULTY, type Stars } from './types';

/** Mindestleistung für 1, 2 und 3 Sterne. */
export const STAR_THRESHOLDS = [0.5, 0.75, 0.9] as const;

export function starsFor(performance: number): Stars {
  const p = clamp01(Number.isFinite(performance) ? performance : 0);
  if (p >= STAR_THRESHOLDS[2]) return 3;
  if (p >= STAR_THRESHOLDS[1]) return 2;
  if (p >= STAR_THRESHOLDS[0]) return 1;
  return 0;
}

export interface XpInput {
  stars: Stars;
  difficulty: number;
  /** Zusätzlich gewonnene Sterne gegenüber dem bisherigen Bestwert des Levels. */
  newStars: number;
  dailyCompleted: boolean;
}

export interface XpBreakdown {
  base: number;
  stars: number;
  difficulty: number;
  firstClear: number;
  daily: number;
  total: number;
}

export function xpFor(input: XpInput): XpBreakdown {
  const base = 10;
  const stars = input.stars * 15;
  const difficulty = Math.round(clamp(input.difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY) * 2);
  const firstClear = Math.max(0, input.newStars) * 10;
  const daily = input.dailyCompleted ? 50 + input.stars * 25 : 0;
  return {
    base,
    stars,
    difficulty,
    firstClear,
    daily,
    total: base + stars + difficulty + firstClear + daily,
  };
}

/** XP, die man von Spielerlevel `level` zu `level + 1` braucht. */
export function xpForNextLevel(level: number): number {
  return 100 + 40 * (Math.max(1, level) - 1);
}

export interface PlayerLevel {
  level: number;
  /** XP im aktuellen Level. */
  current: number;
  /** XP bis zum nächsten Level (Gesamtbedarf des aktuellen Levels). */
  needed: number;
}

export function levelFromXp(totalXp: number): PlayerLevel {
  let xp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  let level = 1;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }
  return { level, current: xp, needed: xpForNextLevel(level) };
}

/**
 * Leistungsindex 0–100 für die Statistik. Er berücksichtigt die Stufe, damit Fortschritt
 * sichtbar wird: dieselbe Trefferquote auf höherer Stufe ergibt einen höheren Wert.
 */
export function skillIndex(difficulty: number, performance: number): number {
  const d = clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
  const value = ((d - 1 + 2 * clamp01(performance)) / (MAX_DIFFICULTY + 1)) * 100;
  return Math.round(clamp(value, 0, 100));
}
