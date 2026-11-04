/** Bildmarke: Kreis, Quadrat und Dreieck – die drei Grundformen als „M“-Komposition. */
export function LogoMark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="22"
        width="26"
        height="38"
        fill="var(--blue)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <circle cx="44" cy="20" r="16" fill="var(--red)" stroke="var(--ink)" strokeWidth="3" />
      <polygon
        points="30,60 46,32 62,60"
        fill="var(--yellow)"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark ${className ?? ''}`}>
      merk<span className="wordmark-accent">werk</span>
    </span>
  );
}
