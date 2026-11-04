import { describe, expect, it } from 'vitest';
import { skillSeries, trendOf } from './statsView';

describe('skillSeries', () => {
  it('bildet Tagesdurchschnitte je Fähigkeit in zeitlicher Reihenfolge', () => {
    const series = skillSeries({
      '2026-11-03': { tempo: { sum: 90, n: 2 } },
      '2026-11-01': { tempo: { sum: 30, n: 1 }, wissen: { sum: 60, n: 1 } },
    });
    expect(series.days).toEqual(['2026-11-01', '2026-11-03']);
    expect(series.values.tempo).toEqual([30, 45]);
    expect(series.values.wissen).toEqual([60, null]);
    expect(series.values.lernen).toEqual([null, null]);
  });

  it('begrenzt auf die letzten Tage mit Daten', () => {
    const days = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `2026-10-${String(i + 1).padStart(2, '0')}`,
        { tempo: { sum: i, n: 1 } },
      ]),
    );
    expect(skillSeries(days, 30).days).toHaveLength(30);
  });
});

describe('trendOf', () => {
  it('liefert Veränderung zwischen erstem und letztem Wert', () => {
    expect(trendOf([null, 20, null, 35])).toEqual({ first: 20, latest: 35, change: 15 });
  });

  it('meldet keine Veränderung bei nur einem Wert', () => {
    expect(trendOf([null, 40])).toEqual({ first: 40, latest: 40, change: null });
  });
});
