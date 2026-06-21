/**
 * Fonctions utilitaires pures, sans dépendance React ni Firebase.
 * Portées fidèlement depuis la v1 (lib/utils.js), avec types stricts.
 */

export const pad = (n: number): string => String(n).padStart(2, '0');

export const dateKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fmt = (s: number): string => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export const daysBetween = (a: string, b: string): number =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const parseKey = (k: string): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (k: string, n: number): string => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export const mondayOf = (k: string): string => {
  const d = parseKey(k);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
};

export const monthKey = (k: string): string => k.slice(0, 7);

export const addMonths = (mk: string, n: number): string => {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const daysInMonth = (mk: string): number => {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export const monthLabel = (mk: string): string => {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export const inRange = (k: string, start: string, end: string): boolean =>
  k >= start && k <= end;

export const uid = (): string => 'x' + Math.random().toString(36).slice(2, 9);

export interface PruneResult<T> {
  kept: Record<string, T>;
  removed: Record<string, T>;
  changed: boolean;
}

/** Sépare les jours de plus de 400 jours pour archivage. */
export function pruneOldDays<T>(days: Record<string, T> | undefined, today: string): PruneResult<T> {
  const cutoff = addDays(today, -400);
  const kept: Record<string, T> = {};
  const removed: Record<string, T> = {};
  Object.keys(days || {}).forEach((k) => {
    if (k >= cutoff) kept[k] = (days as Record<string, T>)[k];
    else removed[k] = (days as Record<string, T>)[k];
  });
  return { kept, removed, changed: Object.keys(removed).length > 0 };
}

export function ageFrom(bd: string | undefined): number | null {
  if (!bd) return null;
  const b = parseKey(bd);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
  return a;
}

export const normName = (s: string | undefined): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
