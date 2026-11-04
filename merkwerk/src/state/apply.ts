import { toDayKey, type DayKey } from '../lib/date';
import { newlyAchieved, type AchievementFacts } from '../game/achievements';
import { updateAdaptive, type PlayKind } from '../game/adaptive';
import { MASTERED_BOX, isLearnedFromMistake, reviewCard, type LeitnerCard } from '../game/leitner';
import {
  WORLDS,
  getLevel,
  isLevelUnlocked,
  isWorldComplete,
  isWorldUnlocked,
  nextLevel,
  totalStars,
} from '../game/levels';
import { registerActivity } from '../game/progression';
import { levelFromXp, skillIndex, starsFor, xpFor, type XpBreakdown } from '../game/scoring';
import { MODE_IDS, MODE_SKILL, type GameResult, type ModeId, type SkillId, type Stars } from '../game/types';
import type { SaveData } from './schema';

export interface PlayContext {
  kind: PlayKind;
  levelId?: string;
  now: Date;
}

export interface Outcome {
  kind: PlayKind;
  levelId: string | null;
  mode: ModeId;
  difficulty: number;
  performance: number;
  score: number;
  correct: number;
  total: number;
  stars: Stars;
  previousStars: Stars;
  xp: XpBreakdown;
  playerLevelBefore: number;
  playerLevelAfter: number;
  improvements: string[];
  newAchievements: string[];
  adaptiveChange: -1 | 0 | 1;
  dailyCompleted: boolean;
  streak: number;
  nextLevelId: string | null;
  unlockedWorld: number | null;
}

const MAX_STAT_DAYS = 365;

/** Lernstand 0–100: durchschnittlicher Fortschritt der bereits gesehenen Fragen durch die Fächer. */
export function learningIndex(cards: Readonly<Record<string, LeitnerCard>>): number {
  const list = Object.values(cards);
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, card) => acc + (Math.min(Math.max(card.box, 1), 5) - 1) / 4, 0);
  return Math.round((sum / list.length) * 100);
}

export function factsFromSave(save: SaveData): AchievementFacts {
  const progress = Object.values(save.levels);
  return {
    levelsPassed: progress.filter((p) => p.stars > 0).length,
    levelsThreeStars: progress.filter((p) => p.stars === 3).length,
    totalStars: totalStars(save.levels),
    completedWorlds: WORLDS.filter((w) => isWorldComplete(w.id, save.levels)).map((w) => w.id),
    bestStreak: save.streak.best,
    dailyCount: save.daily.completedCount,
    perfectGrid: save.bests.perfectGrid,
    perfectScenes: save.bests.perfectScenes,
    spanForward: save.bests.spanForward,
    spanBackward: save.bests.spanBackward,
    tempoCombo: save.bests.tempoCombo,
    questionsAnswered: save.stats.questionsAnswered,
    mastered: Object.values(save.leitner).filter((c) => c.box >= MASTERED_BOX).length,
    reviewsCorrect: save.stats.reviewsCorrect,
    modesPlayed: MODE_IDS.filter((m) => save.stats.modeCounts[m] > 0).length,
    playerLevel: levelFromXp(save.player.xp).level,
    gamesPlayed: save.player.gamesPlayed,
  };
}

function addDayStat(save: SaveData, today: DayKey, skill: SkillId, value: number): SaveData['stats']['days'] {
  const entry = { ...(save.stats.days[today] ?? {}) };
  const current = entry[skill] ?? { sum: 0, n: 0 };
  entry[skill] = { sum: current.sum + value, n: current.n + 1 };
  const all = { ...save.stats.days, [today]: entry };
  const keep = new Set(Object.keys(all).sort().slice(-MAX_STAT_DAYS));
  return Object.fromEntries(Object.entries(all).filter(([key]) => keep.has(key)));
}

const formatNumber = (n: number): string => n.toLocaleString('de-DE');

