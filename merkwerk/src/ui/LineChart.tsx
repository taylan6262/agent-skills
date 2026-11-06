import { useState, type KeyboardEvent } from 'react';
import { formatDayShort, type DayKey } from '../lib/date';

export type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond';

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  marker: MarkerShape;
  dash?: string;
  /** Helle Farbe auf Papier bekommt eine Tinten-Einfassung, damit Linie und Marker lesbar bleiben. */
  cased?: boolean;
  values: (number | null)[];
}

const W = 340;
const H = 210;
const PAD = { left: 30, right: 74, top: 12, bottom: 28 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function marker(
  shape: MarkerShape,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke: string,
) {
  const r = size / 2;
  const common = { fill, stroke, strokeWidth: 1.5 };
  switch (shape) {
    case 'circle':
      return <circle cx={x} cy={y} r={r} {...common} />;
    case 'square':
      return <rect x={x - r} y={y - r} width={size} height={size} {...common} />;
    case 'triangle':
      return (
        <polygon
          points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`}
          {...common}
        />
      );
    case 'diamond':
      return (
        <polygon
          points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`}
          {...common}
        />
      );
  }
}

export function MarkerIcon({ shape, color }: { shape: MarkerShape; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {marker(shape, 7, 7, 9, color, 'var(--ink)')}
    </svg>
  );
}

/**
 * Liniendiagramm 0–100 über Tage. Eine Achse, dünne Linien, Marker in eigener Form je Reihe,
 * Direktbeschriftung am Ende, Fadenkreuz mit Tooltip (Maus, Touch und Pfeiltasten).
 */
export function LineChart({
  days,
  series,
  label,
}: {
  days: DayKey[];
  series: ChartSeries[];
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = days.length;
  const x = (i: number): number => PAD.left + (n <= 1 ? PLOT_W / 2 : (i * PLOT_W) / (n - 1));
  const y = (v: number): number => PAD.top + PLOT_H - (v / 100) * PLOT_H;

  // Direktbeschriftung: am letzten Wert, mit Mindestabstand gegen Überlappung
  const labels = series
    .map((s) => {
      let idx = -1;
      s.values.forEach((v, i) => {
        if (v !== null) idx = i;
      });
      return idx >= 0 ? { s, y: y(s.values[idx] ?? 0) } : null;
    })
    .filter((l): l is { s: ChartSeries; y: number } => l !== null)
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    const prev = labels[i - 1];
    const cur = labels[i];
    if (prev && cur && cur.y - prev.y < 13) cur.y = prev.y + 13;
  }

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    if (event.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (event.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (event.key === 'Escape') setActive(null);
    else return;
    event.preventDefault();
  };

  const tooltipLeft = active === null ? 0 : Math.min(76, Math.max(24, (x(active) / W) * 100));
  const shownIndex = active ?? n - 1;
  const valueText =
    n === 0
      ? 'Keine Daten'
      : `${formatDayShort(days[shownIndex] ?? '')}: ${series.map((s) => `${s.name} ${s.values[shownIndex] ?? 'kein Wert'}`).join(', ')}`;

  return (
    <div
      className="chart"
      role="slider"
      tabIndex={0}
      aria-label={`${label}. Mit den Pfeiltasten einen Tag wählen.`}
      aria-valuemin={1}
      aria-valuemax={Math.max(1, n)}
      aria-valuenow={(active ?? n - 1) + 1}
      aria-valuetext={valueText}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        aria-hidden="true"
        focusable="false"
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setActive(null);
        }}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(v) + 4} className="chart-tick" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {n > 0 ? (
          <>
            <text
              x={x(0)}
              y={H - 8}
              className="chart-tick"
              textAnchor={n === 1 ? 'middle' : 'start'}
            >
              {formatDayShort(days[0] ?? '')}
            </text>
            {n > 1 ? (
              <text x={x(n - 1)} y={H - 8} className="chart-tick" textAnchor="end">
                {formatDayShort(days[n - 1] ?? '')}
              </text>
            ) : null}
          </>
        ) : null}
        {active !== null ? (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            className="chart-cross"
          />
        ) : null}

        {series.map((s) => {
          // Tage ohne Wert werden überbrückt: die Linie verbindet die vorhandenen Messpunkte.
          const points = s.values
            .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
            .filter((p): p is string => p !== null);
          const segments = points.length > 1 ? [`M${points.join('L')}`] : [];
          return (
            <g key={s.id}>
              {segments.map((d) => (
                <g key={d}>
                  {s.cased ? (
                    <path
                      d={d}
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth={4}
                      strokeLinejoin="round"
                    />
                  ) : null}
                  <path
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dash}
                    strokeLinejoin="round"
                  />
                </g>
              ))}
              {s.values.map((v, i) =>
                v === null ? null : (
                  <g key={i}>
                    {marker(
                      s.marker,
                      x(i),
                      y(v),
                      i === active ? 11 : n > 12 ? 6.5 : 8,
                      s.color,
                      'var(--ink)',
                    )}
                  </g>
                ),
              )}
            </g>
          );
        })}

        {labels.map(({ s, y: ly }) => (
          <text key={s.id} x={PAD.left + PLOT_W + 10} y={ly + 4} className="chart-label">
            {s.name}
          </text>
        ))}

        {days.map((day, i) => (
          <rect
            key={day}
            x={x(i) - PLOT_W / Math.max(2, (n - 1) * 2)}
            y={PAD.top}
            width={PLOT_W / Math.max(1, n - 1)}
            height={PLOT_H}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
          />
        ))}
      </svg>
      {active !== null && days[active] ? (
        <div className="chart-tooltip" style={{ left: `${tooltipLeft}%` }} aria-hidden="true">
          <strong>{formatDayShort(days[active])}</strong>
          {series.map((s) => (
            <span key={s.id} className="chart-tooltip-row">
              <MarkerIcon shape={s.marker} color={s.color} />
              {s.name}: {s.values[active] ?? '–'}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
