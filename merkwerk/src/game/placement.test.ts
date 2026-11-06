import { describe, expect, it } from 'vitest';
import { placementFromSpan } from './placement';

describe('placementFromSpan', () => {
  it('startet bei einer kurzen Spanne auf Stufe 1 und macht Gedächtnis-Level leichter', () => {
    const result = placementFromSpan(3);
    expect(result.ratings.zahlenspur).toBe(1);
    expect(result.ratings.blitzbild).toBe(1);
    expect(result.memoryOffset).toBe(-1);
  });

  it('setzt bei einer typischen Spanne mittlere Startstufen ohne Versatz', () => {
    const result = placementFromSpan(6);
    expect(result.ratings.zahlenspur).toBe(10);
    expect(result.ratings.blitzbild).toBe(7);
    expect(result.memoryOffset).toBe(0);
  });

  it('macht Gedächtnis-Level ab 7 Ziffern etwas schwerer und begrenzt die Stufen', () => {
    const result = placementFromSpan(9);
    expect(result.ratings.zahlenspur).toBe(12);
    expect(result.ratings.detailblick).toBe(10);
    expect(result.memoryOffset).toBe(1);
  });

  it('lässt nicht getestete Fähigkeiten auf Stufe 1', () => {
    expect(placementFromSpan(8).ratings.tempo).toBe(1);
    expect(placementFromSpan(8).ratings.wissen).toBe(1);
  });
});
