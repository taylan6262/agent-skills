import { blitzbildParams } from '../game/modes/blitzbild';
import { detailblickParams } from '../game/modes/detailblick';
import { tempoParams } from '../game/modes/tempo';
import { wissenParams } from '../game/modes/wissen';
import { zahlenspurParams } from '../game/modes/zahlenspur';
import type { CategoryId, ModeId } from '../game/types';
import { createRng } from '../lib/rng';
import { CATEGORY_META } from './meta';

const seconds = (ms: number): string =>
  `${(ms / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} s`;

const DIFFICULTY_NAMES = { 1: 'leicht', 2: 'mittel', 3: 'schwer' } as const;

/** Kurzbeschreibung der Parameter einer Stufe für Level-Intro und Training. */
export function describeParams(mode: ModeId, difficulty: number, category?: CategoryId): string[] {
  switch (mode) {
    case 'blitzbild': {
      const p = blitzbildParams(difficulty);
      return [
        `${p.size} × ${p.size} Raster, ${p.count} Formen`,
        `${seconds(p.showMs)} zum Einprägen`,
        p.variant === 'positionen'
          ? 'Nur die Positionen zählen'
          : `Positionen und ${p.kinds} verschiedene Formen`,
        `${p.rounds} Runden`,
      ];
    }
    case 'detailblick': {
      const p = detailblickParams(difficulty);
      return [
        `${p.scenes} Szenen mit je ${p.count} Formen`,
        `${seconds(p.showMs)} zum Einprägen`,
        `${p.questions} Fragen pro Szene`,
      ];
    }
    case 'zahlenspur': {
      const p = zahlenspurParams(difficulty);
      return [
        `${p.trials} Folgen, Start mit ${p.startLength} Ziffern`,
        `${seconds(p.digitMs)} pro Ziffer`,
        p.backwardsChance > 0 ? 'Manche Folgen rückwärts eingeben' : 'Alle Folgen vorwärts',
      ];
    }
    case 'tempo': {
      const p = tempoParams(difficulty, createRng(1));
      return [
        `${p.durationMs / 1000} Sekunden gegen die Uhr`,
        `Ziel: ${p.target} richtige Antworten`,
        p.kinds.length === 1 ? 'Ein Aufgabentyp' : `${p.kinds.length} Aufgabentypen im Wechsel`,
        p.trialLimitMs
          ? `Höchstens ${seconds(p.trialLimitMs)} pro Antwort`
          : 'Ohne Zeitlimit pro Antwort',
      ];
    }
    case 'wissen': {
      const p = wissenParams(difficulty);
      const range =
        p.minDifficulty === p.maxDifficulty
          ? DIFFICULTY_NAMES[p.minDifficulty]
          : `${DIFFICULTY_NAMES[p.minDifficulty]} bis ${DIFFICULTY_NAMES[p.maxDifficulty]}`;
      return [
        `${p.count} Fragen${category ? ` aus ${CATEGORY_META[category].name}` : ' gemischt'}`,
        `Schwierigkeit ${range}`,
        p.timeLimitMs ? `${seconds(p.timeLimitMs)} pro Frage` : 'Ohne Zeitlimit',
      ];
    }
  }
}
