import { isObj } from './schema';

type Raw = Record<string, unknown>;

/**
 * Migrationen von Version n auf n + 1. Jede Migration bekommt die Rohdaten der alten Version
 * und gibt Rohdaten der nächsten Version zurück; die Feinprüfung übernimmt danach `sanitizeSave`.
 *
 * Version 1 (Vorabversion): Sterne als `stars: { levelId: number }`, XP als `xp`,
 * Serie als `streak: { current, best, last }`, Leitner-Karten nur mit `box` und `due`.
 */
export const MIGRATIONS: Record<number, (data: Raw) => Raw> = {
  1: (data) => {
    const stars = isObj(data.stars) ? data.stars : {};
    const levels: Raw = {};
    for (const [id, value] of Object.entries(stars)) {
      const s = typeof value === 'number' ? value : 0;
      levels[id] = { stars: s, bestScore: 0, bestPerformance: 0, plays: s > 0 ? 1 : 0 };
    }
    const streak = isObj(data.streak) ? data.streak : {};
    const oldCards = isObj(data.leitner) ? data.leitner : {};
    const leitner: Raw = {};
    for (const [id, card] of Object.entries(oldCards)) {
      if (!isObj(card)) continue;
      const box = typeof card.box === 'number' ? card.box : 1;
      leitner[id] = {
        box,
        due: card.due,
        seen: 1,
        correct: box > 1 ? 1 : 0,
        wrong: box === 1 ? 1 : 0,
      };
    }
    const settings = isObj(data.settings) ? data.settings : {};
    return {
      version: 2,
      createdAt: data.createdAt,
      onboardingDone: data.onboarded === true,
      settings: { ...settings, colorPatterns: false },
      player: { xp: data.xp, gamesPlayed: 0, playTimeMs: 0 },
      levels,
      streak: { current: streak.current, best: streak.best, lastActiveDay: streak.last },
      leitner,
    };
  },
};

export interface MigrationResult {
  data: Raw;
  migrated: boolean;
  fromVersion: number;
}

export function migrate(input: Raw, targetVersion: number): MigrationResult {
  const fromVersion =
    typeof input.version === 'number' && Number.isInteger(input.version) ? input.version : 1;
  let data = input;
  let version = fromVersion;
  while (version < targetVersion) {
    const step = MIGRATIONS[version];
    if (!step) break;
    data = step(data);
    version += 1;
  }
  return { data, migrated: fromVersion < targetVersion, fromVersion };
}
