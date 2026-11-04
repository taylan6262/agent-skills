import { useEffect, useMemo, useState } from 'react';
import {
  CORNER_LABEL,
  detailblickParams,
  generateQuestions,
  generateScene,
  type Corner,
  type Scene,
  type SceneQuestion,
} from '../game/modes/detailblick';
import { colorShapeLabel } from '../game/symbols';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { Shape } from '../ui/Shape';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

type Phase = 'ready' | 'show' | 'question' | 'answered';

interface Round {
  scene: Scene;
  questions: SceneQuestion[];
}

function positionName(scene: Scene, col: number, row: number): string {
  const corners: Record<string, Corner> = {
    [`0-0`]: 'lo',
    [`${scene.cols - 1}-0`]: 'ro',
    [`0-${scene.rows - 1}`]: 'lu',
    [`${scene.cols - 1}-${scene.rows - 1}`]: 'ru',
  };
  const corner = corners[`${col}-${row}`];
  if (corner) return `Ecke ${CORNER_LABEL[corner]}`;
  return `Zeile ${row + 1}, Spalte ${col + 1}`;
}

function SceneView({ scene, patterned }: { scene: Scene; patterned: boolean }) {
  return (
    <div className="scene" style={{ aspectRatio: `${scene.cols} / ${scene.rows}` }}>
      <span className="scene-corner tl" aria-hidden="true" />
      <span className="scene-corner br" aria-hidden="true" />
      {scene.objects.map((o) => {
        const size = (o.big ? 0.78 : 0.48) / scene.cols;
        return (
          <span
            key={o.cell}
            className="scene-object"
            style={{
              left: `${((o.col + 0.5 + o.dx) / scene.cols) * 100}%`,
              top: `${((o.row + 0.5 + o.dy) / scene.rows) * 100}%`,
              width: `${size * 100}%`,
            }}
          >
            <Shape shape={o.shape} color={o.color} patterned={patterned} />
          </span>
        );
      })}
      <ul className="visually-hidden">
        {scene.objects.map((o) => (
          <li key={o.cell}>
            {positionName(scene, o.col, o.row)}: {colorShapeLabel(o.color, o.shape)}, {o.big ? 'groß' : 'klein'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DetailblickGame({ difficulty, seed, paused, colorPatterns, onFinish, onProgress }: GameProps) {
  const params = useMemo(() => detailblickParams(difficulty), [difficulty]);
  const rounds = useMemo<Round[]>(() => {
    const rng = createRng(seed);
    return Array.from({ length: params.scenes }, () => {
      const scene = generateScene(params, rng);
      return { scene, questions: generateQuestions(scene, params.questions, rng) };
    });
  }, [params, seed]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[][]>(() => rounds.map(() => []));
  const elapsed = useActiveClock(paused);

  const round = rounds[roundIndex];
  const question = round?.questions[questionIndex];
  const total = params.scenes * params.questions;

  useEffect(() => {
    onProgress(`Szene ${roundIndex + 1} von ${params.scenes}`);
  }, [roundIndex, params.scenes, onProgress]);

  usePausableTimeout(
    () => {
      setPhase('show');
      playSound('flip');
    },
    phase === 'ready' ? 800 : null,
    paused,
    `ready-${roundIndex}`,
  );
  usePausableTimeout(
    () => {
      setPhase('question');
      playSound('flip');
    },
    phase === 'show' ? params.showMs : null,
    paused,
    `show-${roundIndex}`,
  );

  if (!round || !question) return null;

  function finish(all: boolean[][]) {
    const flat = all.flat();
    const correct = flat.filter(Boolean).length;
    const perfectScenes = all.filter((r) => r.length > 0 && r.every(Boolean)).length;
    onFinish({
      mode: 'detailblick',
      difficulty,
      performance: correct / Math.max(1, total),
      score: Math.round(correct * 50 * (1 + difficulty / 10)),
      correct,
      total,
      durationMs: elapsed(),
      metrics: { perfectScenes },
    });
  }

  function answer(index: number) {
    if (phase !== 'question' || !question) return;
    const correct = index === question.correctIndex;
    setChosen(index);
    const next = results.map((r, i) => (i === roundIndex ? [...r, correct] : r));
    setResults(next);
    setPhase('answered');
    feedback(correct ? 'correct' : 'wrong', questionIndex);
  }

  function advance() {
    if (!round) return;
    setChosen(null);
    if (questionIndex + 1 < round.questions.length) {
      setQuestionIndex(questionIndex + 1);
      setPhase('question');
      return;
    }
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      setQuestionIndex(0);
      setPhase('ready');
      return;
    }
    finish(results);
  }

  const wasCorrect = phase === 'answered' && chosen === question.correctIndex;
  const instruction =
    phase === 'ready'
      ? 'Gleich erscheint die Szene …'
      : phase === 'show'
        ? 'Präge dir die Szene genau ein.'
        : `Frage ${questionIndex + 1} von ${round.questions.length}`;

  return (
    <div className="game detailblick" data-phase={phase}>
      <p className="game-instruction" aria-live="polite">
        {instruction}
      </p>
      <div className="timer-track" aria-hidden="true">
        {phase === 'show' ? (
          <div className={`timer-bar ${paused ? 'is-paused' : ''}`} style={{ animationDuration: `${params.showMs}ms` }} />
        ) : null}
      </div>

      {phase === 'show' ? <SceneView scene={round.scene} patterned={colorPatterns} /> : null}
      {phase === 'ready' ? <div className="scene scene-blank" style={{ aspectRatio: `${round.scene.cols} / ${round.scene.rows}` }} /> : null}

      {phase === 'question' || phase === 'answered' ? (
        <div className="quiz" key={`${roundIndex}-${questionIndex}`}>
          <h2 className="quiz-question" id="frage">
            {question.text}
          </h2>
          <div className={`options options-${question.options.length}`} role="group" aria-labelledby="frage">
            {question.options.map((option, i) => {
              const isCorrect = i === question.correctIndex;
              const isChosen = i === chosen;
              const state = phase === 'answered' ? (isCorrect ? 'is-correct' : isChosen ? 'is-wrong' : 'is-dim') : '';
              return (
                <button
                  key={option}
                  type="button"
                  className={`option ${state}`}
                  disabled={phase === 'answered'}
                  onClick={() => answer(i)}
                >
                  <span>{option}</span>
                  {phase === 'answered' && isCorrect ? <Icon name="check" size={20} label="richtige Antwort" /> : null}
                  {phase === 'answered' && isChosen && !isCorrect ? <Icon name="close" size={20} label="deine Antwort, falsch" /> : null}
                </button>
              );
            })}
          </div>
          {phase === 'answered' ? (
            <div className={`answer-note ${wasCorrect ? 'good' : 'bad'} feedback-pop`} role="status">
              <Icon name={wasCorrect ? 'check' : 'close'} size={20} />
              <span>{wasCorrect ? 'Richtig!' : `Leider nicht. Richtig ist: ${question.options[question.correctIndex] ?? ''}.`}</span>
            </div>
          ) : null}
          {phase === 'answered' ? (
            <Button variant="primary" size="lg" block iconRight="arrow" onClick={advance}>
              {questionIndex + 1 < round.questions.length ? 'Nächste Frage' : roundIndex + 1 < rounds.length ? 'Nächste Szene' : 'Zum Ergebnis'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
