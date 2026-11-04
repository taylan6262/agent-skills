import { useCallback, useRef, useState } from 'react';
import type { RouteProps } from '../App';
import { generateSequence, MAX_SPAN } from '../game/modes/zahlenspur';
import { placementFromSpan, type PlacementResult } from '../game/placement';
import { Keypad } from '../games/Keypad';
import { usePausableTimeout } from '../games/hooks';
import { feedback, playSound } from '../lib/feedback';
import { navigate, searchParam } from '../lib/router';
import { createRng, randomSeed } from '../lib/rng';
import { completeOnboarding, updateSettings, useSave } from '../state/store';
import { Button, PageTitle } from '../ui/components';
import { Icon, type IconName } from '../ui/icons';
import { Shape } from '../ui/Shape';
import { Toggle } from '../ui/Toggle';
import { useTitle } from '../ui/useTitle';

const STEPS = 3;

function StepDots({ step }: { step: number }) {
  return (
    <div className="step-dots" role="img" aria-label={`Schritt ${step} von ${STEPS}`}>
      {Array.from({ length: STEPS }, (_, i) => (
        <span
          key={i}
          className={`step-dot ${i + 1 === step ? 'is-current' : i + 1 < step ? 'is-done' : ''}`}
        />
      ))}
    </div>
  );
}

const SKILLS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'eye',
    title: 'Visuelles Gedächtnis',
    text: 'Raster, Szenen und Positionen kurz ansehen und wiedergeben.',
  },
  { icon: 'bolt', title: 'Tempo', text: 'Schnelle Ja/Nein-Entscheidungen gegen die Uhr.' },
  { icon: 'reset', title: 'Lernen', text: 'Falsch beantwortete Fragen kommen gezielt wieder.' },
  { icon: 'book', title: 'Wissen', text: 'Über 300 Fragen aus sechs Wissensgebieten.' },
];

type TestPhase = 'intro' | 'show' | 'input' | 'feedback' | 'result';

