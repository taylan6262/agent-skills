import { useEffect, useState } from 'react';
import { getAchievement } from '../game/achievements';
import { getLevel, getWorld } from '../game/levels';
import { levelFromXp } from '../game/scoring';
import { feedback } from '../lib/feedback';
import { formatPercent } from '../lib/math';
import { useReducedMotion } from '../lib/motion';
import { navigate } from '../lib/router';
import { useLastOutcome, useSave } from '../state/store';
import { Button, Meter, PageTitle } from '../ui/components';
import { Icon, StarIcon } from '../ui/icons';
import { MODE_META } from '../ui/meta';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

const HEADLINES = ['Knapp daneben', 'Geschafft', 'Stark', 'Meisterhaft'] as const;

const TIPS: Record<string, string> = {
  blitzbild:
    'Tipp: Merke dir Muster statt einzelner Felder – etwa „Diagonale“ oder „zwei oben links“.',
  detailblick: 'Tipp: Geh die Szene in fester Reihenfolge durch – erst Ecken, dann Farben zählen.',
  zahlenspur: 'Tipp: Bilde Päckchen aus zwei oder drei Ziffern, wie bei einer Telefonnummer.',
  tempo: 'Tipp: Lies bei „Farbe ↔ Wort“ nicht das Wort, sondern achte zuerst auf die Fläche.',
  wissen: 'Tipp: Falsche Antworten kommen wieder – genau so wächst dein Wissen.',
};

export function Result() {
  const outcome = useLastOutcome();
  const save = useSave();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useTitle('Ergebnis');

  useEffect(() => {
    if (!outcome) navigate('/', { replace: true });
  }, [outcome]);

  useEffect(() => {
    if (!outcome || reduced) return;
    const timers: number[] = [];
    for (let i = 1; i <= outcome.stars; i++) {
      timers.push(
        window.setTimeout(
          () => {
            setShown(i);
            feedback('star', i - 1);
          },
          350 + i * 380,
        ),
      );
    }
    if (outcome.playerLevelAfter > outcome.playerLevelBefore) {
      timers.push(window.setTimeout(() => feedback('levelup'), 600 + outcome.stars * 380));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [outcome, reduced]);

  if (!outcome) return null;

  const meta = MODE_META[outcome.mode];
  const visibleStars = reduced ? outcome.stars : Math.min(shown, outcome.stars);
  const level = outcome.levelId ? getLevel(outcome.levelId) : undefined;
  const world = level ? getWorld(level.world) : undefined;
  const player = levelFromXp(save.player.xp);
  const eyebrow =
    outcome.kind === 'level' && level
      ? `Welt ${level.world} · ${world?.name ?? ''} · Level ${level.index}`
      : outcome.kind === 'daily'
        ? 'Tagesaufgabe'
        : 'Freies Training';

  const replay = () => {
    if (outcome.kind === 'level' && level) navigate(`/spiel/level/${level.id}`, { replace: true });
    else if (outcome.kind === 'daily') navigate('/spiel/tagesaufgabe', { replace: true });
    else navigate(`/spiel/training/${outcome.mode}`, { replace: true });
  };

  const next = () => {
    if (outcome.kind === 'level') {
      if (outcome.nextLevelId) navigate(`/level/${outcome.nextLevelId}`, { replace: true });
      else navigate('/karte', { replace: true });
    } else if (outcome.kind === 'daily') navigate('/', { replace: true });
    else navigate('/training', { replace: true });
  };

  const nextLabel =
    outcome.kind === 'level'
      ? outcome.nextLevelId
        ? 'Weiter'
        : 'Zur Karte'
      : outcome.kind === 'daily'
        ? 'Zur Startseite'
        : 'Zum Training';

  return (
    <section className="page result" data-stars={outcome.stars}>
      <div className="result-head">
        <span className="label muted">{eyebrow}</span>
        <PageTitle>{HEADLINES[outcome.stars]}</PageTitle>
        <p className="lead">
          {meta.name} · Stufe {outcome.difficulty}
        </p>
      </div>

      <div className="result-stars" role="img" aria-label={`${outcome.stars} von 3 Sternen`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`result-star ${i <= visibleStars ? 'is-on' : ''}`}>
            <StarIcon filled={i <= visibleStars} size={84} />
          </span>
        ))}
      </div>
      {outcome.kind === 'level' && outcome.stars < 3 ? (
        <p className="result-hint muted">
          {outcome.stars === 0
            ? 'Ab 50 % Leistung gibt es den ersten Stern.'
            : outcome.stars === 1
              ? 'Ab 75 % gibt es 2 Sterne.'
              : 'Ab 90 % gibt es 3 Sterne.'}
        </p>
      ) : null}

      <dl className="result-figures">
        <div>
          <dt className="label muted">Leistung</dt>
          <dd className="numeral">{formatPercent(outcome.performance)}</dd>
        </div>
        <div>
          <dt className="label muted">Punkte</dt>
          <dd className="numeral">{outcome.score.toLocaleString('de-DE')}</dd>
        </div>
        <div>
          <dt className="label muted">Richtig</dt>
          <dd className="numeral">
            {outcome.correct}/{outcome.total}
          </dd>
        </div>
      </dl>

      <div className="result-xp">
        <div className="result-xp-row">
          <span className="chip chip-yellow">
            <Icon name="xp" size={16} /> +{outcome.xp.total} XP
          </span>
          <span className="label">Spielerlevel {player.level}</span>
        </div>
        <Meter
          value={player.current}
          max={player.needed}
          label={`Fortschritt zu Spielerlevel ${player.level + 1}`}
          color="yellow"
        />
        <p className="muted small">
          {player.needed - player.current} XP bis Level {player.level + 1}
          {outcome.dailyCompleted ? ' · Tagesaufgabe erledigt' : ''}
        </p>
      </div>

      <div className="result-better">
        <h2 className="section-title">Was besser wurde</h2>
        {outcome.improvements.length > 0 ? (
          <ul className="better-list">
            {outcome.improvements.map((line) => (
              <li key={line}>
                <Icon name="check" size={18} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{TIPS[outcome.mode]}</p>
        )}
        {outcome.adaptiveChange !== 0 ? (
          <p className={`adaptive-note ${outcome.adaptiveChange > 0 ? 'up' : 'down'}`}>
            <Icon name={outcome.adaptiveChange > 0 ? 'arrow' : 'info'} size={18} />
            {outcome.adaptiveChange > 0
              ? 'Zweimal in Folge sehr stark – die nächste Runde wird etwas schwerer.'
              : 'Zweimal knapp verfehlt – wir machen es dir etwas leichter.'}
          </p>
        ) : null}
      </div>

      {outcome.newAchievements.length > 0 ? (
        <div className="result-achievements">
          <h2 className="section-title">Neu freigeschaltet</h2>
          <ul className="badge-list">
            {outcome.newAchievements.map((id) => {
              const def = getAchievement(id);
              if (!def) return null;
              return (
                <li key={id} className="badge-item is-new">
                  <Shape shape={def.shape} color={def.color} size={44} />
                  <span>
                    <strong>{def.title}</strong>
                    <span className="muted small">{def.description}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="result-actions">
        <Button icon="reset" onClick={replay}>
          Nochmal
        </Button>
        <Button variant="primary" iconRight="arrow" onClick={next}>
          {nextLabel}
        </Button>
      </div>
    </section>
  );
}
