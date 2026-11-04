import type { ReactElement, SVGProps } from 'react';

/** Eigene Icons im Bauhaus-Stil: 24er-Raster, 2 px Kontur, eckige Enden, Grundformen. */
export type IconName =
  | 'back'
  | 'close'
  | 'pause'
  | 'play'
  | 'home'
  | 'map'
  | 'training'
  | 'stats'
  | 'medal'
  | 'settings'
  | 'lock'
  | 'check'
  | 'sound'
  | 'mute'
  | 'vibrate'
  | 'motion'
  | 'pattern'
  | 'reset'
  | 'streak'
  | 'xp'
  | 'clock'
  | 'info'
  | 'arrow'
  | 'calendar'
  | 'eye'
  | 'grid'
  | 'trail'
  | 'bolt'
  | 'book'
  | 'globe'
  | 'leaf'
  | 'flask'
  | 'column'
  | 'speech'
  | 'sigma'
  | 'shield'
  | 'backspace';

const PATHS: Record<IconName, ReactElement> = {
  back: <path d="M10 5 3 12l7 7M3 12h18" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  pause: (
    <g fill="currentColor" stroke="none">
      <rect x="5" y="4" width="5" height="16" />
      <rect x="14" y="4" width="5" height="16" />
    </g>
  ),
  play: <path d="M7 4v16l13-8Z" fill="currentColor" />,
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M6 10v10h12V10" />
      <rect x="10" y="14" width="4" height="6" fill="currentColor" stroke="none" />
    </>
  ),
  map: (
    <>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  training: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  stats: (
    <g fill="currentColor" stroke="none">
      <rect x="3" y="13" width="5" height="8" />
      <rect x="9.5" y="8" width="5" height="13" />
      <rect x="16" y="3" width="5" height="18" />
    </g>
  ),
  medal: (
    <>
      <path d="m7 3 5 7 5-7" />
      <circle cx="12" cy="15" r="6" />
      <circle cx="12" cy="15" r="2" fill="currentColor" />
    </>
  ),
  settings: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
      <rect x="6" y="3.5" width="5" height="5" fill="var(--paper)" />
      <circle cx="16" cy="12" r="2.6" fill="var(--paper)" />
      <path d="M8.5 15.5 11 20H6Z" fill="var(--paper)" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  check: <path d="m4 12.5 5.5 5.5L20 6" />,
  sound: (
    <>
      <path d="M3 9h4l5-4.5v15L7 15H3Z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M3 9h4l5-4.5v15L7 15H3Z" fill="currentColor" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </>
  ),
  vibrate: (
    <>
      <rect x="8" y="3" width="8" height="18" />
      <path d="M4 8v8M20 8v8" />
    </>
  ),
  motion: (
    <>
      <circle cx="17" cy="12" r="4" fill="currentColor" />
      <circle cx="9" cy="12" r="2.4" />
      <circle cx="3.6" cy="12" r="1.2" />
    </>
  ),
  pattern: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="m4 12 8-8M4 20 20 4M12 20l8-8" />
    </>
  ),
  reset: (
    <>
      <path d="M19.5 12A7.5 7.5 0 1 1 17 6.4" />
      <path d="M18 2.5V7h-4.5" />
    </>
  ),
  streak: (
    <g fill="currentColor" stroke="none">
      <path d="M3 5h4l6 7-6 7H3l6-7Z" />
      <path d="M11 5h4l6 7-6 7h-4l6-7Z" />
    </g>
  ),
  xp: (
    <>
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />
      <path d="m12 8 4 4-4 4-4-4Z" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5V12l3.5 2.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <rect x="11" y="6.5" width="2" height="2" fill="currentColor" stroke="none" />
    </>
  ),
  arrow: <path d="m14 5 7 7-7 7M21 12H3" />,
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <rect x="13" y="13" width="4" height="4" fill="currentColor" stroke="none" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7Z" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      <rect x="15" y="3" width="6" height="6" fill="currentColor" />
      <rect x="3" y="15" width="6" height="6" fill="currentColor" />
    </>
  ),
  trail: (
    <>
      <path d="m4 17 6-7 5 4 5-9" />
      <circle cx="4" cy="17" r="2.2" fill="currentColor" />
      <circle cx="10" cy="10" r="2.2" fill="currentColor" />
      <circle cx="15" cy="14" r="2.2" fill="currentColor" />
      <circle cx="20" cy="5" r="2.2" fill="currentColor" />
    </>
  ),
  bolt: (
    <>
      <path d="M9 4v16l12-8Z" fill="currentColor" />
      <path d="M2 8h4M2 12h5M2 16h4" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C9.5 4.5 6 4 3 4.5v14c3-.5 6.5 0 9 2 2.5-2 6-2.5 9-2v-14c-3-.5-6.5 0-9 2Z" />
      <path d="M12 6.5v14" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 10.5 4.5 20 4.5 20 14 14.5 19 5 19Z" />
      <path d="M5 19 14 10" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6.5L4.5 20h15L14 9.5V3" />
      <path d="M7 15.5h10" />
    </>
  ),
  column: (
    <>
      <path d="M3 7 12 3l9 4Z" fill="currentColor" />
      <path d="M6 9.5v8M10 9.5v8M14 9.5v8M18 9.5v8M3 20.5h18" />
    </>
  ),
  speech: <path d="M4 4.5h16v11h-8l-5 4.5v-4.5H4Z" />,
  sigma: <path d="M18 5H6l6.5 7L6 19h12" />,
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  backspace: (
    <>
      <path d="M8 5h13v14H8l-6-7Z" />
      <path d="m11.5 9 6 6M17.5 9l-6 6" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Beschriftung für Screenreader; ohne Label ist das Icon dekorativ. */
  label?: string;
}

export function Icon({ name, size = 24, label, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
}

const STAR = starPoints(12, 12.6, 10.5, 4.4);

export function StarIcon({ filled, size = 24, className }: { filled: boolean; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className={className}>
      <polygon
        points={STAR}
        fill={filled ? 'var(--yellow)' : 'var(--paper-deep)'}
        stroke={filled ? 'var(--ink)' : 'var(--ink-soft)'}
        strokeWidth={filled ? 1.8 : 1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
