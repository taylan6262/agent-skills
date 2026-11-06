/**
 * Ersatz für `virtual:pwa-register/react` im Artifact-Build: Dort sind Service Worker
 * nicht erlaubt, die App läuft dann ohne Offline-Cache und ohne Update-Hinweis.
 */
type Pair = [boolean, (value: boolean) => void];

export function useRegisterSW(): {
  needRefresh: Pair;
  offlineReady: Pair;
  updateServiceWorker: (reload?: boolean) => Promise<void>;
} {
  const noop = (): void => undefined;
  return {
    needRefresh: [false, noop],
    offlineReady: [false, noop],
    updateServiceWorker: () => Promise.resolve(),
  };
}
