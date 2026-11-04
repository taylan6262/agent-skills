import type { PaletteColor } from './levels';

export type ShapeId =
  | 'kreis'
  | 'quadrat'
  | 'dreieck'
  | 'halbkreis'
  | 'raute'
  | 'ring'
  | 'kreuz'
  | 'viertel';

export type Gender = 'm' | 'n' | 'f';

export interface ShapeInfo {
  id: ShapeId;
  name: string;
  plural: string;
  gender: Gender;
}

export const SHAPES: Record<ShapeId, ShapeInfo> = {
  kreis: { id: 'kreis', name: 'Kreis', plural: 'Kreise', gender: 'm' },
  quadrat: { id: 'quadrat', name: 'Quadrat', plural: 'Quadrate', gender: 'n' },
  dreieck: { id: 'dreieck', name: 'Dreieck', plural: 'Dreiecke', gender: 'n' },
  halbkreis: { id: 'halbkreis', name: 'Halbkreis', plural: 'Halbkreise', gender: 'm' },
  raute: { id: 'raute', name: 'Raute', plural: 'Rauten', gender: 'f' },
  ring: { id: 'ring', name: 'Ring', plural: 'Ringe', gender: 'm' },
  kreuz: { id: 'kreuz', name: 'Kreuz', plural: 'Kreuze', gender: 'n' },
  viertel: { id: 'viertel', name: 'Viertelkreis', plural: 'Viertelkreise', gender: 'm' },
};

export type InkColor = Exclude<PaletteColor, never>;

export const COLOR_NAMES: Record<PaletteColor, string> = {
  rot: 'Rot',
  blau: 'Blau',
  gelb: 'Gelb',
  tinte: 'Schwarz',
};

const COLOR_STEM: Record<PaletteColor, string> = {
  rot: 'rot',
  blau: 'blau',
  gelb: 'gelb',
  tinte: 'schwarz',
};

const STRONG_ENDING: Record<Gender, string> = { m: 'er', n: 'es', f: 'e' };
const INDEFINITE: Record<Gender, string> = { m: 'ein', n: 'ein', f: 'eine' };
const DEFINITE: Record<Gender, string> = { m: 'der', n: 'das', f: 'die' };

/** „roter Kreis“, „blaues Quadrat“, „gelbe Raute“ (Nominativ ohne Artikel/mit unbestimmtem Artikel). */
export function colorShapeLabel(color: PaletteColor, shape: ShapeId): string {
  const info = SHAPES[shape];
  return `${COLOR_STEM[color]}${STRONG_ENDING[info.gender]} ${info.name}`;
}

/** „ein roter Kreis“, „eine gelbe Raute“. */
export function indefiniteColorShape(color: PaletteColor, shape: ShapeId): string {
  return `${INDEFINITE[SHAPES[shape].gender]} ${colorShapeLabel(color, shape)}`;
}

/** „der große Kreis“, „die große Raute“. */
export function definiteBigShape(shape: ShapeId): string {
  const info = SHAPES[shape];
  return `${DEFINITE[info.gender]} große ${info.name}`;
}

/** „rote“, „blaue“ … für Plural ohne Artikel. */
export function colorPluralAdjective(color: PaletteColor): string {
  return `${COLOR_STEM[color]}e`;
}

/** Spielsteine für Blitzbild und Tempo-Duell: Jede Form hat eine feste Farbe, unterscheidbar allein über die Form. */
export interface Token {
  shape: ShapeId;
  color: PaletteColor;
}

export const TOKENS: readonly Token[] = [
  { shape: 'kreis', color: 'rot' },
  { shape: 'quadrat', color: 'blau' },
  { shape: 'dreieck', color: 'gelb' },
  { shape: 'halbkreis', color: 'tinte' },
  { shape: 'raute', color: 'rot' },
  { shape: 'ring', color: 'blau' },
  { shape: 'kreuz', color: 'tinte' },
  { shape: 'viertel', color: 'gelb' },
];

export function tokenLabel(token: Token): string {
  return colorShapeLabel(token.color, token.shape);
}
