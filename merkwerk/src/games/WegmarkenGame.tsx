import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  evaluatePath,
  generatePath,
  nextPathLength,
  pathDirection,
  wegmarkenParams,
} from '../game/modes/wegmarken';
import type { Direction, TrialEvaluation } from '../game/modes/zahlenspur';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'ready' | 'show' | 'input' | 'feedback';

interface Trial {
  path: number[];
  direction: Direction;
}

type Evaluation = TrialEvaluation & { length: number };

export default function WegmarkenGame({
  difficulty,
  seed,
  paused,
  onFinish,
  onProgress,
}: GameProps) {
  const params = useMemo(() => wegmarkenParams(difficulty), [difficulty]);
  const trialSeeds = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length: params.trials }, () => rng.int(1, 2 ** 31));
  }, [params.trials, seed]);

  const makeTrial = (index: number, length: number): Trial => {
    const s = trialSeeds[index] ?? index + 1;
    return {
      path: generatePath(length, params.size, createRng(s)),
      direction: pathDirection(index, params, createRng(s ^ 0x9e3779b1)),
    };
  };

  const [trialIndex, setTrialIndex] = useState(0);
  const [length, setLength] = useState(params.startLength);
  const [trial, setTrial] = useState<Trial>(() => makeTrial(0, params.startLength));
  const [phase, setPhase] = useState<Phase>('ready');
  const [step, setStep] = useState(-1);
  const [lit, setLit] = useState(false);
  const [input, setInput] = useState<number[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const elapsed = useActiveClock(paused);

  const cellCount = params.size * params.size;
  const onMs = Math.round(params.stepMs * 0.72);
  const offMs = params.stepMs - onMs;
  const backwards = trial.direction === 'rueckwaerts';
  const expected = backwards ? [...trial.path].reverse() : trial.path;
  const last = evaluations[evaluations.length - 1];

  useEffect(() => {
    onProgress(`Weg ${trialIndex + 1} von ${params.trials}`);
  }, [trialIndex, params.trials, onProgress]);

  usePausableTimeout(
    () => {
      setPhase('show');
      setStep(0);
      setLit(true);
      playSound('tick');
    },
    phase === 'ready' ? 1100 : null,
    paused,
    `ready-${trialIndex}`,
  );

  usePausableTimeout(
    () => {
      if (lit) {
        setLit(false);
        return;
      }
      if (step + 1 >= trial.path.length) {
        setPhase('input');
        playSound('flip');
        window.setTimeout(() => cellRefs.current[focusIndex]?.focus(), 0);
        return;
      }
      setStep(step + 1);
      setLit(true);
      playSound('tick', step + 1);
    },
    phase === 'show' ? (lit ? onMs : offMs) : null,
    paused,
    `show-${trialIndex}-${step}-${lit ? 'on' : 'off'}`,
  );

  usePausableTimeout(
    () => advance(),
    phase === 'feedback' ? 2400 : null,
    paused,
    `fb-${trialIndex}`,
  );

  function tap(cell: number) {
    if (phase !== 'input') return;
    const at = input.indexOf(cell);
    if (at >= 0) {
      // Nur die zuletzt gesetzte Marke lässt sich durch erneutes Antippen zurücknehmen.
      if (at === input.length - 1) setInput(input.slice(0, -1));
      return;
    }
    if (input.length >= trial.path.length) return;
    playSound('tap');
    setInput([...input, cell]);
  }

  function undo() {
    if (phase === 'input') setInput(input.slice(0, -1));
  }

  function submit() {
    if (phase !== 'input' || input.length !== trial.path.length) return;
    const result = evaluatePath(trial.path, trial.direction, input);
    setEvaluations([...evaluations, { ...result, length: trial.path.length }]);
    setPhase('feedback');
    feedback(result.perfect ? 'correct' : 'wrong', trialIndex);
  }

  function advance() {
    if (!last) return;
    if (trialIndex + 1 >= params.trials) {
      const perfect = evaluations.filter((e) => e.perfect).map((e) => e.length);
      onFinish({
        mode: 'wegmarken',
        difficulty,
        performance: evaluations.reduce((sum, e) => sum + e.accuracy, 0) / evaluations.length,
        score: evaluations.reduce((sum, e) => sum + e.score, 0),
        correct: perfect.length,
        total: evaluations.length,
        durationMs: elapsed(),
        metrics: perfect.length ? { pathSpan: Math.max(...perfect) } : {},
      });
      return;
    }
    const newLength = nextPathLength(length, last, params);
    setLength(newLength);
    setTrialIndex(trialIndex + 1);
    setTrial(makeTrial(trialIndex + 1, newLength));
    setInput([]);
    setStep(-1);
    setLit(false);
    setPhase('ready');
  }

  function onKey(event: KeyboardEvent<HTMLButtonElement>) {
    const size = params.size;
    if (event.key === 'Backspace') {
      event.preventDefault();
      undo();
      return;
    }
    if (event.key === 'Enter' && input.length === trial.path.length) {
      event.preventDefault();
      submit();
      return;
    }
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

  const position = (cell: number): string =>
    `Zeile ${Math.floor(cell / params.size) + 1}, Spalte ${(cell % params.size) + 1}`;
  const litCell = phase === 'show' && lit ? trial.path[step] : undefined;

  const instruction =
    phase === 'ready'
      ? `${trial.path.length} Wegmarken – danach ${backwards ? 'RÜCKWÄRTS' : 'vorwärts'} nachgehen`
      : phase === 'show'
        ? 'Merke dir den Weg.'
        : phase === 'input'
          ? backwards
            ? 'Tippe den Weg rückwärts nach – vom letzten Feld zum ersten.'
            : 'Tippe den Weg in derselben Reihenfolge nach.'
          : last?.perfect
            ? 'Genau richtig!'
            : `${last?.positionsCorrect ?? 0} von ${trial.path.length} Schritten richtig`;

  return (
    <div className="game wegmarken" data-phase={phase}>
      <p className="game-instruction" aria-live="polite">
        {instruction}
      </p>
      <div className={`direction-chip ${backwards ? 'is-back' : ''}`}>
        <Icon name={backwards ? 'back' : 'arrow'} size={18} />
        <span>{backwards ? 'Rückwärts' : 'Vorwärts'}</span>
      </div>
      <p className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {litCell !== undefined ? position(litCell) : ''}
      </p>

      <div
        className={`board board-${params.size} ${phase === 'feedback' && last && !last.perfect ? 'shake' : ''}`}
        role="group"
        aria-label={`Raster ${params.size} mal ${params.size}`}
        style={{ gridTemplateColumns: `repeat(${params.size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cellCount }, (_, cell) => {
          const chosenAt = input.indexOf(cell);
          const expectedAt = expected.indexOf(cell);
          let state = '';
          let badge: number | null = null;
          if (phase === 'show' && litCell === cell) state = 'is-lit';
          if (phase === 'input' && chosenAt >= 0) {
            state = 'is-chosen';
            badge = chosenAt + 1;
          }
          if (phase === 'feedback') {
            if (expectedAt >= 0) {
              badge = expectedAt + 1;
              state = input[expectedAt] === cell ? 'is-right' : 'is-missed';
            } else if (chosenAt >= 0) {
              state = 'is-wrong';
            }
          }
          const label =
            phase === 'feedback' && expectedAt >= 0
              ? `${position(cell)}: Schritt ${expectedAt + 1}, ${state === 'is-right' ? 'richtig' : 'verpasst'}`
              : chosenAt >= 0
                ? `${position(cell)}: Schritt ${chosenAt + 1}`
                : position(cell);
          return (
            <button
              key={cell}
              ref={(el) => {
                cellRefs.current[cell] = el;
              }}
              type="button"
              className={`cell path-cell ${state}`}
              aria-label={label}
              aria-pressed={phase === 'input' ? chosenAt >= 0 : undefined}
              disabled={phase !== 'input'}
              tabIndex={cell === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(cell)}
              onKeyDown={onKey}
              onClick={() => tap(cell)}
            >
              {badge !== null ? <span className="step-badge numeral">{badge}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="game-actions">
        {phase === 'input' ? (
          <>
            <p className="game-counter" aria-live="polite">
              {input.length} / {trial.path.length} Schritte
            </p>
            <div className="action-row">
              <Button icon="undo" onClick={undo} disabled={input.length === 0}>
                Zurücknehmen
              </Button>
              <Button
                variant="primary"
                icon="check"
                onClick={submit}
                disabled={input.length !== trial.path.length}
              >
                Prüfen
              </Button>
            </div>
          </>
        ) : null}
        {phase === 'feedback' ? (
          <Button size="lg" block iconRight="arrow" onClick={advance}>
            {trialIndex + 1 >= params.trials ? 'Zum Ergebnis' : 'Nächster Weg'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
