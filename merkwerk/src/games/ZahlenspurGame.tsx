import { useEffect, useMemo, useRef, useState } from 'react';
import {
  directionFor,
  evaluateTrial,
  expectedInput,
  generateSequence,
  nextLength,
  zahlenspurParams,
  type Direction,
  type TrialEvaluation,
} from '../game/modes/zahlenspur';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'ready' | 'show' | 'input' | 'feedback';

interface Trial {
  sequence: number[];
  direction: Direction;
}

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export default function ZahlenspurGame({ difficulty, seed, paused, onFinish, onProgress }: GameProps) {
  const params = useMemo(() => zahlenspurParams(difficulty), [difficulty]);
  const trialSeeds = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length: params.trials }, () => rng.int(1, 2 ** 31));
  }, [params.trials, seed]);

  const makeTrial = (index: number, length: number): Trial => {
    const s = trialSeeds[index] ?? index + 1;
    return {
      sequence: generateSequence(length, createRng(s)),
      direction: directionFor(index, params, createRng(s ^ 0x5bd1e995)),
    };
  };

  const [trialIndex, setTrialIndex] = useState(0);
  const [length, setLength] = useState(params.startLength);
  const [trial, setTrial] = useState<Trial>(() => makeTrial(0, params.startLength));
  const [phase, setPhase] = useState<Phase>('ready');
  const [shownDigit, setShownDigit] = useState(-1);
  const [digitVisible, setDigitVisible] = useState(false);
  const [input, setInput] = useState<number[]>([]);
  const [evaluations, setEvaluations] = useState<(TrialEvaluation & { length: number; direction: Direction })[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);
  const elapsed = useActiveClock(paused);

  const onDigit = Math.round(params.digitMs * 0.72);
  const gap = params.digitMs - onDigit;
  const last = evaluations[evaluations.length - 1];

  useEffect(() => {
    onProgress(`Folge ${trialIndex + 1} von ${params.trials}`);
  }, [trialIndex, params.trials, onProgress]);

  usePausableTimeout(
    () => {
      setPhase('show');
      setShownDigit(0);
      setDigitVisible(true);
      playSound('tick');
    },
    phase === 'ready' ? 1100 : null,
    paused,
    `ready-${trialIndex}`,
  );

  // Ziffer zeigen → kurze Lücke → nächste Ziffer
  usePausableTimeout(
    () => {
      if (digitVisible) {
        setDigitVisible(false);
        return;
      }
      if (shownDigit + 1 >= trial.sequence.length) {
        setPhase('input');
        playSound('flip');
        return;
      }
      setShownDigit(shownDigit + 1);
      setDigitVisible(true);
      playSound('tick');
    },
    phase === 'show' ? (digitVisible ? onDigit : gap) : null,
    paused,
    `show-${trialIndex}-${shownDigit}-${digitVisible ? 'on' : 'off'}`,
  );

  usePausableTimeout(() => advance(), phase === 'feedback' ? 2200 : null, paused, `fb-${trialIndex}`);

  useEffect(() => {
    if (phase !== 'input' || paused) return;
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) type(Number(event.key));
      else if (event.key === 'Backspace') erase();
      else if (event.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function type(digit: number) {
    if (phase !== 'input' || input.length >= trial.sequence.length) return;
    playSound('tap');
    const next = [...input, digit];
    setInput(next);
    if (next.length === trial.sequence.length) window.setTimeout(() => okRef.current?.focus(), 0);
  }

  function erase() {
    if (phase !== 'input') return;
    setInput(input.slice(0, -1));
  }

  function submit() {
    if (phase !== 'input' || input.length !== trial.sequence.length) return;
    const result = evaluateTrial(trial.sequence, trial.direction, input);
    setEvaluations([...evaluations, { ...result, length: trial.sequence.length, direction: trial.direction }]);
    setPhase('feedback');
    feedback(result.perfect ? 'correct' : 'wrong', trialIndex);
  }

  function advance() {
    if (!last) return;
    if (trialIndex + 1 >= params.trials) {
      const perfectForward = evaluations.filter((e) => e.perfect && e.direction === 'vorwaerts').map((e) => e.length);
      const perfectBackward = evaluations.filter((e) => e.perfect && e.direction === 'rueckwaerts').map((e) => e.length);
      onFinish({
        mode: 'zahlenspur',
        difficulty,
        performance: evaluations.reduce((sum, e) => sum + e.accuracy, 0) / evaluations.length,
        score: evaluations.reduce((sum, e) => sum + e.score, 0),
        correct: evaluations.filter((e) => e.perfect).length,
        total: evaluations.length,
        durationMs: elapsed(),
        metrics: {
          ...(perfectForward.length ? { spanForward: Math.max(...perfectForward) } : {}),
          ...(perfectBackward.length ? { spanBackward: Math.max(...perfectBackward) } : {}),
        },
      });
      return;
    }
    const newLength = nextLength(length, last);
    setLength(newLength);
    setTrialIndex(trialIndex + 1);
    setTrial(makeTrial(trialIndex + 1, newLength));
    setInput([]);
    setShownDigit(-1);
    setDigitVisible(false);
    setPhase('ready');
  }

  const backwards = trial.direction === 'rueckwaerts';
  const expected = expectedInput(trial.sequence, trial.direction);
  const instruction =
    phase === 'ready'
      ? `${trial.sequence.length} Ziffern – ${backwards ? 'danach RÜCKWÄRTS eingeben' : 'danach vorwärts eingeben'}`
      : phase === 'show'
        ? 'Merke dir die Folge.'
        : phase === 'input'
          ? backwards
            ? 'Gib die Folge rückwärts ein.'
            : 'Gib die Folge ein.'
          : last?.perfect
            ? 'Genau richtig!'
            : `${last?.positionsCorrect ?? 0} von ${trial.sequence.length} Stellen richtig`;

  return (
    <div className="game zahlenspur" data-phase={phase}>
      <p className="game-instruction" aria-live="polite">
        {instruction}
      </p>
      <div className={`direction-chip ${backwards ? 'is-back' : ''}`}>
        <Icon name={backwards ? 'back' : 'arrow'} size={18} />
        <span>{backwards ? 'Rückwärts' : 'Vorwärts'}</span>
      </div>

      <div className="digit-stage" aria-live="assertive" aria-atomic="true">
        {phase === 'show' && digitVisible ? (
          <span className="digit-big numeral digit-show" key={shownDigit}>
            {trial.sequence[shownDigit]}
          </span>
        ) : phase === 'show' ? (
          <span className="digit-dot" aria-hidden="true" />
        ) : null}
        {phase === 'ready' ? <span className="digit-count numeral">{trial.sequence.length}</span> : null}
        {phase === 'input' || phase === 'feedback' ? (
          <ol className="slots" aria-label="Deine Eingabe">
            {expected.map((digit, i) => {
              const given = input[i];
              const state = phase === 'feedback' ? (given === digit ? 'is-correct' : 'is-wrong') : i === input.length ? 'is-next' : '';
              return (
                <li key={i} className={`slot ${state}`}>
                  <span className="numeral">{given ?? ''}</span>
                  {phase === 'feedback' && given !== digit ? <span className="slot-expected">{digit}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
      {phase === 'feedback' && !last?.perfect ? (
        <p className="muted small center">Richtig wäre: {expected.join(' ')}</p>
      ) : null}

      {phase === 'input' ? (
        <div className="keypad" role="group" aria-label="Ziffern-Tastenfeld">
          {KEYS.map((k) => (
            <button key={k} type="button" className="key numeral" onClick={() => type(k)}>
              {k}
            </button>
          ))}
          <button type="button" className="key key-muted" onClick={erase} aria-label="Letzte Ziffer löschen">
            <Icon name="backspace" />
          </button>
          <button type="button" className="key numeral" onClick={() => type(0)}>
            0
          </button>
          <button
            ref={okRef}
            type="button"
            className="key key-ok"
            onClick={submit}
            disabled={input.length !== trial.sequence.length}
            aria-label="Eingabe prüfen"
          >
            <Icon name="check" />
          </button>
        </div>
      ) : null}

      {phase === 'feedback' ? (
        <Button size="lg" block iconRight="arrow" onClick={advance}>
          {trialIndex + 1 >= params.trials ? 'Zum Ergebnis' : 'Nächste Folge'}
        </Button>
      ) : null}
    </div>
  );
}
