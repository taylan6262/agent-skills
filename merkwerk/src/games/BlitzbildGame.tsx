import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  blitzbildParams,
  evaluateRound,
  generateRound,
  trayFor,
  type Board,
  type RoundEvaluation,
} from '../game/modes/blitzbild';
import { TOKENS, tokenLabel, type ShapeId } from '../game/symbols';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { Shape } from '../ui/Shape';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'ready' | 'show' | 'recall' | 'feedback';

const TOKEN_BY_SHAPE = new Map(TOKENS.map((t) => [t.shape, t]));

function tokenOf(shape: ShapeId) {
  return TOKEN_BY_SHAPE.get(shape) ?? { shape, color: 'tinte' as const };
}

export default function BlitzbildGame({
  difficulty,
  seed,
  paused,
  colorPatterns,
  onFinish,
  onProgress,
}: GameProps) {
  const params = useMemo(() => blitzbildParams(difficulty), [difficulty]);
  const rounds = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length: params.rounds }, () => generateRound(params, rng));
  }, [params, seed]);
  const cellCount = params.size * params.size;

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [answer, setAnswer] = useState<Board>(() =>
    new Array<ShapeId | null>(cellCount).fill(null),
  );
  const [selected, setSelected] = useState<ShapeId | null>(null);
  const [evaluations, setEvaluations] = useState<RoundEvaluation[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const elapsed = useActiveClock(paused);

  const round = rounds[roundIndex] ?? rounds[0];
  const tray = useMemo(() => (round ? trayFor(round.board) : new Map<ShapeId, number>()), [round]);
  const placed = answer.filter(Boolean).length;
  const evaluation = phase === 'feedback' ? evaluations[evaluations.length - 1] : undefined;

  const remainingOf = (shape: ShapeId): number =>
    (tray.get(shape) ?? 0) - answer.filter((a) => a === shape).length;

  useEffect(() => {
    onProgress(`Runde ${roundIndex + 1} von ${params.rounds}`);
  }, [roundIndex, params.rounds, onProgress]);

  usePausableTimeout(
    () => {
      setPhase('show');
      playSound('flip');
    },
    phase === 'ready' ? 900 : null,
    paused,
    `ready-${roundIndex}`,
  );

  usePausableTimeout(
    () => {
      setPhase('recall');
      playSound('flip');
      if (params.variant === 'formen') setSelected([...tray.keys()][0] ?? null);
      // Fokus ins Raster, damit Tastaturnutzer sofort loslegen können.
      window.setTimeout(() => cellRefs.current[focusIndex]?.focus(), 0);
    },
    phase === 'show' ? params.showMs : null,
    paused,
    `show-${roundIndex}`,
  );

  usePausableTimeout(
    () => advance(),
    phase === 'feedback' ? 2000 : null,
    paused,
    `fb-${roundIndex}`,
  );

  if (!round) return null;

  function finish(all: RoundEvaluation[]) {
    const total = all.reduce((sum, e) => sum + e.correct + e.missed, 0);
    const correct = all.reduce((sum, e) => sum + e.correct, 0);
    const performance = all.reduce((sum, e) => sum + e.accuracy, 0) / Math.max(1, all.length);
    const perfect = all.some((e) => e.perfect);
    onFinish({
      mode: 'blitzbild',
      difficulty,
      performance,
      score: all.reduce((sum, e) => sum + e.score, 0),
      correct,
      total,
      durationMs: elapsed(),
      metrics: perfect ? { perfectGrid: params.size } : {},
    });
  }

  function advance() {
    if (roundIndex + 1 >= params.rounds) {
      finish(evaluations);
      return;
    }
    setRoundIndex(roundIndex + 1);
    setAnswer(new Array<ShapeId | null>(cellCount).fill(null));
    setSelected(null);
    setPhase('ready');
  }

  function toggle(index: number) {
    if (phase !== 'recall') return;
    const current = answer[index] ?? null;
    const next = [...answer];
    if (current) {
      next[index] = null;
      if (params.variant === 'formen') setSelected(current);
    } else if (params.variant === 'positionen') {
      if (placed >= params.count) return;
      next[index] = 'quadrat';
    } else {
      if (!selected || remainingOf(selected) <= 0) return;
      next[index] = selected;
      if (remainingOf(selected) - 1 <= 0) {
        const other = [...tray.keys()].find(
          (s) => s !== selected && (tray.get(s) ?? 0) - next.filter((a) => a === s).length > 0,
        );
        setSelected(other ?? null);
      }
    }
    playSound('tap');
    setAnswer(next);
  }

  function check() {
    if (!round) return;
    const result = evaluateRound(round, answer, params.variant);
    setEvaluations([...evaluations, result]);
    setPhase('feedback');
    feedback(result.perfect ? 'correct' : 'wrong', roundIndex);
  }

  function onGridKey(event: KeyboardEvent<HTMLButtonElement>) {
    const size = params.size;
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: size,
      ArrowUp: -size,
    };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    let next = focusIndex + delta;
    if (event.key === 'ArrowRight' && focusIndex % size === size - 1) next = focusIndex;
    if (event.key === 'ArrowLeft' && focusIndex % size === 0) next = focusIndex;
    if (next < 0 || next >= cellCount) return;
    setFocusIndex(next);
    cellRefs.current[next]?.focus();
  }

  function onTrayKey(event: KeyboardEvent<HTMLButtonElement>) {
    const index = Number(event.key) - 1;
    const kinds = [...tray.keys()];
    const shape = kinds[index];
    if (shape && remainingOf(shape) > 0) setSelected(shape);
  }

  function cellLabel(index: number): string {
    const row = Math.floor(index / params.size) + 1;
    const col = (index % params.size) + 1;
    const position = `Zeile ${row}, Spalte ${col}`;
    const expected = round?.board[index] ?? null;
    const given = answer[index] ?? null;
    if (phase === 'show')
      return `${position}: ${expected ? tokenLabel(tokenOf(expected)) : 'leer'}`;
    if (phase === 'feedback') {
      if (expected && given === expected)
        return `${position}: richtig, ${tokenLabel(tokenOf(expected))}`;
      if (expected && params.variant === 'positionen' && given) return `${position}: richtig`;
      if (given) return `${position}: falsch`;
      if (expected) return `${position}: übersehen, hier war ${tokenLabel(tokenOf(expected))}`;
      return `${position}: leer`;
    }
    if (!given) return `${position}: leer`;
    return params.variant === 'positionen'
      ? `${position}: markiert`
      : `${position}: ${tokenLabel(tokenOf(given))}`;
  }

  const ready = placed === params.count;
  const instruction =
    phase === 'ready'
      ? 'Gleich geht’s los …'
      : phase === 'show'
        ? params.variant === 'positionen'
          ? 'Merke dir, wo die Quadrate liegen.'
          : 'Merke dir, welche Form wo liegt.'
        : phase === 'recall'
          ? params.variant === 'positionen'
            ? `Tippe die ${params.count} Felder an.`
            : 'Form wählen, dann Feld antippen.'
          : evaluation?.perfect
            ? 'Fehlerfrei!'
            : `${evaluation?.correct ?? 0} von ${params.count} richtig`;

  return (
    <div className="game blitzbild" data-phase={phase}>
      <p className="game-instruction" aria-live="polite">
        {instruction}
      </p>

      <div className="timer-track" aria-hidden="true">
        {phase === 'show' ? (
          <div
            className={`timer-bar ${paused ? 'is-paused' : ''}`}
            style={{ animationDuration: `${params.showMs}ms` }}
          />
        ) : null}
      </div>

      <div
        className={`board board-${params.size} ${phase === 'feedback' && evaluation && !evaluation.perfect ? 'shake' : ''}`}
        role="group"
        aria-label={`Raster ${params.size} mal ${params.size}`}
        style={{ gridTemplateColumns: `repeat(${params.size}, minmax(0, 1fr))` }}
      >
        {round.board.map((expected, index) => {
          const given = answer[index] ?? null;
          let content: ShapeId | null = null;
          let state = '';
          if (phase === 'show') content = expected;
          else if (phase === 'recall') content = given;
          else if (phase === 'feedback') {
            if (expected && (given === expected || (params.variant === 'positionen' && given))) {
              content = expected;
              state = 'cell-correct';
            } else if (given && !expected) {
              content = given;
              state = 'cell-wrong';
            } else if (expected) {
              content = expected;
              state = given ? 'cell-wrong cell-ghost' : 'cell-ghost';
            }
          }
          const token = content ? tokenOf(content) : null;
          return (
            <button
              key={index}
              ref={(el) => {
                cellRefs.current[index] = el;
              }}
              type="button"
              className={`cell ${state} ${content ? 'cell-filled' : ''}`}
              aria-label={cellLabel(index)}
              aria-pressed={phase === 'recall' ? Boolean(given) : undefined}
              disabled={phase !== 'recall'}
              tabIndex={index === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={onGridKey}
              onClick={() => toggle(index)}
            >
              {token ? (
                <Shape
                  shape={token.shape}
                  color={token.color}
                  patterned={colorPatterns}
                  className="cell-shape"
                />
              ) : null}
              {state.includes('cell-correct') ? (
                <span className="cell-badge badge-ok">
                  <Icon name="check" size={14} />
                </span>
              ) : null}
              {state.includes('cell-wrong') ? (
                <span className="cell-badge badge-bad">
                  <Icon name="close" size={14} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {phase === 'recall' && params.variant === 'formen' ? (
        <div className="tray" role="group" aria-label="Formen zum Ablegen (Tasten 1 bis 6)">
          {[...tray.keys()].map((shape, i) => {
            const left = remainingOf(shape);
            const token = tokenOf(shape);
            return (
              <button
                key={shape}
                type="button"
                className={`tray-item ${selected === shape ? 'is-selected' : ''}`}
                aria-pressed={selected === shape}
                aria-label={`${tokenLabel(token)}, noch ${left}, Taste ${i + 1}`}
                disabled={left <= 0}
                onKeyDown={onTrayKey}
                onClick={() => setSelected(shape)}
              >
                <Shape
                  shape={token.shape}
                  color={token.color}
                  patterned={colorPatterns}
                  size={34}
                />
                <span className="tray-count">×{left}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="game-actions">
        {phase === 'recall' ? (
          <>
            <p className="game-counter" aria-live="polite">
              {placed} / {params.count} gesetzt
            </p>
            <Button
              variant="primary"
              size="lg"
              block
              disabled={!ready}
              onClick={check}
              icon="check"
            >
              Prüfen
            </Button>
          </>
        ) : null}
        {phase === 'feedback' ? (
          <Button variant="secondary" size="lg" block onClick={advance} iconRight="arrow">
            {roundIndex + 1 >= params.rounds ? 'Zum Ergebnis' : 'Nächste Runde'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
