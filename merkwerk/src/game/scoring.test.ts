import { describe, expect, it } from 'vitest';
import { levelFromXp, skillIndex, starsFor, xpFor, xpForNextLevel } from './scoring';

describe('starsFor', () => {
  it('vergibt 0 Sterne unter 50 % Leistung', () => {
    expect(starsFor(0)).toBe(0);
    expect(starsFor(0.49)).toBe(0);
  });

  it('vergibt 1, 2 und 3 Sterne genau an den Schwellen', () => {
    expect(starsFor(0.5)).toBe(1);
    expect(starsFor(0.75)).toBe(2);
    expect(starsFor(0.9)).toBe(3);
  });

  it('bleibt knapp unter einer Schwelle auf der niedrigeren Stufe', () => {
    expect(starsFor(0.7499)).toBe(1);
    expect(starsFor(0.8999)).toBe(2);
  });

  it('behandelt ungültige Werte robust', () => {
    expect(starsFor(Number.NaN)).toBe(0);
    expect(starsFor(-1)).toBe(0);
    expect(starsFor(1.7)).toBe(3);
  });
});

describe('xpFor', () => {
  it('setzt sich aus Grundwert, Sternen und Stufe zusammen', () => {
    const xp = xpFor({ stars: 2, difficulty: 5, newStars: 0, dailyCompleted: false });
    expect(xp).toEqual({ base: 10, stars: 30, difficulty: 10, firstClear: 0, daily: 0, total: 50 });
  });

  it('belohnt neu gewonnene Sterne und die Tagesaufgabe zusätzlich', () => {
    const xp = xpFor({ stars: 3, difficulty: 1, newStars: 3, dailyCompleted: true });
    expect(xp.firstClear).toBe(30);
    expect(xp.daily).toBe(125);
    expect(xp.total).toBe(10 + 45 + 2 + 30 + 125);
  });

  it('gibt auch bei 0 Sternen den Grundwert für die Mühe', () => {
    expect(xpFor({ stars: 0, difficulty: 1, newStars: 0, dailyCompleted: false }).total).toBe(12);
  });
});

describe('levelFromXp', () => {
  it('startet bei Level 1 mit 0 XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: 100 });
  });

  it('steigt genau an der Schwelle auf', () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toEqual({ level: 2, current: 0, needed: 140 });
    expect(levelFromXp(100 + 140 + 10)).toEqual({ level: 3, current: 10, needed: 180 });
  });

  it('wächst den Bedarf linear', () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(10)).toBe(460);
  });

  it('ignoriert negative und ungültige Werte', () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
  });
});

describe('skillIndex', () => {
  it('liegt zwischen 0 und 100', () => {
    expect(skillIndex(1, 0)).toBe(0);
    expect(skillIndex(20, 1)).toBe(100);
  });

  it('bewertet dieselbe Leistung auf höherer Stufe höher', () => {
    expect(skillIndex(10, 0.8)).toBeGreaterThan(skillIndex(5, 0.8));
  });
});
