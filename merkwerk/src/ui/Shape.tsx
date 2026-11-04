import type { PaletteColor } from '../game/levels';
import type { ShapeId } from '../game/symbols';
import { COLOR_VAR } from './colors';


function geometry(shape: ShapeId, props: { fill: string; stroke: string; strokeWidth: number }) {
  switch (shape) {
    case 'kreis':
      return <circle cx="50" cy="50" r="40" {...props} />;
    case 'quadrat':
      return <rect x="13" y="13" width="74" height="74" {...props} />;
    case 'dreieck':
      return <polygon points="50,9 93,87 7,87" {...props} strokeLinejoin="miter" />;
    case 'halbkreis':
      return <path d="M8 72 A42 42 0 0 1 92 72 Z" {...props} />;
    case 'raute':
      return <polygon points="50,5 95,50 50,95 5,50" {...props} />;
    case 'ring':
      return (
        <path
          fillRule="evenodd"
          d="M50 8a42 42 0 1 1 0 84a42 42 0 1 1 0-84ZM50 30a20 20 0 1 0 0 40a20 20 0 1 0 0-40Z"
          {...props}
        />
      );
    case 'kreuz':
      return <path d="M37 8h26v29h29v26H63v29H37V63H8V37h29Z" {...props} />;
    case 'viertel':
      return <path d="M12 88V12a76 76 0 0 1 76 76Z" {...props} />;
  }
}

export interface ShapeProps {
  shape: ShapeId;
  color: PaletteColor;
  size?: number | string;
  /** Muster zusätzlich zur Farbe (Einstellung „Farben mit Mustern“). */
  patterned?: boolean;
  className?: string;
  label?: string;
}

/** Eine Grundform als Spielstein. Konturen in Tinte sichern den Kontrast auch für Gelb. */
export function Shape({ shape, color, size = '100%', patterned = false, className, label }: ShapeProps) {
  const base = { fill: COLOR_VAR[color], stroke: 'var(--ink)', strokeWidth: 4 };
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {geometry(shape, base)}
      {patterned && color !== 'tinte'
        ? geometry(shape, { fill: `url(#muster-${color})`, stroke: 'none', strokeWidth: 0 })
        : null}
    </svg>
  );
}

/** Musterdefinitionen für die Farbsehhilfe – einmal im Dokument eingebunden. */
export function PatternDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="muster-rot" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="14" fill="var(--paper)" />
        </pattern>
        <pattern id="muster-blau" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="3.4" fill="var(--paper)" />
        </pattern>
        <pattern id="muster-gelb" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="3.5" fill="var(--ink)" />
        </pattern>
      </defs>
    </svg>
  );
}
