export function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading-shapes" aria-hidden="true">
        <span className="loading-circle" />
        <span className="loading-square" />
        <span className="loading-triangle" />
      </span>
      <span className="visually-hidden">Lädt …</span>
    </div>
  );
}