function PlacementTest({
  onDone,
}: {
  onDone: (span: number | null, placement: PlacementResult | null) => void;
}) {
  const [seed] = useState(randomSeed);
  const [length, setLength] = useState(3);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [shown, setShown] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState<number[]>([]);
  const [lastOk, setLastOk] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);
  const sequence = generateSequence(length, createRng(seed + length));

  usePausableTimeout(
    () => {
      if (visible) {
        setVisible(false);
        return;
      }
      if (shown + 1 >= sequence.length) {
        setPhase('input');
        return;
      }
      setShown(shown + 1);
      setVisible(true);
      playSound('tick');
    },
    phase === 'show' ? (visible ? 700 : 220) : null,
    false,
    `${length}-${shown}-${visible ? 1 : 0}`,
  );

  const start = () => {
    setInput([]);
    setShown(-1);
    setVisible(false);
    setPhase('show');
  };

  const type = useCallback(
    (digit: number) => {
      setInput((current) => (current.length >= length ? current : [...current, digit]));
    },
    [length],
  );
  const erase = useCallback(() => setInput((current) => current.slice(0, -1)), []);
  const submit = () => {
    const ok = input.length === sequence.length && input.every((d, i) => d === sequence[i]);
    setLastOk(ok);
    feedback(ok ? 'correct' : 'wrong');
    if (ok) setBest(length);
    if (ok && length < MAX_SPAN - 3) {
      setPhase('feedback');
    } else {
      setPhase('result');
    }
  };

  usePausableTimeout(
    () => {
      setLength(length + 1);
      start();
    },
    phase === 'feedback' ? 900 : null,
    false,
    `fb-${length}`,
  );

  const span = best > 0 ? best : 2;

  if (phase === 'intro') {
    return (
      <div className="placement">
        <p>
          Ziffern erscheinen nacheinander. Gib sie danach in derselben Reihenfolge ein. Wir starten
          mit drei Ziffern – nach jedem Treffer kommt eine dazu, bis eine Folge nicht mehr klappt.
        </p>
        <p className="muted small">
          Das dauert etwa eine Minute und legt nur deine Startstufe fest.
        </p>
        <Button variant="primary" size="lg" block icon="play" onClick={start}>
          Test starten
        </Button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="placement" role="status">
        {best > 0 ? (
          <p className="big-figure">
            <span className="numeral">{best}</span>
            <span>Ziffern gemerkt</span>
          </p>
        ) : null}
        <p>
          {best >= 7
            ? 'Stark! Wir legen bei den Gedächtnisspielen etwas höher los.'
            : best >= 5
              ? 'Ein solider Start – typisch sind fünf bis sieben Ziffern.'
              : 'Kein Problem: Wir beginnen behutsam, die Stufen passen sich an dich an.'}
        </p>
        <Button
          variant="primary"
          size="lg"
          block
          iconRight="arrow"
          onClick={() => onDone(span, placementFromSpan(span))}
        >
          Weiter
        </Button>
      </div>
    );
  }

  return (
    <div className="placement" data-phase={phase}>
      <p className="label" aria-live="polite">
        {length} Ziffern{phase === 'feedback' ? (lastOk ? ' – richtig!' : '') : ''}
      </p>
      <div className="digit-stage" aria-live="assertive" aria-atomic="true">
        {phase === 'show' && visible ? (
          <span className="digit-big numeral digit-show" key={shown}>
            {sequence[shown]}
          </span>
        ) : null}
        {phase === 'input' || phase === 'feedback' ? (
          <ol className="slots" aria-label="Deine Eingabe">
            {sequence.map((_, i) => (
              <li
                key={i}
                className={`slot ${phase === 'feedback' ? 'is-correct' : i === input.length ? 'is-next' : ''}`}
              >
                <span className="numeral">{input[i] ?? ''}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {phase === 'input' ? (
        <Keypad
          onDigit={type}
          onErase={erase}
          onSubmit={submit}
          canSubmit={input.length === length}
          listen
          okRef={okRef}
        />
      ) : null}
    </div>
  );
}

export function Onboarding({ search }: RouteProps) {
  const save = useSave();
  const step = Math.min(STEPS, Math.max(1, Number(searchParam(search, 'schritt') ?? '1') || 1));
  const [placement, setPlacement] = useState<{
    span: number | null;
    result: PlacementResult | null;
  }>({ span: null, result: null });
  useTitle('Willkommen');

  const finish = () => {
    completeOnboarding(
      placement.span,
      placement.result?.ratings,
      placement.result?.memoryOffset ?? 0,
    );
    navigate('/', { replace: true });
  };

  const goto = (next: number) => navigate(`/willkommen?schritt=${next}`);

  return (
    <section className="page narrow onboarding">
      <div className="onboarding-top">
        <StepDots step={step} />
        {step < STEPS ? (
          <button type="button" className="btn btn-ghost" onClick={finish}>
            <span>Überspringen</span>
          </button>
        ) : null}
      </div>

      {step === 1 ? (
        <>
          <div className="onboarding-art" aria-hidden="true">
            <Shape shape="kreis" color="rot" size={88} />
            <Shape shape="quadrat" color="blau" size={88} />
            <Shape shape="dreieck" color="gelb" size={88} />
          </div>
          <PageTitle>Willkommen in der Werkstatt.</PageTitle>
          <p className="lead">
            Merkwerk trainiert mit kurzen Spielen vier Fähigkeiten. Wie bei jedem Training gilt: Du
            wirst in den Übungen besser, wenn du dranbleibst – Wunder verspricht dir hier niemand.
          </p>
          <ul className="skill-intro">
            {SKILLS.map((skill) => (
              <li key={skill.title}>
                <Icon name={skill.icon} />
                <span>
                  <strong>{skill.title}</strong>
                  <span className="muted small">{skill.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button variant="primary" size="lg" block iconRight="arrow" onClick={() => goto(2)}>
            Weiter
          </Button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <PageTitle>Kurzer Einstufungstest</PageTitle>
          <p className="lead">Damit die ersten Runden weder zu leicht noch zu schwer sind.</p>
          <PlacementTest
            onDone={(span, result) => {
              setPlacement({ span, result });
              goto(3);
            }}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <PageTitle>Fast geschafft.</PageTitle>
          <p className="lead">
            Stell kurz ein, wie sich Merkwerk anfühlen soll. Das geht später jederzeit in den
            Einstellungen.
          </p>
          <div className="toggle-list">
            <Toggle
              label="Töne"
              description="Kurze Klänge bei Treffern und Fehlern"
              checked={save.settings.sound}
              onChange={(v) => updateSettings({ sound: v })}
              icon="sound"
            />
            <Toggle
              label="Vibration"
              description="Auf Geräten, die das unterstützen"
              checked={save.settings.haptics}
              onChange={(v) => updateSettings({ haptics: v })}
              icon="vibrate"
            />
            <Toggle
              label="Farben mit Mustern"
              description="Hilft bei Farbsehschwäche"
              checked={save.settings.colorPatterns}
              onChange={(v) => updateSettings({ colorPatterns: v })}
              icon="pattern"
            />
          </div>
          <p className="muted small">
            <Icon name="shield" size={16} className="inline-icon" /> Dein Fortschritt bleibt auf
            diesem Gerät. Kein Konto, kein Tracking.
          </p>
          <Button variant="primary" size="lg" block icon="play" onClick={finish}>
            Los geht’s
          </Button>
        </>
      ) : null}
    </section>
  );
}
