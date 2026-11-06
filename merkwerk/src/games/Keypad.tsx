import { useEffect, type RefObject } from 'react';
import { Icon } from '../ui/icons';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface KeypadProps {
  onDigit: (digit: number) => void;
  onErase: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  /** Tastatureingabe (Ziffern, Rücktaste, Enter) aktiv? */
  listen: boolean;
  okRef?: RefObject<HTMLButtonElement | null>;
}

/** Ziffern-Tastenfeld für Zahlenspur und Einstufungstest – auch per Tastatur bedienbar. */
export function Keypad({ onDigit, onErase, onSubmit, canSubmit, listen, okRef }: KeypadProps) {
  useEffect(() => {
    if (!listen) return;
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) onDigit(Number(event.key));
      else if (event.key === 'Backspace') onErase();
      else if (event.key === 'Enter' && canSubmit) {
        event.preventDefault();
        onSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listen, onDigit, onErase, onSubmit, canSubmit]);

  return (
    <div className="keypad" role="group" aria-label="Ziffern-Tastenfeld">
      {KEYS.map((k) => (
        <button key={k} type="button" className="key numeral" onClick={() => onDigit(k)}>
          {k}
        </button>
      ))}
      <button
        type="button"
        className="key key-muted"
        onClick={onErase}
        aria-label="Letzte Ziffer löschen"
      >
        <Icon name="backspace" />
      </button>
      <button type="button" className="key numeral" onClick={() => onDigit(0)}>
        0
      </button>
      <button
        ref={okRef}
        type="button"
        className="key key-ok"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Eingabe prüfen"
      >
        <Icon name="check" />
      </button>
    </div>
  );
}
