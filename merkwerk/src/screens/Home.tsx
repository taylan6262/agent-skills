import { dailyChallenge, isDailyDone } from '../game/daily';
import { isDue } from '../game/leitner';
import { continueLevel, getWorld, starsOf, totalStars } from '../game/levels';
import { playedToday, visibleStreak } from '../game/progression';
import { levelFromXp } from '../game/scoring';
import { toDayKey } from '../lib/date';
import { navigate } from '../lib/router';
import { useSave } from '../state/store';
import { Button, IconButton, Link, Meter, PageTitle, StarRow } from '../ui/components';
import { Icon } from '../ui/icons';
import { LogoMark, Wordmark } from '../ui/Logo';
import { MODE_META } from '../ui/meta';
import { Shape } from '../ui/Shape';
import { useTitle } from '../ui/useTitle';

function greeting(hour: number): string {
  if (hour < 5) return 'Gute Nacht';
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export function Home() {
  const save = useSave();
  useTitle('');
  const now = new Date();
  const today = toDayKey(now);
  const player = levelFromXp(save.player.xp);
  const next = continueLevel(save.levels);
  const nextMeta = MODE_META[next.mode];
  const world = getWorld(next.world);
  const streak = visibleStreak(save.streak, today);
  const doneToday = playedToday(save.streak, today);
  const daily = dailyChallenge(today, save.adaptive);
  const dailyDone = isDailyDone(save.daily.lastCompletedDay, today);
  const dailyMeta = MODE_META[daily.mode];
  const stars = totalStars(save.levels);
  const dueCount = Object.values(save.leitner).filter((card) => isDue(card, today)).length;
  const nextStars = starsOf(save.levels, next.id);

  return (
    <div className="page home">
      <header className="home-bar">
        <span className="home-brand">
          <LogoMark size={36} />
          <Wordmark />
        </span>
        <IconButton
          icon="settings"
          label="Einstellungen"
          onClick={() => navigate('/einstellungen')}
        />
      </header>

      <section className="home-hello" aria-labelledby="home-title">
        <PageTitle>
          <span id="home-title">{greeting(now.getHours())}.</span>
        </PageTitle>
        <div className="home-level">
          <span className="label">Spielerlevel {player.level}</span>
          <Meter
            value={player.current}
            max={player.needed}
            label={`Fortschritt zu Spielerlevel ${player.level + 1}`}
            color="yellow"
          />
          <span className="muted small">
            {player.current} / {player.needed} XP
          </span>
        </div>
      </section>

      <section className={`continue tone-${nextMeta.color}`} aria-labelledby="continue-title">
        <div className="continue-shape" aria-hidden="true">
          <Shape shape={nextMeta.shape} color={nextMeta.color} />
          <span className={`numeral ${nextMeta.color === 'gelb' ? 'on-light' : 'on-dark'}`}>
            {next.index}
          </span>
        </div>
        <div className="continue-text">
          <span className="label muted">
            Welt {next.world} · {world?.name} · Level {next.index}
          </span>
          <h2 id="continue-title">{nextMeta.name}</h2>
          {nextStars > 0 ? (
            <StarRow stars={nextStars} size={16} />
          ) : (
            <p className="muted small">{nextMeta.short}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          block
          icon="play"
          onClick={() => navigate(`/level/${next.id}`)}
        >
          {save.player.gamesPlayed === 0 ? 'Erstes Level starten' : 'Weiterspielen'}
        </Button>
      </section>

      <div className="home-grid">
        <section className="stat-block streak-block" aria-labelledby="streak-title">
          <h2 id="streak-title" className="label">
            Serie
          </h2>
          <p className="big-figure">
            <span className="numeral">{streak}</span>
            <span>{streak === 1 ? 'Tag' : 'Tage'} in Folge</span>
          </p>
          <p className="muted small">
            {doneToday ? (
              <>
                <Icon name="check" size={14} className="inline-icon" /> Heute schon gespielt
              </>
            ) : streak > 0 ? (
              'Spiel heute eine Runde, um die Serie zu halten.'
            ) : (
              'Eine Runde am Tag genügt.'
            )}
          </p>
        </section>

        <section className="stat-block" aria-labelledby="stars-title">
          <h2 id="stars-title" className="label">
            Sterne
          </h2>
          <p className="big-figure">
            <span className="numeral">{stars}</span>
            <span>von 216</span>
          </p>
          <Link to="/karte" className="text-link">
            Zur Karte <Icon name="arrow" size={16} className="inline-icon" />
          </Link>
        </section>
      </div>

      <section className={`daily ${dailyDone ? 'is-done' : ''}`} aria-labelledby="daily-title">
        <div className="daily-text">
          <span className="label">
            <Icon name="calendar" size={16} className="inline-icon" /> Tagesaufgabe
          </span>
          <h2 id="daily-title">{dailyMeta.name}</h2>
          <p className="small">
            Stufe {daily.difficulty} ·{' '}
            {dailyDone
              ? 'Heute erledigt – morgen gibt es eine neue.'
              : 'Mindestens 1 Stern für den Bonus von 50+ XP.'}
          </p>
        </div>
        <Shape
          shape={dailyMeta.shape}
          color={dailyMeta.color === 'gelb' ? 'tinte' : dailyMeta.color}
          size={56}
          className="daily-shape"
        />
        <Button
          variant={dailyDone ? 'secondary' : 'blue'}
          block
          icon={dailyDone ? 'reset' : 'play'}
          onClick={() => navigate('/spiel/tagesaufgabe')}
        >
          {dailyDone ? 'Nochmal spielen' : 'Tagesaufgabe starten'}
        </Button>
      </section>

      {dueCount > 0 ? (
        <Link to="/spiel/training/wissen?wiederholen=1" className="review-link">
          <Icon name="book" />
          <span>
            <strong>
              {dueCount} {dueCount === 1 ? 'Frage' : 'Fragen'} zur Wiederholung fällig
            </strong>
            <span className="muted small">Leitner-System: Jetzt festigen, was noch wackelt.</span>
          </span>
          <Icon name="arrow" />
        </Link>
      ) : null}

      <footer className="home-footer">
        <Link to="/impressum">Impressum</Link>
        <Link to="/datenschutz">Datenschutz</Link>
      </footer>
    </div>
  );
}
