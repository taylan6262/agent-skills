import { describe, expect, it } from 'vitest';
import { adaptiveStep, defaultAdaptive, effectiveDifficulty, updateAdaptive } from './adaptive';

describe('adaptiveStep', () => {
  it('erhöht nach zwei sehr guten Runden in Folge', () => {
    const first = adaptiveStep(0, 0, 0.95);
    expect(first).toEqual({ delta: 0, winStreak: 1, failStreak: 0 });
    const second = adaptiveStep(first.winStreak, first.failStreak, 0.92);
    expect(second).toEqual({ delta: 1, winStreak: 0, failStreak: 0 });
  });

  it('senkt nach zwei Fehlschlägen in Folge', () => {
    const first = adaptiveStep(0, 0, 0.2);
    expect(first.delta).toBe(0);
    expect(adaptiveStep(first.winStreak, first.failStreak, 0.4).delta).toBe(-1);
  });

  it('setzt Serien bei mittlerer Leistung zurück', () => {
    expect(adaptiveStep(1, 0, 0.7)).toEqual({ delta: 0, winStreak: 0, failStreak: 0 });
    expect(adaptiveStep(0, 1, 0.7)).toEqual({ delta: 0, winStreak: 0, failStreak: 0 });
  });

  it('unterbricht eine Siegesserie durch einen Fehlschlag', () => {
    const afterWin = adaptiveStep(0, 0, 1);
    const afterFail = adaptiveStep(afterWin.winStreak, afterWin.failStreak, 0.1);
    expect(afterFail).toEqual({ delta: 0, winStreak: 0, failStreak: 1 });
  });
});

describe('updateAdaptive', () => {
  it('ändert in Kampagnen-Leveln nur den Versatz', () => {
    let state = defaultAdaptive(5);
    state = updateAdaptive(state, 1, 'level').state;
    const update = updateAdaptive(state, 1, 'level');
    expect(update.state.offset).toBe(1);
    expect(update.state.rating).toBe(5);
    expect(update.change).toBe(1);
  });

  it('ändert im Training die absolute Stufe', () => {
    let state = defaultAdaptive(5);
    state = updateAdaptive(state, 0, 'training').state;
    const update = updateAdaptive(state, 0, 'training');
    expect(update.state.rating).toBe(4);
    expect(update.change).toBe(-1);
  });

  it('begrenzt Versatz auf ±2 und Stufe auf 1 bis 20', () => {
    const maxed = { offset: 2, rating: 20, winStreak: 1, failStreak: 0 };
    expect(updateAdaptive(maxed, 1, 'level')).toMatchObject({ change: 0, state: { offset: 2 } });
    expect(updateAdaptive(maxed, 1, 'training')).toMatchObject({ change: 0, state: { rating: 20 } });
    const floor = { offset: -2, rating: 1, winStreak: 0, failStreak: 1 };
    expect(updateAdaptive(floor, 0, 'level').state.offset).toBe(-2);
    expect(updateAdaptive(floor, 0, 'daily').state.rating).toBe(1);
  });
});

describe('effectiveDifficulty', () => {
  it('addiert den Versatz und begrenzt das Ergebnis', () => {
    expect(effectiveDifficulty(5, 2)).toBe(7);
    expect(effectiveDifficulty(1, -2)).toBe(1);
    expect(effectiveDifficulty(19, 2)).toBe(20);
  });
});
