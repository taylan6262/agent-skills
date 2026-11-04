import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';
import { Wordmark } from './Logo';

/** Startbild: die drei Grundformen fügen sich zusammen, dann blendet es aus. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const hold = window.setTimeout(() => setLeaving(true), reduced ? 350 : 1100);
    const done = window.setTimeout(onDone, reduced ? 450 : 1450);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className={`splash ${leaving ? 'splash-leave' : ''}`} aria-hidden="true" data-testid="splash">
      <svg viewBox="0 0 64 64" className="splash-mark" focusable="false">
        <rect className="splash-square" x="4" y="22" width="26" height="38" fill="var(--blue)" stroke="var(--ink)" strokeWidth="3" />
        <circle className="splash-circle" cx="44" cy="20" r="16" fill="var(--red)" stroke="var(--ink)" strokeWidth="3" />
        <polygon className="splash-triangle" points="30,60 46,32 62,60" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="3" />
      </svg>
      <Wordmark className="splash-word" />
      <p className="splash-claim">Werkstatt für Gedächtnis, Tempo und Wissen</p>
    </div>
  );
}
