import type { RouteProps } from '../App';
import { effectiveDifficulty } from '../game/adaptive';
import { getLevel, getWorld, isLevelUnlocked, starsOf } from '../game/levels';
import { STAR_THRESHOLDS } from '../game/scoring';
import { navigate } from '../lib/router';
import { useSave } from '../state/store';
import { Button, Link, PageTitle, StarRow, TopBar } from '../ui/components';
import { describeParams } from '../ui/describe';
import { Icon } from '../ui/icons';
import { MODE_META } from '../ui/meta';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

export function LevelIntro({ params }: RouteProps) {
  const save = useSave();
  const level = getLevel(params.id ?? '');
  useTitle(level ? `Level ${level.number}` : 'Level');

  if (!level) {
    return (
      <>
        <TopBar title="Level" back="/karte" />
        <section className="page narrow">
          <PageTitle>Dieses Level gibt es nicht.</PageTitle>
          <Link to="/karte" className="btn btn-primary">
            <span>Zur Karte</span>
          </Link>
        </section>
      </>
    );
  }

  const world = getWorld(level.world);
  const meta = MODE_META[level.mode];
  const unlocked = isLevelUnlocked(level.id, save.levels);
  const offset = save.adaptive[level.mode].offset;
  const difficulty = effectiveDifficulty(level.baseDifficulty, offset);
  const progress = save.levels[level.id];
  const stars = starsOf(save.levels, level.id);

  return (
    <>
      <TopBar title={world ? `Welt ${world.id} · ${world.name}` : 'Level'} back="/karte" />
      <section className={`page level-intro tone-${meta.color}`}>
        <div className="intro-hero">
          <div className="intro-shape">
            <Shape shape={meta.shape} color={meta.color} size="100%" />
            <span
              className={`intro-number numeral ${meta.color === 'gelb' ? 'on-light' : 'on-dark'}`}
            >
              {level.index}
            </span>
          </div>
          <div className="intro-text">
            <span className="label muted">
              Level {level.number} von 72{level.master ? ' · Meisterstück' : ''}
            </span>
            <PageTitle>{meta.name}</PageTitle>
            <p className="lead">{meta.short}</p>
          </div>
        </div>

        <div className="intro-grid">
          <div>
            <h2 className="section-title">So geht’s</h2>
            <ol className="howto-list numbered">
              {meta.howTo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="section-title">Stufe {difficulty}</h2>
            <ul className="param-list">
              {describeParams(level.mode, difficulty, level.category).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {offset !== 0 ? (
              <p className="muted small">
                {offset > 0
                  ? `+${offset}: an deine Leistung angepasst (schwerer).`
                  : `${offset}: an deine Leistung angepasst (leichter).`}
              </p>
            ) : null}
          </div>
        </div>

        <div className="intro-stars">
          <div>
            <span className="label muted">Dein Bestwert</span>
            <StarRow stars={stars} size={28} />
            {progress?.plays ? (
              <span className="muted small">
                {progress.plays}× gespielt · Bestleistung{' '}
                {Math.round(progress.bestPerformance * 100)} %
              </span>
            ) : (
              <span className="muted small">Noch nicht gespielt</span>
            )}
          </div>
          <ul className="threshold-list" aria-label="Sterne-Schwellen">
            {STAR_THRESHOLDS.map((t, i) => (
              <li key={t}>
                <StarRow stars={(i + 1) as 1 | 2 | 3} size={14} label={`${i + 1} Sterne`} /> ab{' '}
                {Math.round(t * 100)} %
              </li>
            ))}
          </ul>
        </div>

        {unlocked ? (
          <Button
            variant="primary"
            size="lg"
            block
            icon="play"
            onClick={() => navigate(`/spiel/level/${level.id}`)}
          >
            Level starten
          </Button>
        ) : (
          <p className="locked-note">
            <Icon name="lock" size={18} /> Bestehe zuerst das vorige Level mit mindestens einem
            Stern.
          </p>
        )}
      </section>
    </>
  );
}
