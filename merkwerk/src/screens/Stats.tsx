import { useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { summarizeLeitner } from '../game/leitner';
import { totalStars } from '../game/levels';
import { CATEGORY_IDS, SKILL_IDS, type SkillId } from '../game/types';
import { formatDayShort, toDayKey } from '../lib/date';
import { useSave } from '../state/store';
import { skillSeries, trendOf } from '../state/statsView';
import { Link, Meter, PageTitle } from '../ui/components';
import { COLOR_VAR } from '../ui/colors';
import { Icon } from '../ui/icons';
import { LineChart, MarkerIcon, type ChartSeries, type MarkerShape } from '../ui/LineChart';
import { CATEGORY_META, SKILL_META } from '../ui/meta';
import { useTitle } from '../ui/useTitle';

const MARKERS: Record<SkillId, MarkerShape> = {
  gedaechtnis: 'square',
  tempo: 'triangle',
  lernen: 'diamond',
  wissen: 'circle',
};
const DASHES: Record<SkillId, string | undefined> = {
  gedaechtnis: undefined,
  tempo: '6 3',
  lernen: '2 3',
  wissen: undefined,
};

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function Stats() {
  const save = useSave();
  useTitle('Statistik');
  const [hidden, setHidden] = useState<SkillId[]>([]);
  const today = toDayKey(new Date());
  const series = skillSeries(save.stats.days, 30);
  const leitner = summarizeLeitner(QUESTIONS, save.leitner, today);
  const accuracy =
    save.stats.questionsAnswered > 0
      ? Math.round((save.stats.questionsCorrect / save.stats.questionsAnswered) * 100)
      : null;

  const chartSeries: ChartSeries[] = SKILL_IDS.filter((skill) => !hidden.includes(skill)).map(
    (skill) => ({
      id: skill,
      name: SKILL_META[skill].name,
      color: COLOR_VAR[SKILL_META[skill].color],
      marker: MARKERS[skill],
      ...(DASHES[skill] ? { dash: DASHES[skill] } : {}),
      cased: SKILL_META[skill].color === 'gelb',
      values: series.values[skill],
    }),
  );

  const bests: [string, string][] = [
    [
      'Blitzbild: größtes fehlerfreies Raster',
      save.bests.perfectGrid ? `${save.bests.perfectGrid} × ${save.bests.perfectGrid}` : '–',
    ],
    ['Zahlenspur vorwärts', save.bests.spanForward ? `${save.bests.spanForward} Ziffern` : '–'],
    ['Zahlenspur rückwärts', save.bests.spanBackward ? `${save.bests.spanBackward} Ziffern` : '–'],
    ['Detailblick: fehlerfreie Szenen', String(save.bests.perfectScenes)],
    ['Tempo-Duell: beste Combo', save.bests.tempoCombo ? String(save.bests.tempoCombo) : '–'],
    [
      'Tempo-Duell: Punkte',
      save.bests.tempoScore ? save.bests.tempoScore.toLocaleString('de-DE') : '–',
    ],
    [
      'Tempo-Duell: Reaktionszeit (Median)',
      save.bests.tempoRtMs ? `${save.bests.tempoRtMs} ms` : '–',
    ],
    ['Wissen: Trefferquote gesamt', accuracy !== null ? `${accuracy} %` : '–'],
    ['Längste Serie', `${save.streak.best} ${save.streak.best === 1 ? 'Tag' : 'Tage'}`],
  ];

  const boxLabels = ['Neu', 'Fach 1', 'Fach 2', 'Fach 3', 'Fach 4', 'Fach 5'];
  const maxBox = Math.max(1, ...leitner.boxes.slice(1));

  return (
    <section className="page stats">
      <PageTitle>Statistik</PageTitle>

      <dl className="summary-grid">
        <div>
          <dt className="label muted">Runden</dt>
          <dd className="numeral">{save.player.gamesPlayed}</dd>
        </div>
        <div>
          <dt className="label muted">Spielzeit</dt>
          <dd className="numeral">{formatDuration(save.player.playTimeMs)}</dd>
        </div>
        <div>
          <dt className="label muted">Sterne</dt>
          <dd className="numeral">{totalStars(save.levels)}</dd>
        </div>
        <div>
          <dt className="label muted">Erfolge</dt>
          <dd className="numeral">{Object.keys(save.achievements).length}</dd>
        </div>
      </dl>

      <div>
        <h2 className="section-title">Entwicklung pro Fähigkeit</h2>
        <p className="muted small">
          Leistungsindex 0–100 je Tag: Trefferquote gewichtet mit der gespielten Stufe. Beim Lernen
          zählt der Fortschritt deiner Fragen durch die Leitner-Fächer.
        </p>
        {series.days.length === 0 ? (
          <div className="empty-state">
            <Icon name="stats" size={32} />
            <p>Noch keine Daten. Spiel ein paar Runden – dann entsteht hier deine Kurve.</p>
            <Link to="/training" className="btn btn-primary">
              <span>Zum Training</span>
            </Link>
          </div>
        ) : (
          <>
            <div
              className="chart-filters"
              role="group"
              aria-label="Fähigkeiten ein- oder ausblenden"
            >
              {SKILL_IDS.map((skill) => {
                const on = !hidden.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    className={`filter-chip ${on ? 'is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() =>
                      setHidden(on ? [...hidden, skill] : hidden.filter((h) => h !== skill))
                    }
                  >
                    <MarkerIcon shape={MARKERS[skill]} color={COLOR_VAR[SKILL_META[skill].color]} />
                    {SKILL_META[skill].name}
                  </button>
                );
              })}
            </div>
            <LineChart
              days={series.days}
              series={chartSeries}
              label="Leistungsindex der Fähigkeiten über die letzten Spieltage"
            />
            {series.days.length === 1 ? (
              <p className="muted small">Ab dem zweiten Spieltag wird daraus eine Kurve.</p>
            ) : null}
            <ul className="trend-list">
              {SKILL_IDS.map((skill) => {
                const trend = trendOf(series.values[skill]);
                return (
                  <li key={skill}>
                    <MarkerIcon shape={MARKERS[skill]} color={COLOR_VAR[SKILL_META[skill].color]} />
                    <span className="trend-name">{SKILL_META[skill].name}</span>
                    <span className="numeral trend-value">{trend.latest ?? '–'}</span>
                    <span className="muted small">
                      {trend.change === null
                        ? 'noch kein Verlauf'
                        : trend.change >= 0
                          ? `+${trend.change} seit ${formatDayShort(series.days[0] ?? today)}`
                          : `${trend.change} seit ${formatDayShort(series.days[0] ?? today)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <details className="table-toggle">
              <summary>Als Tabelle anzeigen</summary>
              <div className="table-scroll">
                <table>
                  <caption className="visually-hidden">Leistungsindex je Tag und Fähigkeit</caption>
                  <thead>
                    <tr>
                      <th scope="col">Tag</th>
                      {SKILL_IDS.map((skill) => (
                        <th key={skill} scope="col">
                          {SKILL_META[skill].name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {series.days.map((day, i) => (
                      <tr key={day}>
                        <th scope="row">{formatDayShort(day)}</th>
                        {SKILL_IDS.map((skill) => (
                          <td key={skill}>{series.values[skill][i] ?? '–'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </div>

      <div>
        <h2 className="section-title">Bestwerte</h2>
        <dl className="best-list">
          {bests.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="section-title">Lernstand der Wissensfragen</h2>
        <p className="muted small">
          {leitner.seen} von {leitner.total} Fragen gesehen · {leitner.mastered} sicher gelernt
          (Fach 4–5) · {leitner.due} heute fällig
        </p>
        <ol className="box-chart" aria-label="Gesehene Fragen je Leitner-Fach">
          {leitner.boxes.map((count, i) =>
            i === 0 ? null : (
              <li key={boxLabels[i]}>
                <span className="box-count">{count}</span>
                <span
                  className="box-bar"
                  style={{ height: `${Math.max(2, (count / maxBox) * 100)}%` }}
                />
                <span className="box-label">{boxLabels[i]}</span>
              </li>
            ),
          )}
        </ol>
        <p className="muted small">Noch nie gestellt: {leitner.boxes[0] ?? 0} Fragen.</p>
        <ul className="category-progress">
          {CATEGORY_IDS.map((category) => {
            const pool = QUESTIONS.filter((q) => q.category === category);
            const summary = summarizeLeitner(pool, save.leitner, today);
            return (
              <li key={category}>
                <span className="category-progress-name">
                  <Icon name={CATEGORY_META[category].icon} size={18} />{' '}
                  {CATEGORY_META[category].name}
                </span>
                <Meter
                  value={summary.mastered}
                  max={summary.total}
                  label={`${CATEGORY_META[category].name}: ${summary.mastered} von ${summary.total} sicher gelernt`}
                />
                <span className="muted small">
                  {summary.mastered}/{summary.total} sicher · {summary.seen} gesehen
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
