import type { PaletteColor } from '../game/levels';
import type { ShapeId } from '../game/symbols';
import type { CategoryId, ModeId, SkillId } from '../game/types';
import type { IconName } from './icons';

export interface ModeMeta {
  id: ModeId;
  name: string;
  short: string;
  skill: string;
  icon: IconName;
  shape: ShapeId;
  color: PaletteColor;
  howTo: string[];
}

export const MODE_META: Record<ModeId, ModeMeta> = {
  blitzbild: {
    id: 'blitzbild',
    name: 'Blitzbild',
    short: 'Raster kurz ansehen, dann aus dem Gedächtnis wiederherstellen.',
    skill: 'Visuelles Gedächtnis',
    icon: 'grid',
    shape: 'quadrat',
    color: 'blau',
    howTo: [
      'Ein Raster mit Formen wird kurz gezeigt.',
      'Danach ist es verdeckt: Tippe die Felder an, auf denen etwas lag.',
      'Ab Stufe 6 zählt auch die Form: erst Form wählen, dann Feld antippen.',
    ],
  },
  detailblick: {
    id: 'detailblick',
    name: 'Detailblick',
    short: 'Eine Szene genau ansehen und Fragen zu den Details beantworten.',
    skill: 'Visuelles Gedächtnis',
    icon: 'eye',
    shape: 'kreis',
    color: 'rot',
    howTo: [
      'Eine Komposition aus Formen erscheint für einige Sekunden.',
      'Präge dir Farben, Formen, Anzahl und Ecken ein.',
      'Danach beantwortest du Fragen zur Szene.',
    ],
  },
  zahlenspur: {
    id: 'zahlenspur',
    name: 'Zahlenspur',
    short: 'Ziffernfolgen merken und eingeben – später auch rückwärts.',
    skill: 'Arbeitsgedächtnis',
    icon: 'trail',
    shape: 'halbkreis',
    color: 'tinte',
    howTo: [
      'Ziffern erscheinen nacheinander.',
      'Gib die Folge danach ein – mit den Tasten oder der Tastatur.',
      'Steht „rückwärts“ da, gibst du die Folge von hinten ein.',
    ],
  },
  tempo: {
    id: 'tempo',
    name: 'Tempo-Duell',
    short: 'Schnelle Ja/Nein-Entscheidungen gegen die Uhr.',
    skill: 'Tempo',
    icon: 'bolt',
    shape: 'dreieck',
    color: 'gelb',
    howTo: [
      'Beantworte so viele Fragen wie möglich in 30 Sekunden.',
      'Ja = rechts (Taste J oder →), Nein = links (Taste F oder ←).',
      'Richtige Antworten in Serie erhöhen deinen Combo-Multiplikator.',
    ],
  },
  wissen: {
    id: 'wissen',
    name: 'Wissensrunde',
    short: 'Multiple Choice aus sechs Wissensgebieten – mit Wiederholung.',
    skill: 'Wissen',
    icon: 'book',
    shape: 'raute',
    color: 'rot',
    howTo: [
      'Wähle die richtige von vier Antworten.',
      'Nach jeder Frage gibt es eine kurze Erklärung.',
      'Falsch beantwortete Fragen kommen später wieder (Leitner-System).',
    ],
  },
};

export const SKILL_META: Record<
  SkillId,
  { name: string; description: string; color: PaletteColor; shape: ShapeId }
> = {
  gedaechtnis: {
    name: 'Gedächtnis',
    description: 'Blitzbild, Detailblick, Zahlenspur',
    color: 'blau',
    shape: 'quadrat',
  },
  tempo: { name: 'Tempo', description: 'Tempo-Duell', color: 'rot', shape: 'dreieck' },
  lernen: {
    name: 'Lernen',
    description: 'Lernstand im Leitner-System',
    color: 'tinte',
    shape: 'raute',
  },
  wissen: { name: 'Wissen', description: 'Trefferquote nach Stufe', color: 'gelb', shape: 'kreis' },
};

export const CATEGORY_META: Record<CategoryId, { name: string; icon: IconName }> = {
  geografie: { name: 'Geografie', icon: 'globe' },
  natur: { name: 'Natur', icon: 'leaf' },
  wissenschaft: { name: 'Wissenschaft', icon: 'flask' },
  geschichte: { name: 'Geschichte', icon: 'column' },
  sprache: { name: 'Sprache', icon: 'speech' },
  mathe: { name: 'Mathe', icon: 'sigma' },
};
