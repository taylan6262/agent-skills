import {
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { goBack, navigate } from '../lib/router';
import { feedback } from '../lib/feedback';
import { Icon, StarIcon, type IconName } from './icons';
import type { Stars as StarCount } from '../game/types';

type Variant = 'primary' | 'secondary' | 'ghost' | 'blue' | 'yellow';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  block?: boolean;
  size?: 'md' | 'lg';
  /** Ohne Klick-Ton (wenn die Aktion selbst einen Ton auslöst). */
  quiet?: boolean;
}

export function Button({
  variant = 'secondary',
  icon,
  iconRight,
  block,
  size = 'md',
  quiet,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    block ? 'btn-block' : '',
    size === 'lg' ? 'btn-lg' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={classes}
      onClick={(event) => {
        if (!quiet) feedback('tap');
        onClick?.(event);
      }}
      {...rest}
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
      {iconRight ? <Icon name={iconRight} size={20} /> : null}
    </button>
  );
}

/** Interner Link: echte `<a href>` (Rechtsklick, neuer Tab), aber Navigation ohne Neuladen. */
export function Link({
  to,
  children,
  className,
  replace,
  ...rest
}: { to: string; children: ReactNode; className?: string; replace?: boolean } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        feedback('tap');
        navigate(to, { replace: replace ?? false });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  className,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${className ?? ''}`}
      aria-label={label}
      title={label}
      onClick={() => {
        feedback('tap');
        onClick();
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

export function TopBar({
  title,
  back,
  right,
  eyebrow,
}: {
  title: string;
  /** Ziel, falls es keinen vorherigen Bildschirm gibt; ohne Angabe kein Zurück-Knopf. */
  back?: string;
  right?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="topbar">
      {back ? (
        <IconButton icon="back" label="Zurück" onClick={() => goBack(back)} />
      ) : (
        <span className="topbar-spacer" />
      )}
      <div className="topbar-title">
        {eyebrow ? <span className="label muted">{eyebrow}</span> : null}
        <span className="topbar-heading">{title}</span>
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

/** Seitenüberschrift: bekommt beim Bildschirmwechsel den Fokus (Screenreader, Tastatur). */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={className}>
      {children}
    </h1>
  );
}

export function StarRow({
  stars,
  size = 20,
  animate = false,
  label,
}: {
  stars: StarCount;
  size?: number;
  animate?: boolean;
  label?: string;
}) {
  return (
    <span
      className={`star-row ${animate ? 'star-row-animate' : ''}`}
      role="img"
      aria-label={label ?? `${stars} von 3 Sternen`}
    >
      {[1, 2, 3].map((i) => (
        <StarIcon
          key={i}
          filled={i <= stars}
          size={size}
          className={i <= stars ? 'star-on' : 'star-off'}
        />
      ))}
    </span>
  );
}

export function Meter({
  value,
  max,
  label,
  color = 'blue',
}: {
  value: number;
  max: number;
  label: string;
  color?: 'blue' | 'red' | 'yellow' | 'ink';
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={`meter meter-${color}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  actions,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children?: ReactNode;
  actions: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-shapes" aria-hidden="true">
        <span className="dialog-dot" />
      </div>
      <h2 id="dialog-title">{title}</h2>
      {children ? <div className="dialog-body">{children}</div> : null}
      <div className="dialog-actions">{actions}</div>
    </dialog>
  );
}
