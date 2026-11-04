import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../../game/types';
import { QUESTIONS } from './index';

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');

describe('Fragendaten', () => {
  it('enthält mindestens 300 Fragen', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(300);
  });

  it('hat in jeder Kategorie mindestens 50 Fragen', () => {
    for (const category of CATEGORY_IDS) {
      expect(
        QUESTIONS.filter((q) => q.category === category).length,
        category,
      ).toBeGreaterThanOrEqual(50);
    }
  });

  it('vergibt eindeutige, zur Kategorie passende IDs', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const prefix = {
      geografie: 'geo',
      natur: 'nat',
      wissenschaft: 'wis',
      geschichte: 'ges',
      sprache: 'spr',
      mathe: 'mat',
    };
    for (const q of QUESTIONS) expect(q.id.startsWith(`${prefix[q.category]}-`), q.id).toBe(true);
  });

  it('enthält keine doppelten Fragen', () => {
    const texts = QUESTIONS.map((q) => normalize(q.question));
    const dupes = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it('hat je Frage vier verschiedene, nicht leere Antworten', () => {
    for (const q of QUESTIONS) {
      expect(q.answers, q.id).toHaveLength(4);
      expect(new Set(q.answers.map((a) => a.trim())).size, q.id).toBe(4);
      for (const a of q.answers) expect(a.trim().length, q.id).toBeGreaterThan(0);
    }
  });

  it('hat zu jeder Frage eine Erklärung und eine gültige Schwierigkeit', () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.length, q.id).toBeGreaterThan(15);
      expect([1, 2, 3], q.id).toContain(q.difficulty);
      expect(q.question.trim().endsWith('?'), q.id).toBe(true);
    }
  });

  it('bietet in jeder Kategorie leichte, mittlere und schwere Fragen', () => {
    for (const category of CATEGORY_IDS) {
      const levels = new Set(
        QUESTIONS.filter((q) => q.category === category).map((q) => q.difficulty),
      );
      expect([...levels].sort(), category).toEqual([1, 2, 3]);
    }
  });

  it('verwendet keine Zeichen, die Inline-HTML oder Platzhalter vermuten lassen', () => {
    for (const q of QUESTIONS) {
      const all = [q.question, ...q.answers, q.explanation].join(' ');
      expect(all, q.id).not.toMatch(/[<>{}]|TODO|lorem/i);
    }
  });
});
