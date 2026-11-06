import { CATEGORY_IDS, type CategoryId, type ModeId, type Stars } from './types';

export type PaletteColor = 'rot' | 'blau' | 'gelb' | 'tinte';

export interface World {
  id: number;
  name: string;
  subtitle: string;
  /** Benötigte Gesamtsterne zum Freischalten. */
  requiredStars: number;
  color: PaletteColor;
}

export interface LevelDef {
  id: string;
  world: number;
  /** Position in der Welt, 1–12. */
  index: number;
  /** Fortlaufende Nummer über alle Welten, 1–72. */
  number: number;
  mode: ModeId;
  baseDifficulty: number;
  /** Letztes Level einer Welt – das „Meisterstück“. */
  master: boolean;
  category?: CategoryId;
}

export const LEVELS_PER_WORLD = 12;

export const WORLDS: readonly World[] = [
  {
    id: 1,
    name: 'Punkt',
    subtitle: 'Der Anfang: kleine Raster, viel Zeit.',
    requiredStars: 0,
    color: 'rot',
  },
  {
    id: 2,
    name: 'Linie',
    subtitle: 'Folgen werden länger, Bilder kürzer.',
    requiredStars: 20,
    color: 'blau',
  },
  {
    id: 3,
    name: 'Fläche',
    subtitle: 'Größere Raster, mehr Details.',
    requiredStars: 45,
    color: 'gelb',
  },
  {
    id: 4,
    name: 'Raum',
    subtitle: 'Rückwärts denken, schneller entscheiden.',
    requiredStars: 70,
    color: 'tinte',
  },
  {
    id: 5,
    name: 'Rhythmus',
    subtitle: 'Tempo und Wechsel im Takt.',
    requiredStars: 95,
    color: 'rot',
  },
  {
    id: 6,
    name: 'Komposition',
    subtitle: 'Alles zusammen – das Meisterstück.',
    requiredStars: 120,
    color: 'blau',
  },
];

/**
 * Reihenfolge, in der die Modi in Welt 1 eingeführt werden; spätere Welten verschieben sie um drei
 * Plätze. Bei 12 Leveln und 8 Modi kommt in jeder Welt jeder Modus mindestens einmal vor.
 */
const MODE_ORDER: readonly ModeId[] = [
  'blitzbild',
  'zahlenspur',
  'tempo',
  'wissen',
  'detailblick',
  'wegmarken',
  'rechenwaage',
  'zeitleiste',
];

function buildLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  let wissenCount = 0;
  for (const world of WORLDS) {
    for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
      const mode = MODE_ORDER[(index - 1 + (world.id - 1) * 3) % MODE_ORDER.length] as ModeId;
      const master = index === LEVELS_PER_WORLD;
      const baseDifficulty =
        1 + (world.id - 1) * 3 + Math.floor((index - 1) / 4) + (master ? 1 : 0);
      const level: LevelDef = {
        id: `w${world.id}-${index}`,
        world: world.id,
        index,
        number: (world.id - 1) * LEVELS_PER_WORLD + index,
        mode,
        baseDifficulty,
        master,
      };
      if (mode === 'wissen') {
        const category = CATEGORY_IDS[wissenCount % CATEGORY_IDS.length];
        if (category) level.category = category;
        wissenCount += 1;
      }
      levels.push(level);
    }
  }
  return levels;
}

export const LEVELS: readonly LevelDef[] = buildLevels();

const LEVEL_BY_ID = new Map(LEVELS.map((level) => [level.id, level]));

export function getLevel(id: string): LevelDef | undefined {
  return LEVEL_BY_ID.get(id);
}

export function getWorld(id: number): World | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function levelsOfWorld(worldId: number): LevelDef[] {
  return LEVELS.filter((level) => level.world === worldId);
}

export function nextLevel(id: string): LevelDef | undefined {
  const level = getLevel(id);
  if (!level) return undefined;
  return LEVELS[level.number];
}

export interface LevelStarsSource {
  [levelId: string]: { stars: Stars } | undefined;
}

export function starsOf(levels: LevelStarsSource, levelId: string): Stars {
  return levels[levelId]?.stars ?? 0;
}

export function totalStars(levels: LevelStarsSource): number {
  let sum = 0;
  for (const level of LEVELS) sum += starsOf(levels, level.id);
  return sum;
}

export function worldStars(levels: LevelStarsSource, worldId: number): number {
  return levelsOfWorld(worldId).reduce((sum, level) => sum + starsOf(levels, level.id), 0);
}

export function isWorldUnlocked(worldId: number, levels: LevelStarsSource): boolean {
  const world = getWorld(worldId);
  if (!world) return false;
  return totalStars(levels) >= world.requiredStars;
}

export function isWorldComplete(worldId: number, levels: LevelStarsSource): boolean {
  return levelsOfWorld(worldId).every((level) => starsOf(levels, level.id) > 0);
}

/** Ein Level ist offen, wenn seine Welt offen ist und das vorige Level der Welt mindestens 1 Stern hat. */
export function isLevelUnlocked(levelId: string, levels: LevelStarsSource): boolean {
  const level = getLevel(levelId);
  if (!level || !isWorldUnlocked(level.world, levels)) return false;
  if (level.index === 1) return true;
  return starsOf(levels, `w${level.world}-${level.index - 1}`) > 0;
}

/**
 * Das Level für „Weiterspielen“: das erste offene, noch nicht bestandene Level.
 * Sind alle offenen Level bestanden, das erste offene Level ohne 3 Sterne.
 */
export function continueLevel(levels: LevelStarsSource): LevelDef {
  const unlocked = LEVELS.filter((level) => isLevelUnlocked(level.id, levels));
  const open = unlocked.find((level) => starsOf(levels, level.id) === 0);
  if (open) return open;
  const improvable = unlocked.find((level) => starsOf(levels, level.id) < 3);
  return improvable ?? unlocked[unlocked.length - 1] ?? (LEVELS[0] as LevelDef);
}
