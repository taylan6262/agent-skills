import { blitzbildParams } from '../game/modes/blitzbild';
import { detailblickParams } from '../game/modes/detailblick';
import { tempoParams } from '../game/modes/tempo';
import { wissenParams } from '../game/modes/wissen';
import { zahlenspurParams } from '../game/modes/zahlenspur';
import { wegmarkenParams } from '../game/modes/wegmarken';
import { rechenwaageParams } from '../game/modes/rechenwaage';
import { zeitleisteParams } from '../game/modes/zeitleiste';
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
    case 'wegmarken': {
      const p = wegmarkenParams(difficulty);
      return [
        `${p.size} × ${p.size} Raster, ${p.trials} Wege`,
        `Start mit ${p.startLength} Wegmarken`,
        `${seconds(p.stepMs)} pro Schritt`,
        p.backwardsChance > 0 ? 'Manche Wege rückwärts nachgehen' : 'Alle Wege vorwärts',
      ];
    }
    case 'rechenwaage': {
      const p = rechenwaageParams(difficulty);
      const ops = [
        'Plus',
        'Plus und Minus',
        'Plus und Mal',
        'Minus, Mal und Geteilt',
        'Zweistufige Rechnungen',
      ];
      return [
        `${p.durationMs / 1000} Sekunden gegen die Uhr`,
        `Ziel: ${p.target} richtige Antworten`,
        ops[p.tier - 1] ?? '',
      ];
    }
    case 'zeitleiste': {
      const p = zeitleisteParams(difficulty);
      return [
        `${p.rounds} Runden mit je ${p.count} Ereignissen`,
        p.minGap >= 100
          ? 'Ereignisse liegen weit auseinander'
          : `Mindestens ${p.minGap} Jahre Abstand`,
      ];
    }
  }
}
