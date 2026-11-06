import { ACHIEVEMENTS, isAchieved } from '../game/achievements';
import { formatDayShort } from '../lib/date';
import { factsFromSave } from '../state/apply';
import { useSave } from '../state/store';
import { Meter, PageTitle } from '../ui/components';
import { Icon } from '../ui/icons';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

export function Achievements() {
  const save = useSave();
  useTitle('Erfolge');
  const facts = factsFromSave(save);
  const unlockedCount = ACHIEVEMENTS.filter(
    (a) => save.achievements[a.id] !== undefined || isAchieved(a, facts),
  ).length;

  return (
    <section className="page achievements">
      <PageTitle>Erfolge</PageTitle>
      <div className="achievement-head">
        <p className="big-figure">
          <span className="numeral">{unlockedCount}</span>
          <span>von {ACHIEVEMENTS.length} freigeschaltet</span>
        </p>
        <Meter
          value={unlockedCount}
          max={ACHIEVEMENTS.length}
          label="Freigeschaltete Erfolge"
          color="yellow"
        />
      </div>

      <ul className="achievement-grid">
        {ACHIEVEMENTS.map((def) => {
          const unlockedDay = save.achievements[def.id];
          const unlocked = unlockedDay !== undefined || isAchieved(def, facts);
          const [current, target] = def.progress(facts);
          return (
            <li key={def.id} className={`achievement ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
              <span className="achievement-badge" aria-hidden="true">
                {unlocked ? (
                  <Shape shape={def.shape} color={def.color} />
                ) : (
                  <Icon name="lock" size={22} />
                )}
              </span>
              <span className="achievement-text">
                <strong>{def.title}</strong>
                <span className="small">{def.description}</span>
                {unlocked ? (
                  <span className="muted small">
                    <Icon name="check" size={14} className="inline-icon" /> Freigeschaltet
                    {unlockedDay ? ` am ${formatDayShort(unlockedDay)}` : ''}
                  </span>
                ) : target > 1 ? (
                  <span className="achievement-progress">
                    <Meter
                      value={current}
                      max={target}
                      label={`${def.title}: ${current} von ${target}`}
                      color="ink"
                    />
                    <span className="muted small">
                      {current.toLocaleString('de-DE')} / {target.toLocaleString('de-DE')}
                    </span>
                  </span>
                ) : (
                  <span className="muted small">Noch nicht erreicht</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
