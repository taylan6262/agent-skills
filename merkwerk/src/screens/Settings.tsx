import { useState } from 'react';
import { systemPrefersReducedMotion } from '../lib/motion';
import { navigate } from '../lib/router';
import { canPersist, resetProgress, updateSettings, useSave } from '../state/store';
import { Button, Dialog, Link, PageTitle, TopBar } from '../ui/components';
import { Icon } from '../ui/icons';
import { Toggle } from '../ui/Toggle';
import { useTitle } from '../ui/useTitle';

export function Settings() {
  const save = useSave();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  useTitle('Einstellungen');
  const systemReduced = systemPrefersReducedMotion();
  const vibrationSupported =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  return (
    <>
      <TopBar title="Einstellungen" back="/" />
      <section className="page narrow settings">
        <PageTitle className="visually-hidden">Einstellungen</PageTitle>

        <div>
          <h2 className="section-title">Spielgefühl</h2>
          <div className="toggle-list">
            <Toggle
              label="Töne"
              description="Kurze, erzeugte Klänge bei Treffern und Fehlern"
              checked={save.settings.sound}
              onChange={(v) => updateSettings({ sound: v })}
              icon="sound"
            />
            <Toggle
              label="Vibration"
              description={
                vibrationSupported
                  ? 'Kurzes Feedback bei Treffern und Fehlern'
                  : 'Wird von diesem Gerät oder Browser nicht unterstützt'
              }
              checked={save.settings.haptics}
              onChange={(v) => updateSettings({ haptics: v })}
              icon="vibrate"
            />
            <Toggle
              label="Animationen reduzieren"
              description={
                systemReduced
                  ? 'Dein System verlangt bereits weniger Bewegung – das wird immer beachtet.'
                  : 'Weniger Bewegung bei Übergängen und Effekten'
              }
              checked={save.settings.reduceMotion || systemReduced}
              onChange={(v) => updateSettings({ reduceMotion: v })}
              icon="motion"
            />
            <Toggle
              label="Farben mit Mustern"
              description="Formen erhalten zusätzlich Muster; im Tempo-Duell ersetzt „Form ↔ Wort“ die Farbaufgabe."
              checked={save.settings.colorPatterns}
              onChange={(v) => updateSettings({ colorPatterns: v })}
              icon="pattern"
            />
          </div>
        </div>

        <div>
          <h2 className="section-title">Dein Spielstand</h2>
          <p className="storage-note">
            <Icon name="shield" />
            <span>
              {canPersist()
                ? 'Dein Fortschritt wird ausschließlich auf diesem Gerät gespeichert. Es gibt kein Konto und keine Übertragung an Server.'
                : 'Dein Browser erlaubt gerade kein dauerhaftes Speichern (z. B. im privaten Modus). Der Fortschritt geht beim Schließen verloren.'}
            </span>
          </p>
          <div className="settings-actions">
            <Button icon="info" onClick={() => navigate('/willkommen')}>
              Einführung erneut ansehen
            </Button>
            <Button icon="reset" className="btn-danger" onClick={() => setConfirm(true)}>
              Fortschritt zurücksetzen
            </Button>
          </div>
          {done ? (
            <p className="muted small" role="status">
              Fortschritt gelöscht. Deine Einstellungen sind erhalten geblieben.
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="section-title">Rechtliches</h2>
          <ul className="link-list">
            <li>
              <Link to="/impressum">Impressum</Link>
            </li>
            <li>
              <Link to="/datenschutz">Datenschutz</Link>
            </li>
          </ul>
          <p className="muted small">Merkwerk Version {__APP_VERSION__}</p>
        </div>
      </section>

      <Dialog
        open={confirm}
        title="Wirklich alles zurücksetzen?"
        onClose={() => setConfirm(false)}
        actions={
          <>
            <Button
              className="btn-danger-solid"
              icon="reset"
              onClick={() => {
                resetProgress();
                setConfirm(false);
                setDone(true);
              }}
            >
              Ja, Fortschritt löschen
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Abbrechen
            </Button>
          </>
        }
      >
        <p>
          Sterne, XP, Serie, Erfolge, Statistik und Lernstand werden gelöscht. Das lässt sich nicht
          rückgängig machen.
        </p>
      </Dialog>
    </>
  );
}
