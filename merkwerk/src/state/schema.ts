import { isDayKey, type DayKey } from '../lib/date';
import { clamp } from '../lib/math';
import { defaultAdaptive, ADAPTIVE_RULES, type AdaptiveState } from '../game/adaptive';
import { LEITNER_BOXES, type LeitnerCard } from '../game/leitner';
import { getLevel } from '../game/levels';
import { MAX_DIFFICULTY, MIN_DIFFICULTY, MODE_IDS, SKILL_IDS, type ModeId, type SkillId, type Stars } from '../game/types';

/** Aktuelle Version des Spielstands. Bei Schemaänderungen erhöhen und Migration ergänzen. */
export const SAVE_VERSION = 2;

export interface Settings {
  sound: boolean;
  haptics: boolean;
  /** Zusätzlich zur Systemeinstellung „Bewegung reduzieren“. */
  reduceMotion: boolean;
  /** Farben zusätzlich mit Mustern kennzeichnen (Farbsehschwäche). */
  colorPatterns: boolean;
}

export interface LevelProgress {
  stars: Stars;
  bestScore: number;
  bestPerformance: number;
  plays: number;
}

export interface DayStat {
  sum: number;
  n: number;
}

export interface Bests {
  perfectGrid: number;
  perfectScenes: number;
  spanForward: number;
  spanBackward: number;
  tempoCombo: number;
  tempoScore: number;
  tempoRtMs: number | null;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  createdAt: string;
  onboardingDone: boolean;
  placementSpan: number | null;
  settings: Settings;
  player: { xp: number; gamesPlayed: number; playTimeMs: number };
  levels: Record<string, LevelProgress>;
  adaptive: Record<ModeId, AdaptiveState>;
  streak: { current: number; best: number; lastActiveDay: DayKey | null };
  daily: { lastCompletedDay: DayKey | null; completedCount: number };
  leitner: Record<string, LeitnerCard>;
  stats: {
    days: Record<DayKey, Partial<Record<SkillId, DayStat>>>;
    modeCounts: Record<ModeId, number>;
    questionsAnswered: number;
    questionsCorrect: number;
    reviewsCorrect: number;
  };
  bests: Bests;
  /** Erfolg-ID → Tag der Freischaltung. */
  achievements: Record<string, DayKey>;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  reduceMotion: false,
  colorPatterns: false,
};

export const DEFAULT_BESTS: Bests = {
  perfectGrid: 0,
  perfectScenes: 0,
  spanForward: 0,
  spanBackward: 0,
  tempoCombo: 0,
  tempoScore: 0,
  tempoRtMs: null,
};

function modeRecord<T>(make: () => T): Record<ModeId, T> {
  return Object.fromEntries(MODE_IDS.map((mode) => [mode, make()])) as Record<ModeId, T>;
}

export function createDefaultSave(now: Date): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: now.toISOString(),
    onboardingDone: false,
    placementSpan: null,
    settings: { ...DEFAULT_SETTINGS },
    player: { xp: 0, gamesPlayed: 0, playTimeMs: 0 },
    levels: {},
    adaptive: modeRecord(() => defaultAdaptive()),
    streak: { current: 0, best: 0, lastActiveDay: null },
    daily: { lastCompletedDay: null, completedCount: 0 },
    leitner: {},
    stats: {
      days: {},
      modeCounts: modeRecord(() => 0),
      questionsAnswered: 0,
      questionsCorrect: 0,
      reviewsCorrect: 0,
    },
    bests: { ...DEFAULT_BESTS },
    achievements: {},
  };
}

// ---------- Defensive Prüfung: jedes Feld einzeln, nie eine Ausnahme ----------

type Obj = Record<string, unknown>;

