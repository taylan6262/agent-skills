import { describe, expect, it } from 'vitest';
import { playedToday, registerActivity, visibleStreak } from './progression';

const empty = { current: 0, best: 0, lastActiveDay: null };

describe('Serie (Tage in Folge)', () => {
  it('startet mit dem ersten aktiven Tag bei 1', () => {
    expect(registerActivity(empty, '2026-11-04')).toEqual({ current: 1, best: 1, lastActiveDay: '2026-11-04' });
  });

  it('zählt mehrere Spiele am selben Tag nur einmal', () => {
    const once = registerActivity(empty, '2026-11-04');
    expect(registerActivity(once, '2026-11-04')).toBe(once);
  });

  it('wächst an aufeinanderfolgenden Tagen, auch über Monatsgrenzen', () => {
    let s = registerActivity(empty, '2026-10-30');
    s = registerActivity(s, '2026-10-31');
    s = registerActivity(s, '2026-11-01');
    expect(s).toEqual({ current: 3, best: 3, lastActiveDay: '2026-11-01' });
  });

  it('beginnt nach einer Lücke neu, behält aber den Bestwert', () => {
    const s = registerActivity({ current: 5, best: 5, lastActiveDay: '2026-11-01' }, '2026-11-04');
    expect(s).toEqual({ current: 1, best: 5, lastActiveDay: '2026-11-04' });
  });

  it('ignoriert eine zurückgestellte Geräteuhr', () => {
    const s = { current: 4, best: 4, lastActiveDay: '2026-11-04' };
    expect(registerActivity(s, '2026-11-01')).toBe(s);
  });

  it('zeigt die Serie bis einschließlich zum Folgetag, danach 0', () => {
    const s = { current: 3, best: 3, lastActiveDay: '2026-11-03' };
    expect(visibleStreak(s, '2026-11-03')).toBe(3);
    expect(visibleStreak(s, '2026-11-04')).toBe(3);
    expect(visibleStreak(s, '2026-11-05')).toBe(0);
    expect(playedToday(s, '2026-11-04')).toBe(false);
  });
});
