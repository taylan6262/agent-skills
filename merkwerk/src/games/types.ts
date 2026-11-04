import type { CategoryId, GameResult } from '../game/types';

export interface GameProps {
  difficulty: number;
  seed: number;
  paused: boolean;
  colorPatterns: boolean;
  category?: CategoryId;
  /** Wissensrunde: nur fällige Wiederholungen. */
  reviewOnly?: boolean;
  onFinish: (result: GameResult) => void;
  /** Fortschrittsanzeige im Spielkopf, z. B. „Runde 2 von 3“. */
  onProgress: (text: string) => void;
}
