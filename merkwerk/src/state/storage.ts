import { migrate } from './migrations';
import { SAVE_VERSION, createDefaultSave, isObj, sanitizeSave, type SaveData } from './schema';

export const STORAGE_KEY = 'merkwerk.spielstand';
export const BACKUP_KEY = 'merkwerk.spielstand.sicherung';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadStatus = 'neu' | 'ok' | 'migriert' | 'repariert' | 'defekt';

export interface LoadResult {
  data: SaveData;
  status: LoadStatus;
}

/** Liest einen gespeicherten Text. Wirft nie – defekte Daten ergeben einen frischen Spielstand. */
export function parseSave(raw: string | null, now: Date): LoadResult {
  if (raw === null || raw === '') return { data: createDefaultSave(now), status: 'neu' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: createDefaultSave(now), status: 'defekt' };
  }
  if (!isObj(parsed)) return { data: createDefaultSave(now), status: 'defekt' };

  const version = parsed.version;
  if (typeof version === 'number' && version > SAVE_VERSION) {
    // Spielstand einer neueren App-Version: bekannte Felder übernehmen, Original sichern.
    return { data: sanitizeSave(parsed, now), status: 'repariert' };
  }
  const { data, migrated } = migrate(parsed, SAVE_VERSION);
  return { data: sanitizeSave(data, now), status: migrated ? 'migriert' : 'ok' };
}

export function loadSave(storage: StorageLike | null, now: Date): LoadResult {
  if (!storage) return { data: createDefaultSave(now), status: 'neu' };
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { data: createDefaultSave(now), status: 'neu' };
  }
  const result = parseSave(raw, now);
  if ((result.status === 'defekt' || result.status === 'repariert') && raw !== null) {
    try {
      storage.setItem(BACKUP_KEY, raw);
    } catch {
      // Sicherung ist ein Bonus – ohne Platz spielen wir trotzdem weiter.
    }
  }
  return result;
}

/** Entfernt alte Tagesstatistiken, falls der Speicher voll ist. */
export function pruneForSpace(data: SaveData, keepDays: number): SaveData {
  const keys = Object.keys(data.stats.days).sort();
  const keep = new Set(keys.slice(-keepDays));
  const days = Object.fromEntries(Object.entries(data.stats.days).filter(([key]) => keep.has(key)));
  return { ...data, stats: { ...data.stats, days } };
}

export function writeSave(storage: StorageLike | null, data: SaveData): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(pruneForSpace(data, 30)));
      return true;
    } catch {
      return false;
    }
  }
}

export function clearSave(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(BACKUP_KEY);
  } catch {
    // ignorieren
  }
}

/** localStorage, falls nutzbar (im privaten Modus mancher Browser wirft schon der Zugriff). */
export function browserStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = '__merkwerk_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
