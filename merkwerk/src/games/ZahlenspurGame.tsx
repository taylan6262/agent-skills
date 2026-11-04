import type { GameProps } from './types';
export default function ZahlenspurGame(props: GameProps) {
  return <button type="button" onClick={() => props.onFinish({ mode: 'blitzbild', difficulty: 1, performance: 1, score: 0, correct: 0, total: 0, durationMs: 0, metrics: {} })}>Platzhalter</button>;
}
