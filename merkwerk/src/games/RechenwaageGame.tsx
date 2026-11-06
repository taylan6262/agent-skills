import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createScaleTrial,
  rechenwaageParams,
  type ScaleTrial,
  type Side,
} from '../game/modes/rechenwaage';
import { comboMultiplier, pointsForAnswer, tempoPerformance } from '../game/modes/tempo';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'countdown' | 'running' | 'done';

const SIDE_LABEL: Record<Side, string> = { links: 'Links', gleich: 'Gleich', rechts: 'Rechts' };

export default function RechenwaageGame({
  difficulty,
  seed,
  paused,
  onFinish,
  onProgress,
}: GameProps) {
  const params = useMemo(() => rechenwaageParams(difficulty), [difficulty]);
  const [rng] = useState(() => createRng(seed));
  const [trial, setTrial] = useState<ScaleTrial>(() => createScaleTrial(params, rng));
  const [trialNo, setTrialNo] = useState(0);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [count, setCount] = useState(3);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, combo: 0, bestCombo: 0, score: 0 });
  const [reveal, setReveal] = useState<{ chosen: Side; correct: boolean } | null>(null);
  const [remainingMs, setRemainingMs] = useState(params.durationMs);
  const trialStart = useRef(0);
  const finished = useRef(false);
  const clock = useActiveClock(paused || phase !== 'running');

  useEffect(() => {
    onProgress(`${stats.correct} richtig`);
  }, [stats.correct, onProgress]);

  usePausableTimeout(
    () => {
      if (count > 1) {
        setCount(count - 1);
        playSound('tick');
      } else {
        setPhase('running');
        playSound('start');
        trialStart.current = 0;
      }
    },
    phase === 'countdown' ? 600 : null,
    paused,
    `count-${count}`,
  );

  // Kurze Auflösung: Waage neigt sich, dann folgt die nächste Aufgabe.
  usePausableTimeout(
    () => {
      setReveal(null);
      setTrial(createScaleTrial(params, rng));
      setTrialNo((n) => n + 1);
      trialStart.current = clock();
    },
    reveal ? 650 : null,
    paused,
    `reveal-${trialNo}`,
  );

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    let frame = 0;
    const tick = () => {
      const left = Math.max(0, params.durationMs - clock());
      setRemainingMs(left);
      if (left <= 0) {
        end();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    if (phase !== 'running' || paused) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a' || key === '1') answer('links');
      else if (key === 'arrowdown' || key === 's' || key === '2' || key === ' ') {
        event.preventDefault();
        answer('gleich');
      } else if (key === 'arrowright' || key === 'd' || key === '3') answer('rechts');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function answer(side: Side) {
    if (phase !== 'running' || paused || reveal) return;
    const correct = side === trial.answer;
    const rt = clock() - trialStart.current;
    const combo = correct ? stats.combo + 1 : 0;
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
      combo,
      bestCombo: Math.max(s.bestCombo, combo),
      score: s.score + (correct ? pointsForAnswer(Math.max(0, rt - 1500), combo) : 0),
    }));
    if (correct && combo % 5 === 0) feedback('combo', comboMultiplier(combo));
    else feedback(correct ? 'correct' : 'wrong', Math.min(combo, 12));
    setReveal({ chosen: side, correct });
  }

  function end() {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    onFinish({
      mode: 'rechenwaage',
      difficulty,
      performance: tempoPerformance(stats.correct, stats.wrong, params.target),
      score: stats.score,
      correct: stats.correct,
      total: stats.correct + stats.wrong,
      durationMs: params.durationMs,
      metrics: { scaleCorrect: stats.correct },
    });
  }

  const seconds = Math.ceil(remainingMs / 1000);
  const multiplier = comboMultiplier(stats.combo);
  const tilt = reveal ? trial.answer : 'gleich';

  return (
    <div className="game rechenwaage" data-phase={phase}>
      <div className="tempo-hud">
        <div className="tempo-time">
          <span className="numeral" aria-hidden="true">
            {seconds}
          </span>
          <span className="label muted">Sekunden</span>
        </div>
        <div className={`combo combo-${multiplier}`}>
          <span className="numeral combo-bump" key={multiplier}>
            ×{multiplier}
          </span>
          <span className="label">Combo {stats.combo}</span>
        </div>
        <div className="tempo-score">
          <span className="numeral">{stats.score}</span>
          <span className="label muted">Punkte</span>
        </div>
      </div>
      <div className="timer-track" aria-hidden="true">
        <div
          className="timer-fill"
          style={{ transform: `scaleX(${remainingMs / params.durationMs})` }}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {seconds % 10 === 0 && phase === 'running' ? `Noch ${seconds} Sekunden` : ''}
      </p>

      {phase === 'countdown' ? (
        <div className="tempo-stage">
          <span className="countdown numeral digit-show" key={count} aria-live="assertive">
            {count}
          </span>
          <p className="muted center">Links · Gleich · Rechts</p>
        </div>
      ) : (
        <>
          <p className="game-instruction tempo-question">Welche Seite wiegt mehr?</p>
          <div
            className={`balance tilt-${tilt} ${reveal ? (reveal.correct ? 'flash-ok' : 'flash-bad') : ''}`}
            role="group"
            aria-label="Waage"
          >
            <div className="beam">
              <div className="pan" aria-label={`Links: ${trial.left.spoken}`} role="img">
                <span className="pan-term numeral digit-show" key={`l-${trialNo}`}>
                  {trial.left.text}
                </span>
                {reveal ? <span className="pan-value">= {trial.left.value}</span> : null}
              </div>
              <div className="pan" aria-label={`Rechts: ${trial.right.spoken}`} role="img">
                <span className="pan-term numeral digit-show" key={`r-${trialNo}`}>
                  {trial.right.text}
                </span>
                {reveal ? <span className="pan-value">= {trial.right.value}</span> : null}
              </div>
            </div>
            <div className="fulcrum" aria-hidden="true" />
            {reveal ? (
              <span className={`tempo-flash ${reveal.correct ? 'ok' : 'bad'}`} role="status">
                <Icon name={reveal.correct ? 'check' : 'close'} size={22} />
                <span>
                  {reveal.correct ? 'Richtig' : `Richtig wäre: ${SIDE_LABEL[trial.answer]}`}
                </span>
              </span>
            ) : null}
          </div>
          <div className="scale-buttons">
            <Button
              quiet
              size="lg"
              icon="back"
              onClick={() => answer('links')}
              disabled={phase !== 'running'}
            >
              Links
            </Button>
            <Button
              quiet
              size="lg"
              variant="yellow"
              onClick={() => answer('gleich')}
              disabled={phase !== 'running'}
            >
              Gleich
            </Button>
            <Button
              quiet
              size="lg"
              iconRight="arrow"
              onClick={() => answer('rechts')}
              disabled={phase !== 'running'}
            >
              Rechts
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
