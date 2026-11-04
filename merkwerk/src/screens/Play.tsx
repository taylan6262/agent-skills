import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../App';
import { dailyChallenge } from '../game/daily';
import { effectiveDifficulty, type PlayKind } from '../game/adaptive';
import { getLevel, getWorld, isLevelUnlocked } from '../game/levels';
import {
  CATEGORY_IDS,
  MODE_IDS,
  type CategoryId,
  type GameResult,
  type ModeId,
} from '../game/types';
import { GAMES } from '../games/registry';
import { toDayKey } from '../lib/date';
import { goBack, navigate, searchParam } from '../lib/router';
import { randomSeed } from '../lib/rng';
import { recordResult, useSave } from '../state/store';
import { Button, Dialog, IconButton, Link } from '../ui/components';
import { Loading } from '../ui/Loading';
import { MODE_META, CATEGORY_META } from '../ui/meta';
import { useTitle } from '../ui/useTitle';

interface PlayConfig {
  kind: PlayKind;
  mode: ModeId;
  difficulty: number;
  seed: number;
  title: string;
  eyebrow: string;
  exitTo: string;
  levelId?: string;
  category?: CategoryId;
  reviewOnly?: boolean;
}

function GameRunner({ config }: { config: PlayConfig }) {
  const save = useSave();
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const [seed, setSeed] = useState(config.seed);
  const [progress, setProgress] = useState('');
  const Game = GAMES[config.mode];
  const meta = MODE_META[config.mode];
  useTitle(config.title);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Jede Runde wird genau einmal verbucht – auch wenn Klick und Auto-Weiter gleichzeitig auslösen.
  const recordedRun = useRef<number | null>(null);
  const onFinish = useCallback(
    (result: GameResult) => {
      if (recordedRun.current === run) return;
      recordedRun.current = run;
      recordResult(result, {
        kind: config.kind,
        ...(config.levelId ? { levelId: config.levelId } : {}),
      });
      navigate('/ergebnis', { replace: true });
    },
    [config.kind, config.levelId, run],
  );

  const restart = () => {
    setSeed(config.kind === 'daily' ? config.seed : randomSeed());
    setRun((r) => r + 1);
    setPaused(false);
  };

  return (
    <div className="play" data-mode={config.mode}>
      <header className="play-head">
        <div className="play-title">
          <span className="label muted">{config.eyebrow}</span>
          <span className="play-heading">{meta.name}</span>
        </div>
        <span className="play-progress" aria-live="polite">
          {progress}
        </span>
        <IconButton icon="pause" label="Pause" onClick={() => setPaused(true)} />
      </header>
      <h1 className="visually-hidden">{config.title}</h1>
      <div className="play-stage" aria-hidden={paused}>
        <Suspense fallback={<Loading />}>
          <Game
            key={run}
            difficulty={config.difficulty}
            seed={seed}
            paused={paused}
            colorPatterns={save.settings.colorPatterns}
            onFinish={onFinish}
            onProgress={setProgress}
            {...(config.category ? { category: config.category } : {})}
            {...(config.reviewOnly ? { reviewOnly: true } : {})}
          />
        </Suspense>
      </div>
      <Dialog
        open={paused}
        title="Pause"
        onClose={() => setPaused(false)}
        actions={
          <>
            <Button variant="primary" icon="play" onClick={() => setPaused(false)}>
              Weiterspielen
            </Button>
            <Button icon="reset" onClick={restart}>
              Neu starten
            </Button>
            <Button variant="ghost" onClick={() => goBack(config.exitTo)}>
              Beenden
            </Button>
          </>
        }
      >
        <p className="label muted">
          {meta.name} · Stufe {config.difficulty}
        </p>
        <ul className="howto-list">
          {meta.howTo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}

function Blocked({ text }: { text: string }) {
  useTitle('Nicht verfügbar');
  return (
    <section className="page narrow">
      <h1>Hier geht es noch nicht weiter.</h1>
      <p className="lead">{text}</p>
      <Link to="/karte" className="btn btn-primary">
        <span>Zur Karte</span>
      </Link>
    </section>
  );
}

export function PlayLevel({ params }: RouteProps) {
  const save = useSave();
  const level = getLevel(params.id ?? '');
  const [seed] = useState(randomSeed);
  if (!level) return <Blocked text="Dieses Level gibt es nicht." />;
  if (!isLevelUnlocked(level.id, save.levels))
    return <Blocked text="Dieses Level ist noch gesperrt." />;
  const world = getWorld(level.world);
  const config: PlayConfig = {
    kind: 'level',
    mode: level.mode,
    difficulty: effectiveDifficulty(level.baseDifficulty, save.adaptive[level.mode].offset),
    seed,
    title: `Level ${level.number}: ${MODE_META[level.mode].name}`,
    eyebrow: `Welt ${level.world} · ${world?.name ?? ''} · Level ${level.index}`,
    exitTo: `/level/${level.id}`,
    levelId: level.id,
    ...(level.category ? { category: level.category } : {}),
  };
  return <GameRunner config={config} />;
}

export function PlayTraining({ params, search }: RouteProps) {
  const save = useSave();
  const [seed] = useState(randomSeed);
  const mode = MODE_IDS.find((m) => m === params.mode);
  if (!mode) return <Blocked text="Diesen Modus gibt es nicht." />;
  const categoryParam = searchParam(search, 'kategorie');
  const category = CATEGORY_IDS.find((c) => c === categoryParam);
  const reviewOnly = searchParam(search, 'wiederholen') === '1';
  const eyebrow =
    mode === 'wissen' && category
      ? `Training · ${CATEGORY_META[category].name}`
      : reviewOnly
        ? 'Training · Wiederholen'
        : 'Freies Training';
  const config: PlayConfig = {
    kind: 'training',
    mode,
    difficulty: save.adaptive[mode].rating,
    seed,
    title: `Training: ${MODE_META[mode].name}`,
    eyebrow,
    exitTo: '/training',
    ...(category ? { category } : {}),
    ...(reviewOnly ? { reviewOnly: true } : {}),
  };
  return <GameRunner config={config} />;
}

export function PlayDaily() {
  const save = useSave();
  const [challenge] = useState(() => dailyChallenge(toDayKey(new Date()), save.adaptive));
  const config: PlayConfig = {
    kind: 'daily',
    mode: challenge.mode,
    difficulty: challenge.difficulty,
    seed: challenge.seed,
    title: `Tagesaufgabe: ${MODE_META[challenge.mode].name}`,
    eyebrow: 'Tagesaufgabe',
    exitTo: '/',
  };
  return <GameRunner config={config} />;
}
