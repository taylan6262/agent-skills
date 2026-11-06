/** Kalendertage werden als lokale Datumsschlüssel `JJJJ-MM-TT` gespeichert. */
export type DayKey = string;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && DAY_KEY.test(value);
}

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

/** Anzahl Tage von `from` bis `to` (positiv, wenn `to` später ist). */
export function diffDays(from: DayKey, to: DayKey): number {
  const ms = fromDayKey(to).getTime() - fromDayKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

const MONTHS = [
  'Jan.',
  'Feb.',
  'März',
  'Apr.',
  'Mai',
  'Juni',
  'Juli',
  'Aug.',
  'Sep.',
  'Okt.',
  'Nov.',
  'Dez.',
];

export function formatDayShort(key: DayKey): string {
  const date = fromDayKey(key);
  return `${date.getDate()}. ${MONTHS[date.getMonth()] ?? ''}`;
}
