import { useSyncExternalStore } from 'react';
import { getSave, useSave } from '../state/store';

const query =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function subscribe(listener: () => void): () => void {
  query?.addEventListener('change', listener);
  return () => query?.removeEventListener('change', listener);
}

export function systemPrefersReducedMotion(): boolean {
  return query?.matches ?? false;
}

/** Bewegung reduzieren, wenn das System es verlangt oder es in den Einstellungen gewählt ist. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, systemPrefersReducedMotion);
  const save = useSave();
  return system || save.settings.reduceMotion;
}

export function prefersReducedMotion(): boolean {
  return systemPrefersReducedMotion() || getSave().settings.reduceMotion;
}
