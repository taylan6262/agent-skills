import { useEffect, useMemo, useRef, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { pointsForAnswer, prepareRound, wissenParams } from '../game/modes/wissen';
import type { AnswerRecord } from '../game/types';
import { toDayKey } from '../lib/date';
import { feedback } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { getSave } from '../state/store';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { CATEGORY_META } from '../ui/meta';
import { useActiveClock, usePausableTimeout } from './hooks';
import type { GameProps } from './types';

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const LEVEL_NAMES = { 1: 'leicht', 2: 'mittel', 3: 'schwer' } as const;

export default function WissenGame({
  difficulty,
  seed,
  paused,
  category,
  reviewOnly,
  onFinish,
  onProgress,
}: GameProps) {
  const params = useMemo(() => wissenParams(difficulty), [difficulty]);
  const [round] = useState(() =>
    prepareRound(QUESTIONS, getSave().leitner, params, createRng(seed), {
      today: toDayKey(new Date()),
      ...(category ? { categories: [category] } : {}),
      ...(reviewOnly ? { reviewOnly: true } : {}),
    }),
  );
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [score, setScore] = useState(0);
  const questionStart = useRef(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const elapsed = useActiveClock(paused);

  const current = round[index];
  const answered = chosen !== null || timedOut;

  useEffect(() => {
    onProgress(`Frage ${index + 1} von ${round.length}`);
    questionStart.current = elapsed();
  }, [index, round.length, onProgress, elapsed]);

  usePausableTimeout(
    () => {
      if (answered || !current) return;
      setTimedOut(true);
      setAnswers((a) => [...a, { questionId: current.question.id, correct: false }]);
      feedback('wrong');
    },
    params.timeLimitMs !== null && !answered ? params.timeLimitMs : null,
    paused,
    `q-${index}`,
  );

  useEffect(() => {
    if (paused) return;
    const onKey = (event: KeyboardEvent) => {
      const map: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };
      const pick = map[event.key.toLowerCase()];
      if (pick !== undefined && !answered) choose(pick);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;
  const { question, order } = current;

  function choose(displayIndex: number) {
    if (answered || !current) return;
    const answerIndex = order[displayIndex] ?? -1;
    const correct = answerIndex === 0;
    setChosen(displayIndex);
    setAnswers([...answers, { questionId: current.question.id, correct }]);
    const spent = elapsed() - questionStart.current;
    const remaining = params.timeLimitMs === null ? null : Math.max(0, params.timeLimitMs - spent);
    setScore(score + pointsForAnswer(correct, remaining, params.timeLimitMs));
    feedback(correct ? 'correct' : 'wrong', index);
    window.setTimeout(() => nextRef.current?.focus(), 0);
  }

  function advance() {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setChosen(null);
      setTimedOut(false);
      return;
    }
    const correct = answers.filter((a) => a.correct).length;
    onFinish({
      mode: 'wissen',
      difficulty,
      performance: correct / Math.max(1, round.length),
      score,
      correct,
      total: round.length,
      durationMs: elapsed(),
      metrics: { answers },
    });
  }

  const correctDisplay = order.indexOf(0);
  const wasCorrect = chosen !== null && order[chosen] === 0;
  const meta = CATEGORY_META[question.category];

  return (
    <div className="game wissen" data-phase={answered ? 'answered' : 'question'}>
      <div className="quiz-meta">
        <span className="chip">
          <Icon name={meta.icon} size={16} /> {meta.name}
        </span>
        <span className="label muted">{LEVEL_NAMES[question.difficulty]}</span>
      </div>
      {params.timeLimitMs !== null ? (
        <div className="timer-track" aria-hidden="true">
          {!answered ? (
            <div
              className={`timer-bar ${paused ? 'is-paused' : ''}`}
              key={index}
              style={{ animationDuration: `${params.timeLimitMs}ms` }}
            />
          ) : null}
        </div>
      ) : null}

      <div className="quiz" key={index}>
        <h2 className="quiz-question" id="frage">
          {question.question}
        </h2>
        <div className="options options-4 options-text" role="group" aria-labelledby="frage">
          {order.map((answerIndex, displayIndex) => {
            const text = question.answers[answerIndex] ?? '';
            const isCorrect = displayIndex === correctDisplay;
            const isChosen = displayIndex === chosen;
            const state = answered
              ? isCorrect
                ? 'is-correct'
                : isChosen
                  ? 'is-wrong'
                  : 'is-dim'
              : '';
            return (
              <button
                key={text}
                type="button"
                className={`option ${state}`}
                disabled={answered}
                onClick={() => choose(displayIndex)}
              >
                <span className="option-letter" aria-hidden="true">
                  {LETTERS[displayIndex]}
                </span>
                <span className="option-text">{text}</span>
                {answered && isCorrect ? (
                  <Icon name="check" size={20} label="richtige Antwort" />
                ) : null}
                {answered && isChosen && !isCorrect ? (
                  <Icon name="close" size={20} label="deine Antwort, falsch" />
                ) : null}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className={`explanation ${wasCorrect ? 'good' : 'bad'} feedback-pop`} role="status">
            <p className="explanation-head">
              <Icon name={wasCorrect ? 'check' : 'close'} size={20} />
              <strong>
                {wasCorrect ? 'Richtig!' : timedOut ? 'Zeit abgelaufen.' : 'Nicht ganz.'}
              </strong>
              {!wasCorrect ? <span> Richtig ist: {question.answers[0]}</span> : null}
            </p>
            <p>{question.explanation}</p>
            {!wasCorrect ? <p className="muted small">Diese Frage kommt bald wieder.</p> : null}
          </div>
        ) : null}

        {answered ? (
          <Button
            ref={nextRef}
            variant="primary"
            size="lg"
            block
            iconRight="arrow"
            onClick={advance}
          >
            {index + 1 < round.length ? 'Nächste Frage' : 'Zum Ergebnis'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
