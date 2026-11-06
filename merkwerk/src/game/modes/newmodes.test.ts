import { describe, expect, it } from 'vitest';
import { EVENTS } from '../../data/events';
import { createRng } from '../../lib/rng';
import { createScaleTrial, makeTerm, rechenwaageParams, termWithValue } from './rechenwaage';

/** Rechnet einen angezeigten Ausdruck nach (Punkt vor Strich), unabhängig vom Generator. */
function calc(text: string): number {
  const tokens = text.split(' ');
  const sums: (number | string)[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] ?? '';
    if (t === '×' || t === ':') {
      const left = sums.pop() as number;
      const right = Number(tokens[++i]);
      sums.push(t === '×' ? left * right : left / right);
    } else {
      sums.push(t === '+' || t === '−' ? t : Number(t));
    }
  }
  let value = sums[0] as number;
  for (let i = 1; i < sums.length; i += 2) {
    const op = sums[i];
    const n = sums[i + 1] as number;
    value = op === '+' ? value + n : value - n;
  }
  return value;
}
import {
  evaluatePath,
  generatePath,
  nextPathLength,
  pathDirection,
  wegmarkenParams,
} from './wegmarken';
import {
  APPROX_GAP,
  chronological,
  evaluateOrder,
  formatYear,
  pickRound,
  zeitleisteParams,
} from './zeitleiste';

describe('Wegmarken', () => {
  it('wächst von 3×3 auf 5×5 und wird schneller', () => {
    expect(wegmarkenParams(1)).toMatchObject({ size: 3, startLength: 3, backwardsChance: 0 });
    expect(wegmarkenParams(20)).toMatchObject({ size: 5, startLength: 7 });
    expect(wegmarkenParams(20).stepMs).toBeLessThan(wegmarkenParams(1).stepMs);
  });

  it('erzeugt Wege aus verschiedenen Feldern innerhalb des Rasters', () => {
    for (let seed = 1; seed < 40; seed++) {
      const path = generatePath(7, 4, createRng(seed));
      expect(path).toHaveLength(7);
      expect(new Set(path).size).toBe(7);
      expect(path.every((cell) => cell >= 0 && cell < 16)).toBe(true);
    }
  });

  it('begrenzt die Weglänge auf die Zahl der Felder', () => {
    expect(generatePath(12, 3, createRng(1))).toHaveLength(9);
    const params = wegmarkenParams(1);
    const perfect = evaluatePath([0, 1, 2], 'vorwaerts', [0, 1, 2]);
    expect(nextPathLength(9, perfect, params)).toBe(9);
  });

  it('wertet vorwärts und rückwärts aus', () => {
    expect(evaluatePath([4, 0, 8], 'vorwaerts', [4, 0, 8]).perfect).toBe(true);
    expect(evaluatePath([4, 0, 8], 'rueckwaerts', [8, 0, 4]).perfect).toBe(true);
    expect(evaluatePath([4, 0, 8], 'vorwaerts', [4, 8, 0])).toMatchObject({
      positionsCorrect: 1,
      perfect: false,
    });
  });

  it('beginnt immer vorwärts und mischt erst ab Stufe 10 Rückwärts-Wege ein', () => {
    const rng = createRng(3);
    expect(pathDirection(0, wegmarkenParams(18), rng)).toBe('vorwaerts');
    for (let i = 1; i < 30; i++)
      expect(pathDirection(i, wegmarkenParams(5), rng)).toBe('vorwaerts');
  });
});

describe('Rechenwaage', () => {
  it('steigert Zielmenge und Rechenstufe mit der Schwierigkeit', () => {
    expect(rechenwaageParams(1)).toMatchObject({ tier: 1, target: 9 });
    expect(rechenwaageParams(20)).toMatchObject({ tier: 5, target: 24 });
  });

  it('erzeugt Ausdrücke, deren Text zum Wert passt', () => {
    for (const tier of [1, 2, 3, 4, 5] as const) {
      for (let seed = 1; seed < 80; seed++) {
        const t = makeTerm(tier, createRng(seed * 7 + tier));
        expect(calc(t.text), t.text).toBe(t.value);
        expect(Number.isInteger(t.value) && t.value >= 0, t.text).toBe(true);
        expect(t.spoken).not.toMatch(/[×−:+]/);
      }
    }
  });

  it('findet einen anderen Ausdruck mit gleichem Wert', () => {
    const rng = createRng(11);
    for (let v = 0; v < 60; v++) {
      const t = termWithValue(3, v, rng, `${v} + 0`);
      expect(t.value).toBe(v);
    }
  });

  it('liefert Aufgaben mit stimmiger Lösung und gelegentlich Gleichstand', () => {
    const rng = createRng(5);
    const counts = { links: 0, rechts: 0, gleich: 0 };
    for (let i = 0; i < 400; i++) {
      const trial = createScaleTrial(rechenwaageParams(1 + (i % 20)), rng);
      const expected =
        trial.left.value === trial.right.value
          ? 'gleich'
          : trial.left.value > trial.right.value
            ? 'links'
            : 'rechts';
      expect(trial.answer).toBe(expected);
      expect(trial.left.text).not.toBe(trial.right.text);
      counts[trial.answer] += 1;
    }
    expect(counts.gleich).toBeGreaterThan(40);
    expect(counts.links).toBeGreaterThan(100);
    expect(counts.rechts).toBeGreaterThan(100);
  });
});

describe('Zeitleiste', () => {
  it('hat eindeutige IDs und Jahre in den Ereignisdaten', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(80);
    expect(new Set(EVENTS.map((ev) => ev.id)).size).toBe(EVENTS.length);
    expect(new Set(EVENTS.map((ev) => ev.year)).size).toBe(EVENTS.length);
  });

  it('formatiert Jahre vor Christus und ungefähre Daten', () => {
    expect(formatYear({ year: -44 })).toBe('44 v. Chr.');
    expect(formatYear({ year: -2560, approx: true })).toBe('um 2560 v. Chr.');
    expect(formatYear({ year: 1492 })).toBe('1492');
  });

  it('wählt Ereignisse mit Mindestabstand und ohne Wiederholung innerhalb einer Partie', () => {
    for (let d = 1; d <= 20; d += 3) {
      const params = zeitleisteParams(d);
      const rng = createRng(d);
      const used = new Set<string>();
      for (let r = 0; r < params.rounds; r++) {
        const round = pickRound(EVENTS, params, rng, used);
        expect(round).toHaveLength(params.count);
        for (const a of round) {
          expect(used.has(a.id)).toBe(false);
          for (const b of round) {
            if (a === b) continue;
            const gap = a.approx || b.approx ? Math.max(params.minGap, APPROX_GAP) : params.minGap;
            expect(Math.abs(a.year - b.year)).toBeGreaterThanOrEqual(gap);
          }
        }
        round.forEach((ev) => used.add(ev.id));
      }
    }
  });

  it('bewertet die Reihenfolge Platz für Platz', () => {
    const events = [EVENTS[40], EVENTS[2], EVENTS[70]].filter((ev) => ev !== undefined);
    const right = chronological(events).map((ev) => ev.id);
    expect(evaluateOrder(right, events)).toMatchObject({
      correct: 3,
      accuracy: 1,
      perfect: true,
      score: 135,
    });
    expect(evaluateOrder([...right].reverse(), events)).toMatchObject({
      correct: 1,
      perfect: false,
    });
  });
});
