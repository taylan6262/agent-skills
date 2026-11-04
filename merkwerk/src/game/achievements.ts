import type { PaletteColor } from './levels';
import type { ShapeId } from './symbols';

/** Kennzahlen, aus denen Erfolge abgeleitet werden (unabhängig vom Speicherformat). */
export interface AchievementFacts {
  levelsPassed: number;
  levelsThreeStars: number;
  totalStars: number;
  completedWorlds: readonly number[];
  bestStreak: number;
  dailyCount: number;
  perfectGrid: number;
  perfectScenes: number;
  spanForward: number;
  spanBackward: number;
  tempoCombo: number;
  questionsAnswered: number;
  mastered: number;
  reviewsCorrect: number;
  modesPlayed: number;
  playerLevel: number;
  gamesPlayed: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  shape: ShapeId;
  color: PaletteColor;
  /** Fortschritt als [aktuell, Ziel] für die Anzeige. */
  progress: (f: AchievementFacts) => [number, number];
}

function goal(get: (f: AchievementFacts) => number, target: number) {
  return (f: AchievementFacts): [number, number] => [Math.min(get(f), target), target];
}

function world(id: number) {
  return (f: AchievementFacts): [number, number] => [f.completedWorlds.includes(id) ? 1 : 0, 1];
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'erster-schritt', title: 'Erster Schritt', description: 'Schließe dein erstes Level ab.', shape: 'kreis', color: 'rot', progress: goal((f) => f.levelsPassed, 1) },
  { id: 'dreifach', title: 'Dreifach', description: 'Hol dir zum ersten Mal 3 Sterne in einem Level.', shape: 'dreieck', color: 'gelb', progress: goal((f) => f.levelsThreeStars, 1) },
  { id: 'perfektionist', title: 'Perfektionist', description: 'Erreiche in 12 Leveln 3 Sterne.', shape: 'dreieck', color: 'rot', progress: goal((f) => f.levelsThreeStars, 12) },
  { id: 'sternsammler', title: 'Sternsammler', description: 'Sammle 50 Sterne.', shape: 'raute', color: 'gelb', progress: goal((f) => f.totalStars, 50) },
  { id: 'sternenhimmel', title: 'Sternenhimmel', description: 'Sammle 150 Sterne.', shape: 'raute', color: 'blau', progress: goal((f) => f.totalStars, 150) },
  { id: 'welt-punkt', title: 'Punktlandung', description: 'Bestehe alle Level der Welt „Punkt“.', shape: 'kreis', color: 'rot', progress: world(1) },
  { id: 'welt-linie', title: 'Linientreu', description: 'Bestehe alle Level der Welt „Linie“.', shape: 'quadrat', color: 'blau', progress: world(2) },
  { id: 'welt-flaeche', title: 'Flächendeckend', description: 'Bestehe alle Level der Welt „Fläche“.', shape: 'quadrat', color: 'gelb', progress: world(3) },
  { id: 'welt-raum', title: 'Raumgreifend', description: 'Bestehe alle Level der Welt „Raum“.', shape: 'halbkreis', color: 'tinte', progress: world(4) },
  { id: 'welt-rhythmus', title: 'Taktgefühl', description: 'Bestehe alle Level der Welt „Rhythmus“.', shape: 'viertel', color: 'rot', progress: world(5) },
  { id: 'welt-komposition', title: 'Meisterstück', description: 'Bestehe alle Level der Welt „Komposition“.', shape: 'ring', color: 'blau', progress: world(6) },
  { id: 'serie-3', title: 'Dranbleiben', description: 'Spiele an 3 Tagen in Folge.', shape: 'viertel', color: 'gelb', progress: goal((f) => f.bestStreak, 3) },
  { id: 'serie-7', title: 'Wochenwerk', description: 'Spiele an 7 Tagen in Folge.', shape: 'viertel', color: 'blau', progress: goal((f) => f.bestStreak, 7) },
  { id: 'serie-30', title: 'Monatswerk', description: 'Spiele an 30 Tagen in Folge.', shape: 'viertel', color: 'rot', progress: goal((f) => f.bestStreak, 30) },
  { id: 'tagwerk', title: 'Tagwerk', description: 'Schließe deine erste Tagesaufgabe ab.', shape: 'quadrat', color: 'rot', progress: goal((f) => f.dailyCount, 1) },
  { id: 'pflichtbewusst', title: 'Pflichtbewusst', description: 'Schließe 10 Tagesaufgaben ab.', shape: 'quadrat', color: 'tinte', progress: goal((f) => f.dailyCount, 10) },
  { id: 'im-fluss', title: 'Im Fluss', description: 'Erreiche eine Combo von 15 im Tempo-Duell.', shape: 'dreieck', color: 'gelb', progress: goal((f) => f.tempoCombo, 15) },
  { id: 'blitzmerker', title: 'Blitzmerker', description: 'Löse ein Blitzbild mit 5×5-Raster fehlerfrei.', shape: 'quadrat', color: 'blau', progress: goal((f) => f.perfectGrid, 5) },
  { id: 'adlerauge', title: 'Adlerauge', description: 'Beantworte alle Fragen zu 5 Detailblick-Szenen richtig.', shape: 'kreis', color: 'blau', progress: goal((f) => f.perfectScenes, 5) },
  { id: 'zahlenmensch', title: 'Zahlenmensch', description: 'Merke dir 7 Ziffern vorwärts in der Zahlenspur.', shape: 'halbkreis', color: 'rot', progress: goal((f) => f.spanForward, 7) },
  { id: 'rueckwaertsgang', title: 'Rückwärtsgang', description: 'Gib 5 Ziffern rückwärts richtig ein.', shape: 'halbkreis', color: 'blau', progress: goal((f) => f.spanBackward, 5) },
  { id: 'wissensdurst', title: 'Wissensdurst', description: 'Beantworte 100 Wissensfragen.', shape: 'raute', color: 'rot', progress: goal((f) => f.questionsAnswered, 100) },
  { id: 'gut-gelernt', title: 'Gut gelernt', description: 'Bringe 25 Fragen in Fach 4 oder höher.', shape: 'ring', color: 'rot', progress: goal((f) => f.mastered, 25) },
  { id: 'aus-fehlern', title: 'Aus Fehlern gelernt', description: 'Beantworte 10 zuvor falsch beantwortete Fragen später richtig.', shape: 'kreuz', color: 'tinte', progress: goal((f) => f.reviewsCorrect, 10) },
  { id: 'allrounder', title: 'Allrounder', description: 'Spiele jeden der fünf Modi mindestens einmal.', shape: 'kreuz', color: 'rot', progress: goal((f) => f.modesPlayed, 5) },
  { id: 'aufsteiger', title: 'Aufsteiger', description: 'Erreiche Spielerlevel 10.', shape: 'dreieck', color: 'blau', progress: goal((f) => f.playerLevel, 10) },
  { id: 'ausdauer', title: 'Ausdauer', description: 'Spiele 100 Runden.', shape: 'ring', color: 'gelb', progress: goal((f) => f.gamesPlayed, 100) },
];

export function isAchieved(def: AchievementDef, facts: AchievementFacts): boolean {
  const [current, target] = def.progress(facts);
  return current >= target;
}

/** IDs der Erfolge, die mit diesen Kennzahlen neu erreicht sind. */
export function newlyAchieved(facts: AchievementFacts, unlocked: Readonly<Record<string, unknown>>): string[] {
  return ACHIEVEMENTS.filter((def) => unlocked[def.id] === undefined && isAchieved(def, facts)).map((def) => def.id);
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((def) => def.id === id);
}
