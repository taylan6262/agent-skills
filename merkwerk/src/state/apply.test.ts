import { describe, expect, it } from 'vitest';
import type { GameResult } from '../game/types';
import { applyResult, learningIndex } from './apply';
import { createDefaultSave, type SaveData } from './schema';

const NOW = new Date('2026-11-04T10:00:00');

function result(partial: Partial<GameResult> = {}): GameResult {
  return {
    mode: 'blitzbild',
    difficulty: 1,
    performance: 0.8,
    score: 200,
    correct: 8,
    total: 10,
    durationMs: 30_000,
    metrics: {},
    ...partial,
  };
}

function fresh(): SaveData {
  return { ...createDefaultSave(NOW), onboardingDone: true };
}

describe('applyResult – Level', () => {
  it('vergibt Sterne, XP und öffnet das nächste Level', () => {
    const { save, outcome } = applyResult(fresh(), result({ performance: 0.8 }), { kind: 'level', levelId: 'w1-1', now: NOW });
    expect(outcome.stars).toBe(2);
    expect(save.levels['w1-1']).toEqual({ stars: 2, bestScore: 200, bestPerformance: 0.8, plays: 1 });
    expect(outcome.xp.total).toBe(10 + 30 + 2 + 20);
    expect(save.player.xp).toBe(outcome.xp.total);
    expect(outcome.nextLevelId).toBe('w1-2');
    expect(outcome.improvements).toContain('Level zum ersten Mal bestanden');
  });

  it('behält bei einem schlechteren Versuch die besseren Sterne', () => {
    const first = applyResult(fresh(), result({ performance: 0.95, score: 500 }), { kind: 'level', levelId: 'w1-1', now: NOW });
    const second = applyResult(first.save, result({ performance: 0.55, score: 100 }), { kind: 'level', levelId: 'w1-1', now: NOW });
    expect(second.outcome.stars).toBe(1);
    expect(second.outcome.previousStars).toBe(3);
    expect(second.save.levels['w1-1']).toMatchObject({ stars: 3, bestScore: 500, plays: 2 });
    expect(second.outcome.xp.firstClear).toBe(0);
  });

  it('öffnet bei 0 Sternen kein neues Level', () => {
    const { save, outcome } = applyResult(fresh(), result({ performance: 0.3 }), { kind: 'level', levelId: 'w1-1', now: NOW });
    expect(outcome.stars).toBe(0);
    expect(outcome.nextLevelId).toBeNull();
    expect(save.levels['w1-1']?.stars).toBe(0);
  });

  it('zählt die Serie und schaltet „Erster Schritt“ frei', () => {
    const { save, outcome } = applyResult(fresh(), result(), { kind: 'level', levelId: 'w1-1', now: NOW });
    expect(save.streak).toEqual({ current: 1, best: 1, lastActiveDay: '2026-11-04' });
    expect(outcome.newAchievements).toContain('erster-schritt');
    expect(save.achievements['erster-schritt']).toBe('2026-11-04');
  });

  it('schaltet einen bereits erreichten Erfolg nicht doppelt frei', () => {
    const first = applyResult(fresh(), result(), { kind: 'level', levelId: 'w1-1', now: NOW });
    const second = applyResult(first.save, result(), { kind: 'level', levelId: 'w1-1', now: NOW });
    expect(second.outcome.newAchievements).not.toContain('erster-schritt');
  });

  it('meldet eine neu freigeschaltete Welt', () => {
    const save = fresh();
    for (let i = 1; i <= 6; i++) save.levels[`w1-${i}`] = { stars: 3, bestScore: 0, bestPerformance: 1, plays: 1 };
    save.levels['w1-7'] = { stars: 1, bestScore: 0, bestPerformance: 0.5, plays: 1 };
    const { outcome } = applyResult(save, result({ performance: 0.8 }), { kind: 'level', levelId: 'w1-8', now: NOW });
    expect(outcome.unlockedWorld).toBe(2);
    expect(outcome.improvements).toContain('Welt „Linie“ freigeschaltet');
  });
});

