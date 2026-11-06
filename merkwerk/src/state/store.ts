import { useSyncExternalStore } from 'react';
import { MODE_IDS, MODE_SKILL, type GameResult, type ModeId } from '../game/types';
import { newlyAchieved } from '../game/achievements';
import { toDayKey } from '../lib/date';
import { applyResult, factsFromSave, type Outcome, type PlayContext } from './apply';
import { createDefaultSave, type SaveData, type Settings } from './schema';
import { browserStorage, clearSave, loadSave, writeSave, type LoadStatus } from './storage';

const storage = typeof window === 'undefined' ? null : browserStorage();
const initial = loadSave(storage, new Date());

let save: SaveData = initial.data;
let lastOutcome: Outcome | null = null;
let persistOk = storage !== null;
const listeners = new Set<() => void>();

export const loadStatus: LoadStatus = initial.status;

// Erfolge, die nach einer Migration bereits erfüllt sind, nachtragen.
const missing = newlyAchieved(factsFromSave(save), save.achievements);
if (missing.length > 0) {
  const today = toDayKey(new Date());
  save = {
    ...save,
    achievements: { ...save.achievements, ...Object.fromEntries(missing.map((id) => [id, today])) },
  };
}

if (
  missing.length > 0 ||
  initial.status === 'migriert' ||
  initial.status === 'repariert' ||
  initial.status === 'defekt'
) {
  persistOk = writeSave(storage, save);
}

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSave(): SaveData {
  return save;
}

export function updateSave(updater: (current: SaveData) => SaveData): void {
  save = updater(save);
  persistOk = writeSave(storage, save);
  emit();
}

export function useSave(): SaveData {
  return useSyncExternalStore(subscribe, getSave);
}

export function canPersist(): boolean {
  return persistOk;
}

export function updateSettings(patch: Partial<Settings>): void {
  updateSave((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function recordResult(result: GameResult, ctx: Omit<PlayContext, 'now'>): Outcome {
  const applied = applyResult(save, result, { ...ctx, now: new Date() });
  lastOutcome = applied.outcome;
  updateSave(() => applied.save);
  return applied.outcome;
}

export function getLastOutcome(): Outcome | null {
  return lastOutcome;
}

export function useLastOutcome(): Outcome | null {
  return useSyncExternalStore(subscribe, getLastOutcome);
}

export function resetProgress(): void {
  clearSave(storage);
  const keepSettings = save.settings;
  save = { ...createDefaultSave(new Date()), settings: keepSettings };
  lastOutcome = null;
  persistOk = writeSave(storage, save);
  emit();
}

/** Schließt das Onboarding ab und übernimmt – falls vorhanden – das Ergebnis des Einstufungstests. */
export function completeOnboarding(
  span: number | null,
  ratings?: Partial<Record<ModeId, number>>,
  memoryOffset = 0,
): void {
  updateSave((s) => {
    const adaptive = { ...s.adaptive };
    if (ratings) {
      for (const mode of MODE_IDS) {
        const rating = ratings[mode];
        if (rating === undefined) continue;
        const memory = MODE_SKILL[mode] === 'gedaechtnis';
        adaptive[mode] = {
          ...adaptive[mode],
          rating,
          offset: memory ? memoryOffset : adaptive[mode].offset,
        };
      }
    }
    return { ...s, onboardingDone: true, placementSpan: span, adaptive };
  });
}
