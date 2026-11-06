import { clamp } from '../../lib/math';
import type { Rng } from '../../lib/rng';
import type { PaletteColor } from '../levels';
import {
  COLOR_NAMES,
  SHAPES,
  colorPluralAdjective,
  definiteBigShape,
  indefiniteColorShape,
  type ShapeId,
} from '../symbols';

export const SCENE_SHAPES: readonly ShapeId[] = [
  'kreis',
  'quadrat',
  'dreieck',
  'raute',
  'halbkreis',
];
export const SCENE_COLORS: readonly PaletteColor[] = ['rot', 'blau', 'gelb', 'tinte'];

export interface DetailblickParams {
  cols: number;
  rows: number;
  count: number;
  showMs: number;
  questions: number;
  scenes: number;
}

export function detailblickParams(difficulty: number): DetailblickParams {
  const d = clamp(Math.round(difficulty), 1, 20);
  let cols = 3;
  let rows = 3;
  let count = 4 + Math.floor((d - 1) / 2);
  if (d > 12) {
    cols = 4;
    rows = 4;
    count = 9 + Math.floor((d - 13) / 2);
  } else if (d > 5) {
    cols = 4;
    rows = 3;
    count = 6 + Math.floor((d - 6) / 2);
  }
  return {
    cols,
    rows,
    count: Math.min(count, cols * rows - 1),
    showMs: Math.round(9000 - (d - 1) * 260),
    questions: d <= 4 ? 3 : d <= 12 ? 4 : 5,
    scenes: 2,
  };
}

export interface SceneObject {
  cell: number;
  col: number;
  row: number;
  shape: ShapeId;
  color: PaletteColor;
  big: boolean;
  /** Versatz innerhalb der Zelle (−0.12 … 0.12), damit die Szene nicht wie ein Raster wirkt. */
  dx: number;
  dy: number;
}

export interface Scene {
  cols: number;
  rows: number;
  objects: SceneObject[];
}

export type Corner = 'lo' | 'ro' | 'lu' | 'ru';
export const CORNER_LABEL: Record<Corner, string> = {
  lo: 'links oben',
  ro: 'rechts oben',
  lu: 'links unten',
  ru: 'rechts unten',
};

function cornerCells(cols: number, rows: number): Record<Corner, number> {
  return { lo: 0, ro: cols - 1, lu: (rows - 1) * cols, ru: rows * cols - 1 };
}

export function generateScene(params: DetailblickParams, rng: Rng): Scene {
  const { cols, rows } = params;
  const corners = Object.values(cornerCells(cols, rows));
  const others = rng.shuffle(
    Array.from({ length: cols * rows }, (_, i) => i).filter((i) => !corners.includes(i)),
  );
  // Alle vier Ecken sind belegt, damit Fragen nach Ecken immer eindeutig beantwortbar sind.
  const cells = [...corners, ...others].slice(0, Math.max(params.count, 4));
  const objects = cells.map<SceneObject>((cell) => ({
    cell,
    col: cell % cols,
    row: Math.floor(cell / cols),
    shape: rng.pick(SCENE_SHAPES),
    color: rng.pick(SCENE_COLORS),
    big: rng.chance(0.4),
    dx: (rng.next() - 0.5) * 0.24,
    dy: (rng.next() - 0.5) * 0.24,
  }));
  return { cols, rows, objects: objects.sort((a, b) => a.cell - b.cell) };
}

export interface SceneQuestion {
  kind: 'anzahlFarbe' | 'anzahlForm' | 'eckeForm' | 'eckeFarbe' | 'gesehen' | 'grossFarbe';
  text: string;
  options: string[];
  correctIndex: number;
}

function countOptions(correct: number, rng: Rng): { options: string[]; correctIndex: number } {
  const set = new Set<number>([correct]);
  const deltas = rng.shuffle([-2, -1, 1, 2, 3]);
  for (const d of deltas) {
    if (set.size >= 4) break;
    const value = correct + d;
    if (value >= 0) set.add(value);
  }
  const values = [...set].sort((a, b) => a - b);
  return { options: values.map(String), correctIndex: values.indexOf(correct) };
}

function choiceOptions<T>(correct: T, all: readonly T[], label: (v: T) => string, rng: Rng) {
  const distractors = rng.shuffle(all.filter((v) => v !== correct)).slice(0, 3);
  const values = rng.shuffle([correct, ...distractors]);
  return { options: values.map(label), correctIndex: values.indexOf(correct) };
}