describe('applyResult – Tagesaufgabe, Training, Adaptiv', () => {
  it('schließt die Tagesaufgabe nur einmal pro Tag ab', () => {
    const first = applyResult(fresh(), result(), { kind: 'daily', now: NOW });
    expect(first.outcome.dailyCompleted).toBe(true);
    expect(first.save.daily).toEqual({ lastCompletedDay: '2026-11-04', completedCount: 1 });
    const second = applyResult(first.save, result(), { kind: 'daily', now: NOW });
    expect(second.outcome.dailyCompleted).toBe(false);
    expect(second.save.daily.completedCount).toBe(1);
  });

  it('passt die Trainingsstufe nach zwei sehr guten Runden an', () => {
    const a = applyResult(fresh(), result({ mode: 'tempo', performance: 0.95 }), { kind: 'training', now: NOW });
    const b = applyResult(a.save, result({ mode: 'tempo', performance: 0.95 }), { kind: 'training', now: NOW });
    expect(b.outcome.adaptiveChange).toBe(1);
    expect(b.save.adaptive.tempo.rating).toBe(2);
    expect(b.save.adaptive.tempo.offset).toBe(0);
  });

  it('erfasst Bestwerte und meldet Verbesserungen', () => {
    const save = fresh();
    save.bests.spanForward = 5;
    const { save: next, outcome } = applyResult(
      save,
      result({ mode: 'zahlenspur', metrics: { spanForward: 7, spanBackward: 4 } }),
      { kind: 'training', now: NOW },
    );
    expect(next.bests.spanForward).toBe(7);
    expect(next.bests.spanBackward).toBe(4);
    expect(outcome.improvements).toContain('Neuer Rekord: 7 Ziffern vorwärts (vorher 5)');
    expect(outcome.newAchievements).toContain('zahlenmensch');
  });

  it('schreibt den Leistungsindex in die Tagesstatistik', () => {
    const { save } = applyResult(fresh(), result({ mode: 'tempo', difficulty: 10, performance: 1 }), { kind: 'training', now: NOW });
    expect(save.stats.days['2026-11-04']?.tempo).toEqual({ sum: 52, n: 1 });
  });
});

describe('applyResult – Wissen und Leitner', () => {
  it('verbucht Antworten im Leitner-System und zählt korrigierte Fehler', () => {
    const save = fresh();
    save.leitner['geo-001'] = { box: 1, due: '2026-11-04', seen: 1, correct: 0, wrong: 1 };
    const { save: next, outcome } = applyResult(
      save,
      result({
        mode: 'wissen',
        metrics: {
          answers: [
            { questionId: 'geo-001', correct: true },
            { questionId: 'geo-002', correct: false },
          ],
        },
      }),
      { kind: 'training', now: NOW },
    );
    expect(next.leitner['geo-001']).toMatchObject({ box: 2, due: '2026-11-05' });
    expect(next.leitner['geo-002']).toMatchObject({ box: 1, due: '2026-11-04' });
    expect(next.stats.questionsAnswered).toBe(2);
    expect(next.stats.questionsCorrect).toBe(1);
    expect(next.stats.reviewsCorrect).toBe(1);
    expect(outcome.improvements).toContain('1 früher falsch beantwortete Frage jetzt richtig');
    expect(next.stats.days['2026-11-04']?.lernen).toBeDefined();
  });

  it('berechnet den Lernstand aus den Fächern', () => {
    expect(learningIndex({})).toBe(0);
    expect(
      learningIndex({
        a: { box: 1, due: '2026-11-04', seen: 1, correct: 0, wrong: 1 },
        b: { box: 5, due: '2026-11-04', seen: 5, correct: 5, wrong: 0 },
      }),
    ).toBe(50);
  });

  it('verändert den ursprünglichen Spielstand nicht', () => {
    const save = fresh();
    const snapshot = JSON.stringify(save);
    applyResult(save, result({ mode: 'wissen', metrics: { answers: [{ questionId: 'x', correct: true }] } }), {
      kind: 'level',
      levelId: 'w1-4',
      now: NOW,
    });
    expect(JSON.stringify(save)).toBe(snapshot);
  });
});
