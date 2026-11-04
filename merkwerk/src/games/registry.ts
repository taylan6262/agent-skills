import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ModeId } from '../game/types';
import type { GameProps } from './types';

export const GAMES: Record<ModeId, LazyExoticComponent<ComponentType<GameProps>>> = {
  blitzbild: lazy(() => import('./BlitzbildGame')),
  detailblick: lazy(() => import('./DetailblickGame')),
  zahlenspur: lazy(() => import('./ZahlenspurGame')),
  tempo: lazy(() => import('./TempoGame')),
  wissen: lazy(() => import('./WissenGame')),
};
