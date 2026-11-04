import { useEffect } from 'react';
import {
  WORLDS,
  continueLevel,
  isLevelUnlocked,
  isWorldUnlocked,
  levelsOfWorld,
  starsOf,
  totalStars,
  worldStars,
  type LevelDef,
} from '../game/levels';
import { useSave } from '../state/store';
import { Link, PageTitle, StarRow } from '../ui/components';
import { Icon } from '../ui/icons';
import { MODE_META } from '../ui/meta';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

const COLS = 3;

function position(index: number): { row: number; col: number } {
  const row = Math.floor(index / COLS);
  const c = index % COLS;
  return { row, col: row % 2 === 0 ? c : COLS - 1 - c };
}

function LevelNode({ level, unlocked, current, stars }: { level: LevelDef; unlocked: boolean; current: boolean; stars: 0 | 1 | 2 | 3 }) {
  const meta = MODE_META[level.mode];
  const { row, col } = position(level.index - 1);
  const style = { gridRow: row + 1, gridColumn: col + 1 };
  const label = `Level ${level.index}, ${meta.name}${level.master ? ', Meisterstück' : ''}`;
  if (!unlocked) {
    return (
      <span className="node is-locked" style={style} role="img" aria-label={`${label}, gesperrt`}>
        <span className="node-shape">
          <Icon name="lock" size={22} />
        </span>
        <span className="node-number">{level.index}</span>
      </span>
    );
  }
  return (
    <Link
      to={`/level/${level.id}`}
      className={`node ${current ? 'is-current' : ''} ${level.master ? 'is-master' : ''}`}
      style={style}
      aria-label={`${label}, ${stars} von 3 Sternen${current ? ', hier geht es weiter' : ''}`}
      data-level={level.id}
    >
      <span className="node-shape" data-shape={meta.shape}>
        <Shape shape={meta.shape} color={meta.color} />
        <span className={`node-index numeral ${meta.color === 'gelb' ? 'on-light' : 'on-dark'}`}>{level.index}</span>
      </span>
      <StarRow stars={stars} size={14} />
    </Link>
  );
}

export function WorldMap() {
  const save = useSave();
  const total = totalStars(save.levels);
  const current = continueLevel(save.levels);
  useTitle('Karte');

  useEffect(() => {
    const node = document.querySelector<HTMLElement>(`[data-level="${current.id}"]`);
    if (node && current.world > 1) node.scrollIntoView({ block: 'center' });
  }, [current.id, current.world]);

  return (
    <section className="page map">
      <div className="map-head">
        <PageTitle>Karte</PageTitle>
        <span className="chip chip-yellow" aria-label={`${total} von 216 Sternen gesammelt`}>
          <Icon name="xp" size={16} /> {total} / 216
        </span>
      </div>
      <p className="lead">Sechs Welten, je zwölf Level. Sterne öffnen neue Welten.</p>

      {WORLDS.map((world) => {
        const open = isWorldUnlocked(world.id, save.levels);
        const levels = levelsOfWorld(world.id);
        const got = worldStars(save.levels, world.id);
        const points = levels
          .map((l) => {
            const { row, col } = position(l.index - 1);
            return `${(col + 0.5) * 100},${(row + 0.5) * 100}`;
          })
          .join(' ');
        return (
          <article key={world.id} className={`world tone-${world.color} ${open ? '' : 'is-locked'}`} aria-labelledby={`welt-${world.id}`}>
            <header className="world-head">
              <span className="world-number numeral" aria-hidden="true">
                {String(world.id).padStart(2, '0')}
              </span>
              <div>
                <h2 id={`welt-${world.id}`}>
                  <span className="visually-hidden">Welt {world.id}: </span>
                  {world.name}
                </h2>
                <p className="muted">{world.subtitle}</p>
              </div>
              <span className="world-stars label">
                {got}/36 <span className="visually-hidden">Sterne</span>
              </span>
            </header>
            {open ? null : (
              <p className="world-lock">
                <Icon name="lock" size={18} />
                <span>
                  Öffnet bei {world.requiredStars} Sternen – dir fehlen noch {world.requiredStars - total}.
                </span>
              </p>
            )}
            {open ? (
              <div className="world-path">
                <svg className="world-line" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <polyline points={points} />
                </svg>
                {levels.map((level) => (
                  <LevelNode
                    key={level.id}
                    level={level}
                    unlocked={isLevelUnlocked(level.id, save.levels)}
                    current={level.id === current.id}
                    stars={starsOf(save.levels, level.id)}
                  />
                ))}
              </div>
            ) : (
              <ol className="world-strip" aria-label={`12 Level, gesperrt`}>
                {levels.map((level) => (
                  <li key={level.id} className="strip-cell">
                    <Shape shape={MODE_META[level.mode].shape} color="tinte" />
                    <span className="visually-hidden">
                      Level {level.index}: {MODE_META[level.mode].name}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        );
      })}
    </section>
  );
}