/** Verrechnet ein Spielergebnis mit dem Spielstand. Reine Funktion: gibt einen neuen Spielstand zurück. */
export function applyResult(save: SaveData, result: GameResult, ctx: PlayContext): { save: SaveData; outcome: Outcome } {
  const today = toDayKey(ctx.now);
  const stars = starsFor(result.performance);
  const improvements: string[] = [];
  const unlockedWorldsBefore = WORLDS.filter((w) => isWorldUnlocked(w.id, save.levels)).map((w) => w.id);

  // Level-Fortschritt
  let levels = save.levels;
  let previousStars: Stars = 0;
  let newStars = 0;
  const level = ctx.kind === 'level' && ctx.levelId ? getLevel(ctx.levelId) : undefined;
  if (level) {
    const prev = save.levels[level.id];
    previousStars = prev?.stars ?? 0;
    newStars = Math.max(0, stars - previousStars);
    levels = {
      ...save.levels,
      [level.id]: {
        stars: Math.max(stars, previousStars) as Stars,
        bestScore: Math.max(prev?.bestScore ?? 0, result.score),
        bestPerformance: Math.max(prev?.bestPerformance ?? 0, result.performance),
        plays: (prev?.plays ?? 0) + 1,
      },
    };
    if (previousStars === 0 && stars > 0) improvements.push('Level zum ersten Mal bestanden');
    else if (newStars > 0) improvements.push(`+${newStars} ${newStars === 1 ? 'Stern' : 'Sterne'} in diesem Level`);
    if (prev && prev.plays > 0 && result.score > prev.bestScore) {
      improvements.push(`Neue Bestpunktzahl im Level: ${formatNumber(result.score)} (vorher ${formatNumber(prev.bestScore)})`);
    }
  }

  // Tagesaufgabe
  const dailyCompleted = ctx.kind === 'daily' && stars > 0 && save.daily.lastCompletedDay !== today;
  const daily = dailyCompleted
    ? { lastCompletedDay: today, completedCount: save.daily.completedCount + 1 }
    : save.daily;

  // XP und Spielerlevel
  const xp = xpFor({ stars, difficulty: result.difficulty, newStars, dailyCompleted });
  const playerLevelBefore = levelFromXp(save.player.xp).level;
  const player = {
    xp: save.player.xp + xp.total,
    gamesPlayed: save.player.gamesPlayed + 1,
    playTimeMs: save.player.playTimeMs + Math.max(0, Math.round(result.durationMs)),
  };
  const playerLevelAfter = levelFromXp(player.xp).level;
  if (playerLevelAfter > playerLevelBefore) improvements.push(`Spielerlevel ${playerLevelAfter} erreicht`);

  // Serie
  const streak = registerActivity(save.streak, today);
  if (streak.current > save.streak.current && streak.current > 1) {
    improvements.push(`Serie verlängert: ${streak.current} Tage in Folge`);
  }

  // Adaptive Schwierigkeit
  const adaptiveUpdate = updateAdaptive(save.adaptive[result.mode], result.performance, ctx.kind);
  const adaptive = { ...save.adaptive, [result.mode]: adaptiveUpdate.state };

  // Wissensfragen im Leitner-System
  let leitner = save.leitner;
  let reviewsCorrect = save.stats.reviewsCorrect;
  let questionsAnswered = save.stats.questionsAnswered;
  let questionsCorrect = save.stats.questionsCorrect;
  let learned = 0;
  let masteredNow = 0;
  if (result.metrics.answers && result.metrics.answers.length > 0) {
    leitner = { ...save.leitner };
    for (const answer of result.metrics.answers) {
      const before = leitner[answer.questionId];
      if (isLearnedFromMistake(before, answer.correct)) learned += 1;
      const after = reviewCard(before, answer.correct, today);
      if (after.box >= MASTERED_BOX && (before?.box ?? 0) < MASTERED_BOX) masteredNow += 1;
      leitner[answer.questionId] = after;
      questionsAnswered += 1;
      if (answer.correct) questionsCorrect += 1;
    }
    reviewsCorrect += learned;
    if (learned > 0) {
      improvements.push(
        learned === 1
          ? '1 früher falsch beantwortete Frage jetzt richtig'
          : `${learned} früher falsch beantwortete Fragen jetzt richtig`,
      );
    }
    if (masteredNow > 0) {
      improvements.push(`${masteredNow} ${masteredNow === 1 ? 'Frage' : 'Fragen'} jetzt sicher gelernt (Fach ${MASTERED_BOX}+)`);
    }
  }

  // Bestwerte
  const b = { ...save.bests };
  const m = result.metrics;
  if (m.perfectGrid !== undefined && m.perfectGrid > b.perfectGrid) {
    if (b.perfectGrid > 0) improvements.push(`Neuer Rekord: ${m.perfectGrid}×${m.perfectGrid}-Raster fehlerfrei`);
    b.perfectGrid = m.perfectGrid;
  }
  if (m.perfectScenes) b.perfectScenes += m.perfectScenes;
  if (m.spanForward !== undefined && m.spanForward > b.spanForward) {
    if (b.spanForward > 0) improvements.push(`Neuer Rekord: ${m.spanForward} Ziffern vorwärts (vorher ${b.spanForward})`);
    b.spanForward = m.spanForward;
  }
  if (m.spanBackward !== undefined && m.spanBackward > b.spanBackward) {
    if (b.spanBackward > 0) improvements.push(`Neuer Rekord: ${m.spanBackward} Ziffern rückwärts (vorher ${b.spanBackward})`);
    b.spanBackward = m.spanBackward;
  }
  if (result.mode === 'tempo') {
    if (m.bestCombo !== undefined && m.bestCombo > b.tempoCombo) {
      if (b.tempoCombo > 0) improvements.push(`Beste Combo: ${m.bestCombo} (vorher ${b.tempoCombo})`);
      b.tempoCombo = m.bestCombo;
    }
    if (result.score > b.tempoScore) {
      if (b.tempoScore > 0) improvements.push(`Tempo-Rekord: ${formatNumber(result.score)} Punkte`);
      b.tempoScore = result.score;
    }
    if (m.medianRtMs !== undefined && result.correct >= 8 && (b.tempoRtMs === null || m.medianRtMs < b.tempoRtMs)) {
      if (b.tempoRtMs !== null) {
        improvements.push(`Reaktionszeit ${Math.round(m.medianRtMs)} ms – ${Math.round(b.tempoRtMs - m.medianRtMs)} ms schneller als bisher`);
      }
      b.tempoRtMs = Math.round(m.medianRtMs);
    }
  }

  // Statistik pro Fähigkeit
  let days = addDayStat(save, today, MODE_SKILL[result.mode], skillIndex(result.difficulty, result.performance));
  if (result.mode === 'wissen') {
    days = addDayStat({ ...save, stats: { ...save.stats, days } }, today, 'lernen', learningIndex(leitner));
  }

  const modeCounts = { ...save.stats.modeCounts, [result.mode]: save.stats.modeCounts[result.mode] + 1 };

  let next: SaveData = {
    ...save,
    levels,
    daily,
    player,
    streak,
    adaptive,
    leitner,
    bests: b,
    stats: { days, modeCounts, questionsAnswered, questionsCorrect, reviewsCorrect },
  };

  // Freigeschaltete Welt
  const unlockedWorld =
    WORLDS.find((w) => !unlockedWorldsBefore.includes(w.id) && isWorldUnlocked(w.id, next.levels))?.id ?? null;
  if (unlockedWorld !== null) {
    const name = WORLDS.find((w) => w.id === unlockedWorld)?.name ?? '';
    improvements.push(`Welt „${name}“ freigeschaltet`);
  }

  // Erfolge
  const newAchievements = newlyAchieved(factsFromSave(next), next.achievements);
  if (newAchievements.length > 0) {
    next = {
      ...next,
      achievements: { ...next.achievements, ...Object.fromEntries(newAchievements.map((id) => [id, today])) },
    };
  }

  const following = level ? nextLevel(level.id) : undefined;
  const nextLevelId = following && isLevelUnlocked(following.id, next.levels) ? following.id : null;

  return {
    save: next,
    outcome: {
      kind: ctx.kind,
      levelId: level?.id ?? null,
      mode: result.mode,
      difficulty: result.difficulty,
      performance: result.performance,
      score: result.score,
      correct: result.correct,
      total: result.total,
      stars,
      previousStars,
      xp,
      playerLevelBefore,
      playerLevelAfter,
      improvements,
      newAchievements,
      adaptiveChange: adaptiveUpdate.change,
      dailyCompleted,
      streak: streak.current,
      nextLevelId,
      unlockedWorld,
    },
  };
}

