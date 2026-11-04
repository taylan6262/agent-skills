import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COLOR_WORDS,
  SHAPE_WORDS,
  comboMultiplier,
  createTrialStream,
  pointsForAnswer,
  tempoParams,
  tempoPerformance,
  type TempoTrial,
} from '../game/modes/tempo';
import { TOKENS, tokenLabel } from '../game/symbols';
import { feedback, playSound } from '../lib/feedback';
import { median } from '../lib/math';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { Shape } from '../ui/Shape';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'countdown' | 'running' | 'done';

const QUESTION: Record<TempoTrial['kind'], string> = {
  farbwort: 'Passt die Farbe der Fläche zum Wort?',
  formwort: 'Passt die Form zum Wort?',
  gleich: 'Gleiches Symbol wie vorher?',
};

function TrialView({ trial, patterned }: { trial: TempoTrial; patterned: boolean }) {
  if (trial.kind === 'farbwort') {
    return (
      <div className={`color-block fill-${trial.fill}`}>
        <span>{COLOR_WORDS[trial.word]}</span>
      </div>
    );
  }
  if (trial.kind === 'formwort') {
    return (
      <div className="shape-word">
        <Shape shape={trial.shape} color="tinte" size={120} />
        <span className="shape-word-text">{SHAPE_WORDS[trial.word]}</span>
      </div>
    );
  }
  const token = TOKENS.find((t) => t.shape === trial.token) ?? { shape: trial.token, color: 'tinte' as const };
  return (
    <div className="same-token">
      <Shape shape={token.shape} color={token.color} patterned={patterned} size={150} label={tokenLabel(token)} />
    </div>
  );
}

function trialDescription(trial: TempoTrial): string {
  if (trial.kind === 'farbwort') return `Wort ${COLOR_WORDS[trial.word]} auf ${trial.fill === 'tinte' ? 'schwarzer' : trial.fill === 'rot' ? 'roter' : trial.fill === 'blau' ? 'blauer' : 'gelber'} Fläche`;
  if (trial.kind === 'formwort') return `Wort ${SHAPE_WORDS[trial.word] ?? ''} neben einer Form`;
  return '';
}

export default function TempoGame({ difficulty, seed, paused, colorPatterns, onFinish, onProgress }: GameProps) {
  const params = useMemo(() => tempoParams(difficulty, createRng(seed), colorPatterns), [difficulty, seed, colorPatterns]);
  const stream = useMemo(() => createTrialStream(params, createRng(seed + 1)), [params, seed]);
  const [trial, setTrial] = useState<TempoTrial>(() => stream.next());
  const [trialNo, setTrialNo] = useState(0);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [count, setCount] = useState(3);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, combo: 0, bestCombo: 0, score: 0 });
  const [flash, setFlash] = useState<'ok' | 'bad' | 'slow' | null>(null);
  const [remainingMs, setRemainingMs] = useState(params.durationMs);
  const reactionTimes = useRef<number[]>([]);
  const trialStart = useRef(0);
  const clock = useActiveClock(paused || phase !== 'running');
  const finished = useRef(false);

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

  // Uhr und Zeitlimit pro Entscheidung
  useEffect(() => {
    if (phase !== 'running' || paused) return;
    let frame = 0;
    const tick = () => {
      const now = clock();
      const left = Math.max(0, params.durationMs - now);
      setRemainingMs(left);
      if (left <= 0) {
        end();
        return;
      }
      const isIntro = trial.kind === 'gleich' && trial.intro;
      if (isIntro && now - trialStart.current > 900) {
        nextTrial(now);
      } else if (!isIntro && params.trialLimitMs !== null && now - trialStart.current > params.trialLimitMs) {
        register(false, now, true);
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
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'j') answer(true);
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'f') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  usePausableTimeout(() => setFlash(null), flash ? 260 : null, paused, `flash-${trialNo}-${flash ?? ''}`);

  function nextTrial(now: number) {
    setTrial(stream.next());
    setTrialNo((n) => n + 1);
    trialStart.current = now;
  }

  function register(correct: boolean, now: number, slow = false) {
    const rt = now - trialStart.current;
    setStats((s) => {
      const combo = correct ? s.combo + 1 : 0;
      return {
        correct: s.correct + (correct ? 1 : 0),
        wrong: s.wrong + (correct ? 0 : 1),
        combo,
        bestCombo: Math.max(s.bestCombo, combo),
        score: s.score + (correct ? pointsForAnswer(rt, combo) : 0),
      };
    });
    if (correct) {
      reactionTimes.current.push(rt);
      const combo = stats.combo + 1;
      if (combo % 5 === 0) feedback('combo', comboMultiplier(combo));
      else feedback('correct', Math.min(combo, 12));
    } else {
      feedback('wrong');
    }
    setFlash(correct ? 'ok' : slow ? 'slow' : 'bad');
    nextTrial(now);
  }

  function answer(yes: boolean) {
    if (phase !== 'running' || paused) return;
    if (trial.kind === 'gleich' && trial.intro) return;
    register(yes === trial.match, clock());
  }

  function end() {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    const rt = median(reactionTimes.current);
    onFinish({
      mode: 'tempo',
      difficulty,
      performance: tempoPerformance(stats.correct, stats.wrong, params.target),
      score: stats.score,
      correct: stats.correct,
      total: stats.correct + stats.wrong,
      durationMs: params.durationMs,
      metrics: { bestCombo: stats.bestCombo, ...(rt !== null ? { medianRtMs: rt } : {}) },
    });
  }

  const seconds = Math.ceil(remainingMs / 1000);
  const multiplier = comboMultiplier(stats.combo);
  const isIntro = trial.kind === 'gleich' && trial.intro;

  return (
    <div className="game tempo" data-phase={phase}>
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
        <div className="timer-fill" style={{ transform: `scaleX(${remainingMs / params.durationMs})` }} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {seconds % 10 === 0 && phase === 'running' ? `Noch ${seconds} Sekunden` : ''}
      </p>

      {phase === 'countdown' ? (
        <div className="tempo-stage">
          <span className="countdown numeral digit-show" key={count} aria-live="assertive">
            {count}
          </span>
          <p className="muted center">Nein = links · Ja = rechts</p>
        </div>
      ) : (
        <>
          <p className="game-instruction tempo-question" aria-live="polite">
            {isIntro ? 'Merke dir dieses Symbol.' : QUESTION[trial.kind]}
          </p>
          <div className={`tempo-stage ${flash ? `flash-${flash}` : ''}`}>
            <div className="digit-show" key={trialNo}>
              <TrialView trial={trial} patterned={colorPatterns} />
              <span className="visually-hidden">{trialDescription(trial)}</span>
            </div>
            {flash ? (
              <span className={`tempo-flash ${flash === 'ok' ? 'ok' : 'bad'}`} aria-hidden="true">
                <Icon name={flash === 'ok' ? 'check' : 'close'} size={28} />
                {flash === 'slow' ? <span>zu langsam</span> : null}
              </span>
            ) : null}
          </div>
          <div className="yes-no">
            <Button quiet size="lg" icon="close" onClick={() => answer(false)} disabled={isIntro || phase !== 'running'}>
              Nein
            </Button>
            <Button quiet size="lg" variant="blue" icon="check" onClick={() => answer(true)} disabled={isIntro || phase !== 'running'}>
              Ja
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