function cornerObject(scene: Scene, corner: Corner): SceneObject | undefined {
  const cell = cornerCells(scene.cols, scene.rows)[corner];
  return scene.objects.find((o) => o.cell === cell);
}

/** Erzeugt eindeutige Fragen zur Szene; Fragetypen werden möglichst abwechslungsreich gemischt. */
export function generateQuestions(scene: Scene, amount: number, rng: Rng): SceneQuestion[] {
  const makers: (() => SceneQuestion | null)[] = [
    () => {
      const color = rng.pick(SCENE_COLORS);
      const n = scene.objects.filter((o) => o.color === color).length;
      return {
        kind: 'anzahlFarbe',
        text: `Wie viele ${colorPluralAdjective(color)} Formen waren zu sehen?`,
        ...countOptions(n, rng),
      };
    },
    () => {
      const shape = rng.pick(SCENE_SHAPES);
      const n = scene.objects.filter((o) => o.shape === shape).length;
      return {
        kind: 'anzahlForm',
        text: `Wie viele ${SHAPES[shape].plural} waren zu sehen?`,
        ...countOptions(n, rng),
      };
    },
    () => {
      const corner = rng.pick(Object.keys(CORNER_LABEL) as Corner[]);
      const obj = cornerObject(scene, corner);
      if (!obj) return null;
      return {
        kind: 'eckeForm',
        text: `Welche Form war in der Ecke ${CORNER_LABEL[corner]}?`,
        ...choiceOptions(obj.shape, SCENE_SHAPES, (s) => SHAPES[s].name, rng),
      };
    },
    () => {
      const corner = rng.pick(Object.keys(CORNER_LABEL) as Corner[]);
      const obj = cornerObject(scene, corner);
      if (!obj) return null;
      const values = [...SCENE_COLORS];
      return {
        kind: 'eckeFarbe',
        text: `Welche Farbe hatte die Form in der Ecke ${CORNER_LABEL[corner]}?`,
        options: values.map((c) => COLOR_NAMES[c]),
        correctIndex: values.indexOf(obj.color),
      };
    },
    () => {
      const present = rng.chance(0.5);
      let shape: ShapeId;
      let color: PaletteColor;
      if (present) {
        const obj = rng.pick(scene.objects);
        shape = obj.shape;
        color = obj.color;
      } else {
        const absent: [ShapeId, PaletteColor][] = [];
        for (const s of SCENE_SHAPES)
          for (const c of SCENE_COLORS)
            if (!scene.objects.some((o) => o.shape === s && o.color === c)) absent.push([s, c]);
        if (absent.length === 0) return null;
        [shape, color] = rng.pick(absent);
      }
      return {
        kind: 'gesehen',
        text: `War ${indefiniteColorShape(color, shape)} zu sehen?`,
        options: ['Ja', 'Nein'],
        correctIndex: present ? 0 : 1,
      };
    },
    () => {
      const uniqueBig = SCENE_SHAPES.filter(
        (s) => scene.objects.filter((o) => o.shape === s && o.big).length === 1,
      );
      if (uniqueBig.length === 0) return null;
      const shape = rng.pick(uniqueBig);
      const obj = scene.objects.find((o) => o.shape === shape && o.big);
      if (!obj) return null;
      const name = definiteBigShape(shape);
      const values = [...SCENE_COLORS];
      return {
        kind: 'grossFarbe',
        text: `Welche Farbe hatte ${name}?`,
        options: values.map((c) => COLOR_NAMES[c]),
        correctIndex: values.indexOf(obj.color),
      };
    },
  ];

  const questions: SceneQuestion[] = [];
  const texts = new Set<string>();
  const usedKinds = new Set<SceneQuestion['kind']>();
  for (let attempt = 0; attempt < 60 && questions.length < amount; attempt++) {
    const order = rng.shuffle(makers);
    for (const make of order) {
      if (questions.length >= amount) break;
      const q = make();
      if (!q || texts.has(q.text)) continue;
      // Erst jede Frageart einmal, danach Wiederholungen erlaubt.
      if (usedKinds.has(q.kind) && usedKinds.size < makers.length && attempt < 20) continue;
      texts.add(q.text);
      usedKinds.add(q.kind);
      questions.push(q);
    }
  }
  return questions;
}
