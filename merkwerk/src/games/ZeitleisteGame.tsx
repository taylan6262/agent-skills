import { useEffect, useMemo, useRef, useState } from 'react';
import { EVENTS } from '../data/events';
import {
  chronological,
  evaluateOrder,
  formatYear,
  pickRound,
  zeitleisteParams,
  type HistoricEvent,
  type OrderEvaluation,
} from '../game/modes/zeitleiste';
import { feedback, playSound } from '../lib/feedback';
import { createRng } from '../lib/rng';
import { Button } from '../ui/components';
import { Icon } from '../ui/icons';
import { useActiveClock } from './hooks';
import type { GameProps } from './types';

type Phase = 'order' | 'feedback';

export default function ZeitleisteGame({
  difficulty,
  seed,
  paused,
  onFinish,
  onProgress,
}: GameProps) {
  const params = useMemo(() => zeitleisteParams(difficulty), [difficulty]);
  const rounds = useMemo(() => {
    const rng = createRng(seed);
    const used = new Set<string>();
    return Array.from({ length: params.rounds }, () => {
      const round = pickRound(EVENTS, params, rng, used);
      round.forEach((event) => used.add(event.id));
      return rng.shuffle(round);
    });
  }, [params, seed]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('order');
  const [evaluations, setEvaluations] = useState<(OrderEvaluation & { count: number })[]>([]);
  const poolRef = useRef<HTMLDivElement>(null);
  const elapsed = useActiveClock(paused);

  const events: HistoricEvent[] = rounds[roundIndex] ?? [];
  const byId = new Map(events.map((event) => [event.id, event]));
  const remaining = events.filter((event) => !placed.includes(event.id));
  const last = evaluations[evaluations.length - 1];
  const correctOrder = chronological(events);

  useEffect(() => {
    onProgress(`Runde ${roundIndex + 1} von ${params.rounds}`);
  }, [roundIndex, params.rounds, onProgress]);

  function place(id: string) {
    if (phase !== 'order') return;
    playSound('tap');
    setPlaced([...placed, id]);
    window.setTimeout(
      () => poolRef.current?.querySelector<HTMLButtonElement>('button')?.focus(),
      0,
    );
  }

  function unplace(id: string) {
    if (phase !== 'order') return;
    setPlaced(placed.filter((p) => p !== id));
  }

  function check() {
    if (placed.length !== events.length) return;
    const result = evaluateOrder(placed, events);
    setEvaluations([...evaluations, { ...result, count: events.length }]);
    setPhase('feedback');
    feedback(result.perfect ? 'correct' : 'wrong', roundIndex);
  }

  function advance() {
    if (roundIndex + 1 >= rounds.length) {
      const perfect = evaluations.filter((e) => e.perfect).map((e) => e.count);
      const correct = evaluations.reduce((sum, e) => sum + e.correct, 0);
      const total = evaluations.reduce((sum, e) => sum + e.count, 0);
      onFinish({
        mode: 'zeitleiste',
        difficulty,
        performance:
          evaluations.reduce((sum, e) => sum + e.accuracy, 0) / Math.max(1, evaluations.length),
        score: evaluations.reduce((sum, e) => sum + e.score, 0),
        correct,
        total,
        durationMs: elapsed(),
        metrics: perfect.length ? { timelinePerfect: Math.max(...perfect) } : {},
      });
      return;
    }
    setRoundIndex(roundIndex + 1);
    setPlaced([]);
    setPhase('order');
  }

  const instruction =
    phase === 'order'
      ? placed.length === 0
        ? 'Was geschah zuerst? Tippe die Ereignisse vom frühesten zum spätesten an.'
        : 'Weiter so – ein Tipp auf ein gelegtes Ereignis legt es zurück.'
      : last?.perfect
        ? 'Perfekt geordnet!'
        : `${last?.correct ?? 0} von ${events.length} an der richtigen Stelle`;

  return (
    <div className="game zeitleiste" data-phase={phase}>
      <p className="game-instruction" aria-live="polite">
        {instruction}
      </p>

      <ol className="timeline" aria-label="Deine Reihenfolge, früheste zuerst">
        {Array.from({ length: events.length }, (_, i) => {
          const event = byId.get(placed[i] ?? '');
          const isRight =
            phase === 'feedback' && event !== undefined && correctOrder[i]?.id === event.id;
          const state =
            phase === 'feedback' ? (isRight ? 'is-right' : 'is-wrong') : event ? 'is-filled' : '';
          return (
            <li key={i} className={`timeline-slot ${state}`}>
              <span className="timeline-dot numeral" aria-hidden="true">
                {i + 1}
              </span>
              {event ? (
                <button
                  type="button"
                  className="timeline-card"
                  disabled={phase !== 'order'}
                  onClick={() => unplace(event.id)}
                  aria-label={`Platz ${i + 1}: ${event.text}${phase === 'feedback' ? `, ${formatYear(event)}, ${isRight ? 'richtig' : 'falsch'}` : '. Antippen zum Zurücklegen'}`}
                >
                  <span className="timeline-text">{event.text}</span>
                  {phase === 'feedback' ? (
                    <span className="timeline-year">
                      <Icon name={isRight ? 'check' : 'close'} size={16} /> {formatYear(event)}
                    </span>
                  ) : null}
                </button>
              ) : (
                <span className="timeline-empty">Platz {i + 1}</span>
              )}
            </li>
          );
        })}
      </ol>

      {phase === 'order' && remaining.length > 0 ? (
        <div
          className="event-pool"
          ref={poolRef}
          role="group"
          aria-label="Noch einzuordnende Ereignisse"
        >
          {remaining.map((event) => (
            <button
              key={event.id}
              type="button"
              className="event-card"
              onClick={() => place(event.id)}
            >
              {event.text}
            </button>
          ))}
        </div>
      ) : null}

      {phase === 'feedback' && !last?.perfect ? (
        <div className="explanation bad feedback-pop">
          <p className="explanation-head">
            <strong>Richtige Reihenfolge</strong>
          </p>
          <ol className="correct-order">
            {correctOrder.map((event) => (
              <li key={event.id}>
                <span className="timeline-year-plain">{formatYear(event)}</span> {event.text}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="game-actions">
        {phase === 'order' ? (
          <Button
            variant="primary"
            size="lg"
            block
            icon="check"
            disabled={placed.length !== events.length}
            onClick={check}
          >
            Prüfen
          </Button>
        ) : (
          <Button size="lg" block iconRight="arrow" onClick={advance}>
            {roundIndex + 1 >= rounds.length ? 'Zum Ergebnis' : 'Nächste Runde'}
          </Button>
        )}
      </div>
    </div>
  );
}