export function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function int(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return Math.round(num(value, fallback, min, max));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function day(value: unknown): DayKey | null {
  return isDayKey(value) ? value : null;
}

function obj(value: unknown): Obj {
  return isObj(value) ? value : {};
}

function sanitizeAdaptive(value: unknown): AdaptiveState {
  const v = obj(value);
  return {
    offset: int(v.offset, 0, ADAPTIVE_RULES.offsetMin, ADAPTIVE_RULES.offsetMax),
    rating: int(v.rating, 1, MIN_DIFFICULTY, MAX_DIFFICULTY),
    winStreak: int(v.winStreak, 0, 0, 10),
    failStreak: int(v.failStreak, 0, 0, 10),
  };
}

function sanitizeLevels(value: unknown): Record<string, LevelProgress> {
  const result: Record<string, LevelProgress> = {};
  for (const [id, entry] of Object.entries(obj(value))) {
    if (!getLevel(id) || !isObj(entry)) continue;
    result[id] = {
      stars: int(entry.stars, 0, 0, 3) as Stars,
      bestScore: int(entry.bestScore, 0),
      bestPerformance: num(entry.bestPerformance, 0, 0, 1),
      plays: int(entry.plays, 0),
    };
  }
  return result;
}

function sanitizeLeitner(value: unknown): Record<string, LeitnerCard> {
  const result: Record<string, LeitnerCard> = {};
  for (const [id, entry] of Object.entries(obj(value))) {
    if (!isObj(entry) || typeof id !== 'string' || id.length > 40) continue;
    const due = day(entry.due);
    if (!due) continue;
    result[id] = {
      box: int(entry.box, 1, 1, LEITNER_BOXES),
      due,
      seen: int(entry.seen, 0),
      correct: int(entry.correct, 0),
      wrong: int(entry.wrong, 0),
    };
  }
  return result;
}

function sanitizeDays(value: unknown): Record<DayKey, Partial<Record<SkillId, DayStat>>> {
  const result: Record<DayKey, Partial<Record<SkillId, DayStat>>> = {};
  for (const [key, entry] of Object.entries(obj(value))) {
    if (!isDayKey(key) || !isObj(entry)) continue;
    const dayStats: Partial<Record<SkillId, DayStat>> = {};
    for (const skill of SKILL_IDS) {
      const stat = entry[skill];
      if (!isObj(stat)) continue;
      const n = int(stat.n, 0);
      if (n <= 0) continue;
      dayStats[skill] = { n, sum: num(stat.sum, 0, 0, 100 * n) };
    }
    result[key] = dayStats;
  }
  return result;
}

/** Baut aus beliebigen (auch kaputten) Daten einen gültigen Spielstand. Wirft nie. */
export function sanitizeSave(input: unknown, now: Date): SaveData {
  const base = createDefaultSave(now);
  const v = obj(input);
  const settings = obj(v.settings);
  const player = obj(v.player);
  const streak = obj(v.streak);
  const daily = obj(v.daily);
  const stats = obj(v.stats);
  const modeCounts = obj(stats.modeCounts);
  const bests = obj(v.bests);
  const adaptive = obj(v.adaptive);
  const achievements: Record<string, DayKey> = {};
  for (const [id, unlocked] of Object.entries(obj(v.achievements))) {
    const d = day(unlocked);
    if (d && id.length <= 40) achievements[id] = d;
  }
  const createdAt = typeof v.createdAt === 'string' && !Number.isNaN(Date.parse(v.createdAt)) ? v.createdAt : base.createdAt;
  const placement = v.placementSpan;

  return {
    version: SAVE_VERSION,
    createdAt,
    onboardingDone: bool(v.onboardingDone, false),
    placementSpan: typeof placement === 'number' && Number.isFinite(placement) ? int(placement, 0, 0, 20) : null,
    settings: {
      sound: bool(settings.sound, DEFAULT_SETTINGS.sound),
      haptics: bool(settings.haptics, DEFAULT_SETTINGS.haptics),
      reduceMotion: bool(settings.reduceMotion, DEFAULT_SETTINGS.reduceMotion),
      colorPatterns: bool(settings.colorPatterns, DEFAULT_SETTINGS.colorPatterns),
    },
    player: {
      xp: int(player.xp, 0),
      gamesPlayed: int(player.gamesPlayed, 0),
      playTimeMs: int(player.playTimeMs, 0),
    },
    levels: sanitizeLevels(v.levels),
    adaptive: Object.fromEntries(MODE_IDS.map((mode) => [mode, sanitizeAdaptive(adaptive[mode])])) as Record<
      ModeId,
      AdaptiveState
    >,
    streak: {
      current: int(streak.current, 0),
      best: Math.max(int(streak.best, 0), int(streak.current, 0)),
      lastActiveDay: day(streak.lastActiveDay),
    },
    daily: {
      lastCompletedDay: day(daily.lastCompletedDay),
      completedCount: int(daily.completedCount, 0),
    },
    leitner: sanitizeLeitner(v.leitner),
    stats: {
      days: sanitizeDays(stats.days),
      modeCounts: Object.fromEntries(MODE_IDS.map((mode) => [mode, int(modeCounts[mode], 0)])) as Record<ModeId, number>,
      questionsAnswered: int(stats.questionsAnswered, 0),
      questionsCorrect: int(stats.questionsCorrect, 0),
      reviewsCorrect: int(stats.reviewsCorrect, 0),
    },
    bests: {
      perfectGrid: int(bests.perfectGrid, 0, 0, 6),
      perfectScenes: int(bests.perfectScenes, 0),
      spanForward: int(bests.spanForward, 0, 0, 20),
      spanBackward: int(bests.spanBackward, 0, 0, 20),
      tempoCombo: int(bests.tempoCombo, 0),
      tempoScore: int(bests.tempoScore, 0),
      tempoRtMs: typeof bests.tempoRtMs === 'number' && Number.isFinite(bests.tempoRtMs) && bests.tempoRtMs > 0 ? Math.round(bests.tempoRtMs) : null,
    },
    achievements,
  };
}
