import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import { SHAPES, COLOR_NAMES } from '../symbols';
import { blitzbildParams, evaluateRound, generateRound, trayFor, type Board } from './blitzbild';
import { CORNER_LABEL, detailblickParams, generateQuestions, generateScene, type Corner, type Scene } from './detailblick';
import { evaluateTrial, generateSequence, nextLength, zahlenspurParams } from './zahlenspur';
import { comboMultiplier, createTrialStream, pointsForAnswer, tempoParams, tempoPerformance } from './tempo';
import { pointsForAnswer as wissenPoints, prepareRound, wissenParams } from './wissen';
import type { Question } from '../types';

describe('Blitzbild', () => {
  it('wächst von 3×3 auf 6×6 und verkürzt die Anzeigezeit', () => {
    expect(blitzbildParams(1)).toMatchObject({ size: 3, count: 3, variant: 'positionen' });
    expect(blitzbildParams(20)).toMatchObject({ size: 6, count: 10, variant: 'formen' });
    expect(blitzbildParams(20).showMs).toBeLessThan(blitzbildParams(1).showMs);
  });

  it('erzeugt genau so viele Formen wie verlangt, alle gewählten Formarten mindestens einmal', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const params = blitzbildParams(12);
      const round = generateRound(params, createRng(seed));
      expect(round.board).toHaveLength(params.size * params.size);
      expect(round.board.filter(Boolean)).toHaveLength(params.count);
      expect(trayFor(round.board).size).toBe(params.kinds);
    }
  });

  it('bewertet Positionen: Treffer zählen, Fehlklicks ziehen ab', () => {
    const round = { size: 3, board: ['quadrat', null, null, 'quadrat', null, null, null, null, 'quadrat'] as Board };
    const perfect = evaluateRound(round, round.board, 'positionen');
    expect(perfect).toMatchObject({ correct: 3, wrong: 0, accuracy: 1, perfect: true });
    const answer: Board = ['quadrat', 'quadrat', null, null, null, null, null, null, 'quadrat'];
    expect(evaluateRound(round, answer, 'positionen')).toMatchObject({ correct: 2, wrong: 1, missed: 1, perfect: false });
    expect(evaluateRound(round, answer, 'positionen').accuracy).toBeCloseTo(1 / 3);
  });

  it('bewertet Formen: nur die richtige Form am richtigen Ort zählt', () => {
    const round = { size: 3, board: ['kreis', 'dreieck', null, null, null, null, null, null, null] as Board };
    const swapped: Board = ['dreieck', 'kreis', null, null, null, null, null, null, null];
    expect(evaluateRound(round, swapped, 'formen')).toMatchObject({ correct: 0, wrong: 2, accuracy: 0 });
    const half: Board = ['kreis', null, 'dreieck', null, null, null, null, null, null];
    expect(evaluateRound(round, half, 'formen')).toMatchObject({ correct: 1, accuracy: 0.5 });
  });
});

function answerFromScene(scene: Scene, text: string): string {
  const countColor = /^Wie viele (\w+) Formen/.exec(text);
  if (countColor) {
    const adj = countColor[1] ?? '';
    const color = (Object.keys(COLOR_NAMES) as (keyof typeof COLOR_NAMES)[]).find(
      (c) => `${COLOR_NAMES[c].toLowerCase()}e` === adj,
    );
    return String(scene.objects.filter((o) => o.color === color).length);
  }
  const countShape = /^Wie viele (\w+) waren/.exec(text);
  if (countShape) {
    const shape = Object.values(SHAPES).find((s) => s.plural === countShape[1]);
    return String(scene.objects.filter((o) => o.shape === shape?.id).length);
  }
  const corner = (Object.keys(CORNER_LABEL) as Corner[]).find((c) => text.includes(CORNER_LABEL[c]));
  if (corner) {
    const cells = { lo: 0, ro: scene.cols - 1, lu: (scene.rows - 1) * scene.cols, ru: scene.rows * scene.cols - 1 };
    const obj = scene.objects.find((o) => o.cell === cells[corner]);
    if (!obj) return '?';
    return text.startsWith('Welche Form') ? SHAPES[obj.shape].name : COLOR_NAMES[obj.color];
  }
  return '';
}

describe('Detailblick', () => {
  it('belegt immer alle vier Ecken und bleibt im Raster', () => {
    for (let d = 1; d <= 20; d += 3) {
      const params = detailblickParams(d);
      const scene = generateScene(params, createRng(d));
      expect(scene.objects.length).toBe(params.count);
      expect(new Set(scene.objects.map((o) => o.cell)).size).toBe(scene.objects.length);
      expect(scene.objects.every((o) => o.cell < params.cols * params.rows)).toBe(true);
    }
  });

  it('erzeugt eindeutige Fragen, deren richtige Antwort zur Szene passt', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const params = detailblickParams((seed % 20) + 1);
      const rng = createRng(seed);
      const scene = generateScene(params, rng);
      const questions = generateQuestions(scene, params.questions, rng);
      expect(questions).toHaveLength(params.questions);
      expect(new Set(questions.map((q) => q.text)).size).toBe(questions.length);
      for (const q of questions) {
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        const expected = answerFromScene(scene, q.text);
        if (expected) expect(q.options[q.correctIndex]).toBe(expected);
      }
    }
  });

  it('beantwortet „War … zu sehen?“ passend zur Szene', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = createRng(seed);
      const scene = generateScene(detailblickParams(8), rng);
      for (const q of generateQuestions(scene, 5, rng).filter((x) => x.kind === 'gesehen')) {
        const present = scene.objects.some((o) => q.text.includes(`${SHAPES[o.shape].name} zu sehen`) && q.text.includes(COLOR_NAMES[o.color].toLowerCase()));
        expect(q.options[q.correctIndex]).toBe(present ? 'Ja' : 'Nein');
      }
    }
  });
});

