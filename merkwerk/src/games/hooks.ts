import { useCallback, useEffect, useRef } from 'react';

/** Timeout, der bei Pause anhält und danach mit der Restzeit weiterläuft. `delay = null` deaktiviert ihn. */
export function usePausableTimeout(callback: () => void, delay: number | null, paused: boolean, resetKey: unknown = 0): void {
  const callbackRef = useRef(callback);
  const remaining = useRef<number | null>(delay);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    remaining.current = delay;
  }, [delay, resetKey]);

  useEffect(() => {
    if (delay === null || paused || remaining.current === null) return;
    const started = performance.now();
    const id = window.setTimeout(() => {
      remaining.current = null;
      callbackRef.current();
    }, remaining.current);
    return () => {
      window.clearTimeout(id);
      if (remaining.current !== null) {
        remaining.current = Math.max(0, remaining.current - (performance.now() - started));
      }
    };
  }, [delay, paused, resetKey]);
}

/** Misst die aktive Spielzeit ohne Pausen. */
export function useActiveClock(paused: boolean): () => number {
  const accumulated = useRef(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    startedAt.current = performance.now();
    return () => {
      if (startedAt.current !== null) accumulated.current += performance.now() - startedAt.current;
      startedAt.current = null;
    };
  }, [paused]);

  return useCallback(
    () => accumulated.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current),
    [],
  );
}
