import { useSyncExternalStore } from 'react';

/**
 * Kleiner Router auf Basis der History-API. Jeder Eintrag merkt sich seine Tiefe (`idx`),
 * damit „Zurück“ in der App weiß, ob es einen vorherigen Bildschirm gibt.
 */
export interface RouteLocation {
  pathname: string;
  search: string;
  idx: number;
}

interface HistoryState {
  idx: number;
}

function readIdx(): number {
  const state = window.history.state as Partial<HistoryState> | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

function read(): RouteLocation {
  return { pathname: window.location.pathname, search: window.location.search, idx: readIdx() };
}

let current: RouteLocation = read();
const listeners = new Set<() => void>();

function emit(): void {
  current = read();
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  if (typeof (window.history.state as Partial<HistoryState> | null)?.idx !== 'number') {
    window.history.replaceState({ idx: 0 }, '');
    current = read();
  }
  window.addEventListener('popstate', emit);
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = new URL(to, window.location.origin);
  if (target.pathname === current.pathname && target.search === current.search && !options.replace)
    return;
  const idx = readIdx() + (options.replace ? 0 : 1);
  if (options.replace) window.history.replaceState({ idx }, '', to);
  else window.history.pushState({ idx }, '', to);
  emit();
}

/** Geht einen Schritt zurück, wenn es in der App einen vorherigen Bildschirm gibt, sonst zu `fallback`. */
export function goBack(fallback: string): void {
  if (readIdx() > 0) window.history.back();
  else navigate(fallback, { replace: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocation(): RouteLocation {
  return useSyncExternalStore(subscribe, () => current);
}

/** Vergleicht einen Pfad mit einem Muster wie `/level/:id`. */
export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i] ?? '';
    const v = pathParts[i] ?? '';
    if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(v);
    else if (p !== v) return null;
  }
  return params;
}

export function searchParam(search: string, key: string): string | null {
  return new URLSearchParams(search).get(key);
}
