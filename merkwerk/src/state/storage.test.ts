import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, createDefaultSave, sanitizeSave } from './schema';
import { BACKUP_KEY, STORAGE_KEY, loadSave, parseSave, writeSave, type StorageLike } from './storage';

const NOW = new Date('2026-11-04T10:00:00');

class MemoryStorage implements StorageLike {
  store = new Map<string, string>();
  failWrites = 0;
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites > 0) {
      this.failWrites -= 1;
      throw new DOMException('voll', 'QuotaExceededError');
    }
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('parseSave', () => {
  it('liefert einen neuen Spielstand, wenn nichts gespeichert ist', () => {
    const { data, status } = parseSave(null, NOW);
    expect(status).toBe('neu');
    expect(data).toEqual(createDefaultSave(NOW));
  });

  it('übersteht kaputtes JSON ohne Absturz', () => {
    const { data, status } = parseSave('{"version": 2, "levels": {', NOW);
    expect(status).toBe('defekt');
    expect(data.version).toBe(SAVE_VERSION);
  });

  it('übersteht JSON, das kein Objekt ist', () => {
    expect(parseSave('42', NOW).status).toBe('defekt');
    expect(parseSave('[1,2]', NOW).status).toBe('defekt');
    expect(parseSave('null', NOW).status).toBe('defekt');
  });

  it('repariert einzelne falsche Felder und behält gültige', () => {
    const raw = JSON.stringify({
      version: 2,
      onboardingDone: true,
      settings: { sound: 'laut', haptics: false },
      player: { xp: -10, gamesPlayed: 3.6 },
      levels: { 'w1-1': { stars: 9, bestScore: 120 }, 'gibt-es-nicht': { stars: 3 }, 'w1-2': 'kaputt' },
      leitner: { 'geo-001': { box: 7, due: '2026-11-05' }, 'geo-002': { box: 2, due: 'morgen' } },
      stats: { days: { '2026-11-03': { tempo: { sum: 50, n: 1 } }, falsch: {} } },
    });
    const { data, status } = parseSave(raw, NOW);
    expect(status).toBe('ok');
    expect(data.onboardingDone).toBe(true);
    expect(data.settings.sound).toBe(true);
    expect(data.settings.haptics).toBe(false);
    expect(data.player.xp).toBe(0);
    expect(data.player.gamesPlayed).toBe(4);
    expect(data.levels).toEqual({ 'w1-1': { stars: 3, bestScore: 120, bestPerformance: 0, plays: 0 } });
    expect(data.leitner).toEqual({ 'geo-001': { box: 5, due: '2026-11-05', seen: 0, correct: 0, wrong: 0 } });
    expect(Object.keys(data.stats.days)).toEqual(['2026-11-03']);
  });

  it('migriert einen Spielstand der Version 1', () => {
    const v1 = {
      version: 1,
      createdAt: '2026-01-02T08:00:00.000Z',
      onboarded: true,
      xp: 340,
      settings: { sound: false, haptics: true, reduceMotion: true },
      stars: { 'w1-1': 3, 'w1-2': 1 },
      streak: { current: 4, best: 6, last: '2026-11-03' },
      leitner: { 'geo-001': { box: 1, due: '2026-11-04' }, 'nat-002': { box: 3, due: '2026-11-07' } },
    };
    const { data, status } = parseSave(JSON.stringify(v1), NOW);
    expect(status).toBe('migriert');
    expect(data.version).toBe(SAVE_VERSION);
    expect(data.createdAt).toBe('2026-01-02T08:00:00.000Z');
    expect(data.onboardingDone).toBe(true);
    expect(data.player.xp).toBe(340);
    expect(data.settings).toEqual({ sound: false, haptics: true, reduceMotion: true, colorPatterns: false });
    expect(data.levels['w1-1']).toEqual({ stars: 3, bestScore: 0, bestPerformance: 0, plays: 1 });
    expect(data.levels['w1-2']?.stars).toBe(1);
    expect(data.streak).toEqual({ current: 4, best: 6, lastActiveDay: '2026-11-03' });
    expect(data.leitner['geo-001']).toEqual({ box: 1, due: '2026-11-04', seen: 1, correct: 0, wrong: 1 });
    expect(data.leitner['nat-002']?.box).toBe(3);
  });

  it('behandelt Daten ohne Versionsnummer als Version 1', () => {
    const { data, status } = parseSave(JSON.stringify({ xp: 50, stars: { 'w1-1': 2 } }), NOW);
    expect(status).toBe('migriert');
    expect(data.levels['w1-1']?.stars).toBe(2);
  });

  it('übernimmt bekannte Felder aus einer neueren Version', () => {
    const future = { ...createDefaultSave(NOW), version: 99, player: { xp: 777, gamesPlayed: 2, playTimeMs: 0 }, neu: true };
    const { data, status } = parseSave(JSON.stringify(future), NOW);
    expect(status).toBe('repariert');
    expect(data.player.xp).toBe(777);
    expect(data.version).toBe(SAVE_VERSION);
  });
});

describe('Speichern und Laden', () => {
  it('lädt genau das, was gespeichert wurde', () => {
    const storage = new MemoryStorage();
    const save = { ...createDefaultSave(NOW), onboardingDone: true };
    save.levels['w1-1'] = { stars: 2, bestScore: 300, bestPerformance: 0.8, plays: 2 };
    expect(writeSave(storage, save)).toBe(true);
    expect(loadSave(storage, NOW)).toEqual({ data: save, status: 'ok' });
  });

  it('sichert defekte Rohdaten, bevor sie überschrieben werden', () => {
    const storage = new MemoryStorage();
    storage.store.set(STORAGE_KEY, 'kein json');
    const { status } = loadSave(storage, NOW);
    expect(status).toBe('defekt');
    expect(storage.store.get(BACKUP_KEY)).toBe('kein json');
  });

  it('kürzt die Statistik, wenn der Speicher voll ist', () => {
    const storage = new MemoryStorage();
    const save = createDefaultSave(NOW);
    for (let i = 1; i <= 60; i++) {
      const key = `2026-0${1 + Math.floor((i - 1) / 28)}-${String(((i - 1) % 28) + 1).padStart(2, '0')}`;
      save.stats.days[key] = { tempo: { sum: 50, n: 1 } };
    }
    storage.failWrites = 1;
    expect(writeSave(storage, save)).toBe(true);
    const stored = JSON.parse(storage.store.get(STORAGE_KEY) ?? '{}') as { stats: { days: object } };
    expect(Object.keys(stored.stats.days)).toHaveLength(30);
  });

  it('meldet false statt abzustürzen, wenn gar nicht gespeichert werden kann', () => {
    const storage = new MemoryStorage();
    storage.failWrites = 5;
    expect(writeSave(storage, createDefaultSave(NOW))).toBe(false);
    expect(writeSave(null, createDefaultSave(NOW))).toBe(false);
  });

  it('startet frisch, wenn der Speicherzugriff selbst fehlschlägt', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('gesperrt');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(loadSave(broken, NOW).status).toBe('neu');
  });
});

describe('sanitizeSave', () => {
  it('ist idempotent für gültige Spielstände', () => {
    const save = createDefaultSave(NOW);
    expect(sanitizeSave(JSON.parse(JSON.stringify(save)), NOW)).toEqual(save);
  });
});
