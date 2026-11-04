import { isDue } from '../game/leitner';
import { CATEGORY_IDS, MODE_IDS } from '../game/types';
import { toDayKey } from '../lib/date';
import { navigate } from '../lib/router';
import { useSave } from '../state/store';
import { Link, PageTitle } from '../ui/components';
import { describeParams } from '../ui/describe';
import { Icon } from '../ui/icons';
import { CATEGORY_META, MODE_META } from '../ui/meta';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

export function Training() {
  const save = useSave();
  useTitle('Training');
  const today = toDayKey(new Date());
  const due = Object.values(save.leitner).filter((card) => isDue(card, today)).length;

  return (
    <section className="page training">
      <PageTitle>Freies Training</PageTitle>
      <p className="lead">
        Jeder Modus einzeln, ohne Sterne-Druck. Die Stufe passt sich nach jeder Runde an dich an.
      </p>

      <ul className="mode-list">
        {MODE_IDS.map((mode) => {
          const meta = MODE_META[mode];
          const rating = save.adaptive[mode].rating;
          return (
            <li key={mode} className={`mode-row tone-${meta.color}`}>
              <span className="mode-shape" aria-hidden="true">
                <Shape shape={meta.shape} color={meta.color} />
              </span>
              <span className="mode-text">
                <span className="mode-name">
                  <h2>{meta.name}</h2>
                  <span className="chip">Stufe {rating}</span>
                </span>
                <span className="muted small">{meta.short}</span>
                <span className="mode-params small">
                  {describeParams(mode, rating).slice(0, 2).join(' · ')}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-primary mode-play"
                aria-label={`${meta.name} spielen, Stufe ${rating}`}
                onClick={() => navigate(`/spiel/training/${mode}`)}
              >
                <span className="visually-hidden">Spielen</span>
                <Icon name="play" size={22} />
              </button>
            </li>
          );
        })}
      </ul>

      <div>
        <h2 className="section-title">Wissen nach Gebiet</h2>
        <div className="category-grid">
          {CATEGORY_IDS.map((category) => (
            <Link
              key={category}
              to={`/spiel/training/wissen?kategorie=${category}`}
              className="category-tile"
            >
              <Icon name={CATEGORY_META[category].icon} size={28} />
              <span>{CATEGORY_META[category].name}</span>
            </Link>
          ))}
        </div>
        <Link to="/spiel/training/wissen?wiederholen=1" className="review-link training-review">
          <Icon name="reset" />
          <span>
            <strong>Wiederholen</strong>
            <span className="muted small">
              {due > 0
                ? `${due} ${due === 1 ? 'Frage ist' : 'Fragen sind'} heute fällig (Leitner-System).`
                : 'Gerade ist nichts fällig – du bekommst neue und bald fällige Fragen.'}
            </span>
          </span>
          <Icon name="arrow" />
        </Link>
      </div>
    </section>
  );
}
