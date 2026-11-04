import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LogoMark } from './Logo';

interface State {
  error: Error | null;
}

/** Fängt Laufzeitfehler ab und zeigt eine freundliche Seite statt eines weißen Bildschirms. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kein Tracking: Fehler bleiben lokal in der Konsole.
    console.error('Merkwerk-Fehler', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const chunkFailed = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <main className="error-page">
        <LogoMark size={72} />
        <h1>Da ist etwas aus dem Raster gefallen.</h1>
        <p>
          {chunkFailed
            ? 'Ein Teil der App konnte nicht geladen werden – vermutlich gab es gerade ein Update. Lade die Seite neu.'
            : 'Ein unerwarteter Fehler ist aufgetreten. Dein Spielstand ist sicher gespeichert.'}
        </p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            <span>Neu laden</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.assign('/')}>
            <span>Zur Startseite</span>
          </button>
        </div>
      </main>
    );
  }
}
