import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  WORLDS,
  continueLevel,
  getLevel,
  isLevelUnlocked,
  isWorldUnlocked,
  levelsOfWorld,
  nextLevel,
  totalStars,
} from './levels';
import { MODE_IDS, type Stars } from './types';

function withStars(entries: Record<string, Stars>) {
  return Object.fromEntries(Object.entries(entries).map(([id, stars]) => [id, { stars }]));
}

function allLevelsWith(stars: Stars, worlds: number[]) {
  return withStars(Object.fromEntries(LEVELS.filter((l) => worlds.includes(l.world)).map((l) => [l.id, stars])));
}

describe('Level-Struktur', () => {
  it('hat mindestens 5 Welten mit je 12 Leveln (insgesamt 60+)', () => {
    expect(WORLDS.length).toBeGreaterThanOrEqual(5);
    for (const world of WORLDS) expect(levelsOfWorld(world.id)).toHaveLength(12);
    expect(LEVELS.length).toBeGreaterThanOrEqual(60);
  });

  it('vergibt eindeutige IDs und fortlaufende Nummern', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    LEVELS.forEach((level, i) => expect(level.number).toBe(i + 1));
  });

  it('mischt in jeder Welt alle fünf Modi', () => {
    for (const world of WORLDS) {
      const modes = new Set(levelsOfWorld(world.id).map((l) => l.mode));
      expect([...modes].sort()).toEqual([...MODE_IDS].sort());
    }
  });

  it('beginnt mit Blitzbild und wird von Welt zu Welt schwerer', () => {
    expect(getLevel('w1-1')?.mode).toBe('blitzbild');
    const first = levelsOfWorld(1).map((l) => l.baseDifficulty);
    const last = levelsOfWorld(6).map((l) => l.baseDifficulty);
    expect(Math.max(...first)).toBeLessThan(Math.min(...last));
  });

  it('gibt jedem Wissens-Level eine Kategorie', () => {
    for (const level of LEVELS.filter((l) => l.mode === 'wissen')) expect(level.category).toBeDefined();
  });

  it('liefert das nächste Level über Weltgrenzen hinweg', () => {
    expect(nextLevel('w1-12')?.id).toBe('w2-1');
    expect(nextLevel('w6-12')).toBeUndefined();
  });
});

describe('Freischaltung', () => {
  it('öffnet nur Level 1 von Welt 1 zu Beginn', () => {
    expect(isLevelUnlocked('w1-1', {})).toBe(true);
    expect(isLevelUnlocked('w1-2', {})).toBe(false);
    expect(isLevelUnlocked('w2-1', {})).toBe(false);
  });

  it('öffnet das nächste Level ab 1 Stern', () => {
    expect(isLevelUnlocked('w1-2', withStars({ 'w1-1': 1 }))).toBe(true);
    expect(isLevelUnlocked('w1-3', withStars({ 'w1-1': 3 }))).toBe(false);
  });

  it('öffnet Welten über die Gesamtsterne', () => {
    const almost = withStars({ 'w1-1': 3, 'w1-2': 3, 'w1-3': 3, 'w1-4': 3, 'w1-5': 3, 'w1-6': 3, 'w1-7': 1 });
    expect(totalStars(almost)).toBe(19);
    expect(isWorldUnlocked(2, almost)).toBe(false);
    const enough = { ...almost, ...withStars({ 'w1-7': 2 }) };
    expect(isWorldUnlocked(2, enough)).toBe(true);
    expect(isLevelUnlocked('w2-1', enough)).toBe(true);
    expect(isLevelUnlocked('w2-2', enough)).toBe(false);
  });

  it('hält spätere Welten trotz bestandener Level geschlossen, bis genug Sterne da sind', () => {
    const oneStarEverywhere = allLevelsWith(1, [1, 2, 3]);
    expect(totalStars(oneStarEverywhere)).toBe(36);
    expect(isWorldUnlocked(3, oneStarEverywhere)).toBe(false);
  });
});

describe('continueLevel', () => {
  it('schlägt zuerst das erste nicht bestandene Level vor', () => {
    expect(continueLevel({}).id).toBe('w1-1');
    expect(continueLevel(withStars({ 'w1-1': 2, 'w1-2': 1 })).id).toBe('w1-3');
  });

  it('geht in der nächsten offenen Welt weiter, sobald alles bestanden ist', () => {
    const levels = allLevelsWith(3, [1]);
    expect(continueLevel(levels).id).toBe('w2-1');
  });

  it('schlägt Level ohne 3 Sterne vor, wenn alle offenen Level bestanden sind', () => {
    const levels = allLevelsWith(1, [1]);
    expect(totalStars(levels)).toBe(12);
    expect(continueLevel(levels).id).toBe('w1-1');
    levels['w1-1'] = { stars: 3 };
    expect(continueLevel(levels).id).toBe('w1-2');
  });
});
