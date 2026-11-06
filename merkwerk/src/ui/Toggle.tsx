import { useId } from 'react';
import { feedback } from '../lib/feedback';
import { Icon, type IconName } from './icons';

/** Schalter mit sichtbarem Zustandstext („An“/„Aus“) – nicht nur über Farbe erkennbar. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: IconName;
}) {
  const id = useId();
  return (
    <div className="toggle-row">
      {icon ? <Icon name={icon} /> : <span />}
      <span className="toggle-text">
        <span id={`${id}-label`} className="toggle-label">
          {label}
        </span>
        {description ? (
          <span id={`${id}-desc`} className="muted small">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => {
          onChange(!checked);
          feedback('tap');
        }}
      >
        <span className="switch-knob" aria-hidden="true" />
        <span className="switch-text" aria-hidden="true">
          {checked ? 'An' : 'Aus'}
        </span>
      </button>
    </div>
  );
}
