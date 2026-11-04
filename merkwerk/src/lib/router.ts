import { useSyncExternalStore } from 'react';

/**
 * Kleiner Router. Im normalen Betrieb nutzt er die History-API: Jeder Eintrag merkt sich seine
 * Tiefe (`idx`), damit „Zurück“ in der App weiß, ob es einen vorherigen Bildschirm gibt.
 * Im Artifact-Build (eingebettete Vorschau) gibt es keine eigenen URL-Pfade; dort führt der
 * Router den Verlauf im Speicher.
 */
export interface RouteLocation {
  pathname: string;
  search: string;
  idx: number;
}

interface HistoryState {
  idx: number;
}

/** true im Artifact-Build: Verlauf im Speicher statt in der Adresszeile. */
export const MEMORY_ROUTER = import.meta.env.MODE === 'artifact';

const memoryStack: string[] = ['/'];

function split(path: string): { pathname: string; search: string } {
  const url = new URL(path, 'https://merkwerk.invalid');
  return { pathname: url.pathname, search: url.search };
}

function readIdx(): number {
  if (MEMORY_ROUTER) return memoryStack.length - 1;
  const state = window.history.state as Partial<HistoryState> | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

function read(): RouteLocation {
  if (MEMORY_ROUTER)
    return { ...split(memoryStack[memoryStack.length - 1] ?? '/'), idx: readIdx() };
  return { pathname: window.location.pathname, search: window.location.search, idx: readIdx() };
}

let current: RouteLocation = read();
const listeners = new Set<() => void>();

function emit(): void {
  current = read();
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined' && !MEMORY_ROUTER) {
  if (typeof (window.history.state as Partial<HistoryState> | null)?.idx !== 'number') {
    window.history.replaceState({ idx: 0 }, '');
    current = read();
  }
  window.addEventListener('popstate', emit);
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = split(to);
  if (target.pathname === current.pathname && target.search === current.search && !options.replace)
    return;
  if (MEMORY_ROUTER) {
    if (options.replace) memoryStack[memoryStack.length - 1] = to;
    else memoryStack.push(to);
    emit();
    return;
  }
  const idx = readIdx() + (options.replace ? 0 : 1);
  if (options.replace) window.history.replaceState({ idx }, '', to);
  else window.history.pushState({ idx }, '', to);
  emit();
}

/** Geht einen Schritt zurück, wenn es in der App einen vorherigen Bildschirm gibt, sonst zu `fallback`. */
export function goBack(fallback: string): void {
  if (readIdx() === 0) {
    navigate(fallback, { replace: true });
  } else if (MEMORY_ROUTER) {
    memoryStack.pop();
    emit();
  } else {
    window.history.back();
  }
}

/** Ziel für `href`: echte Pfade im normalen Betrieb, im Artifact-Build nur ein Anker. */
export function hrefFor(to: string): string {
  return MEMORY_ROUTER ? '#' : to;
}

/** Neustart der App auf der Startseite (z. B. nach einem Fehler). */
export function restartApp(): void {
  if (MEMORY_ROUTER) window.location.reload();
  else window.location.assign('/');
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
