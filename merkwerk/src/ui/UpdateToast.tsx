import { useRegisterSW } from 'virtual:pwa-register/react';

/** Meldet eine neue App-Version. Aktualisiert wird erst auf Wunsch – nie mitten im Spiel. */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      console.warn('Service Worker konnte nicht registriert werden', error);
    },
  });

  if (!needRefresh) return null;
  return (
    <div className="toast" role="status">
      <span>Eine neue Version von Merkwerk ist da.</span>
      <span className="toast-actions">
        <button
          type="button"
          className="btn btn-yellow"
          onClick={() => void updateServiceWorker(true)}
        >
          <span>Neu laden</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setNeedRefresh(false)}
          aria-label="Hinweis schließen"
        >
          <span>Später</span>
        </button>
      </span>
    </div>
  );
}