describe('Zahlenspur', () => {
  it('startet mit 3 Ziffern und wird länger und schneller', () => {
    expect(zahlenspurParams(1)).toMatchObject({ startLength: 3, backwardsChance: 0 });
    expect(zahlenspurParams(20).startLength).toBe(9);
    expect(zahlenspurParams(12).backwardsChance).toBeGreaterThan(0);
  });

  it('erzeugt Folgen ohne direkte Wiederholung', () => {
    const seq = generateSequence(12, createRng(7));
    expect(seq).toHaveLength(12);
    seq.slice(1).forEach((d, i) => expect(d).not.toBe(seq[i]));
  });

  it('wertet vorwärts und rückwärts aus', () => {
    expect(evaluateTrial([1, 2, 3], 'vorwaerts', [1, 2, 3])).toMatchObject({ perfect: true, score: 45 });
    expect(evaluateTrial([1, 2, 3], 'rueckwaerts', [3, 2, 1])).toMatchObject({ perfect: true, score: 68 });
    expect(evaluateTrial([1, 2, 3, 4], 'vorwaerts', [1, 2, 4, 3])).toMatchObject({ positionsCorrect: 2, accuracy: 0.5, perfect: false });
  });

  it('passt die Länge adaptiv an', () => {
    expect(nextLength(5, evaluateTrial([1, 2, 3, 4, 5], 'vorwaerts', [1, 2, 3, 4, 5]))).toBe(6);
    expect(nextLength(5, evaluateTrial([1, 2, 3, 4, 5], 'vorwaerts', [9, 9, 9, 9, 9]))).toBe(4);
    expect(nextLength(5, evaluateTrial([1, 2, 3, 4, 5], 'vorwaerts', [1, 2, 3, 9, 9]))).toBe(5);
    expect(nextLength(3, evaluateTrial([1, 2, 3], 'vorwaerts', []))).toBe(3);
  });
});

describe('Tempo-Duell', () => {
  it('steigert Ziel und Aufgabenvielfalt mit der Stufe', () => {
    expect(tempoParams(1, createRng(1)).kinds).toHaveLength(1);
    expect(tempoParams(12, createRng(1)).kinds).toHaveLength(3);
    expect(tempoParams(12, createRng(1)).target).toBeGreaterThan(tempoParams(1, createRng(1)).target);
  });

  it('verzichtet mit Farbsehhilfe auf Farbe-Wort-Aufgaben', () => {
    for (let s = 1; s < 20; s++) expect(tempoParams(15, createRng(s), true).kinds).not.toContain('farbwort');
  });

  it('liefert Aufgaben, deren „passt“ zur Darstellung stimmt', () => {
    const params = { ...tempoParams(12, createRng(3)), kinds: ['farbwort', 'formwort', 'gleich'] as const };
    const stream = createTrialStream({ ...params, kinds: [...params.kinds] }, createRng(5));
    let last: string | null = null;
    for (let i = 0; i < 200; i++) {
      const t = stream.next();
      if (t.kind === 'farbwort') expect(t.match).toBe(t.word === t.fill);
      if (t.kind === 'formwort') expect(t.match).toBe(t.word === t.shape);
      if (t.kind === 'gleich') {
        if (t.intro) last = null;
        else expect(t.match).toBe(t.token === last);
        last = t.token;
      } else {
        last = null;
      }
    }
  });

  it('erhöht den Combo-Multiplikator in 5er-Schritten bis ×4', () => {
    expect([1, 4, 5, 9, 10, 15, 40].map(comboMultiplier)).toEqual([1, 1, 2, 2, 3, 4, 4]);
    expect(pointsForAnswer(2000, 1)).toBe(10);
    expect(pointsForAnswer(500, 10)).toBe(40);
  });

  it('verlangt für volle Leistung Tempo und Genauigkeit', () => {
    expect(tempoPerformance(20, 0, 20)).toBe(1);
    expect(tempoPerformance(10, 0, 20)).toBe(0.5);
    expect(tempoPerformance(20, 20, 20)).toBe(0.5);
    expect(tempoPerformance(0, 0, 20)).toBe(0);
  });
});

describe('Wissensrunde', () => {
  const pool: Question[] = Array.from({ length: 30 }, (_, i) => ({
    id: `q${i}`,
    category: i < 15 ? 'natur' : 'mathe',
    difficulty: ((i % 3) + 1) as 1 | 2 | 3,
    question: `F${i}?`,
    answers: ['r', 'f1', 'f2', 'f3'],
    explanation: 'e',
  }));

  it('mischt Antworten, ohne Fragen doppelt zu stellen', () => {
    const round = prepareRound(pool, {}, wissenParams(10), createRng(9), { today: '2026-11-04', categories: ['natur'] });
    expect(round).toHaveLength(7);
    expect(new Set(round.map((r) => r.question.id)).size).toBe(7);
    for (const r of round) {
      expect(r.question.category).toBe('natur');
      expect([...r.order].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it('vergibt Zeitbonus nur bei richtiger Antwort', () => {
    expect(wissenPoints(true, null, null)).toBe(100);
    expect(wissenPoints(true, 5000, 10000)).toBe(125);
    expect(wissenPoints(false, 9000, 10000)).toBe(0);
  });
});
