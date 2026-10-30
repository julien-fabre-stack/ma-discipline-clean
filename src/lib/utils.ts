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

export interface CalendarSpan {
  years: number;
  months: number;
  days: number;
  /** Nombre total de jours écoulés (identique à daysBetween). */
  total: number;
}

/**
 * Écart CALENDAIRE réel entre deux clés YYYY-MM-DD (start ≤ end).
 *
 * AVANT (compteur sans alcool) : mois = blocs de 30 j, années = 365 j →
 * dérive de plusieurs jours sur l'année (ex. 1er janv → 30 oct affichait
 * « 10 mois 2 j » au lieu de « 9 mois 29 j »).
 *
 * Méthode : on cherche le plus grand nombre de mois entiers N tel que
 * start + N mois ≤ end (jour borné à la fin du mois : 31 janv + 1 mois =
 * 28/29 févr), puis on compte les jours restants. Si end < start, tout vaut 0.
 */
export function calendarDiff(start: string, end: string): CalendarSpan {
  const total = daysBetween(start, end);
  if (!(total > 0)) return { years: 0, months: 0, days: 0, total: 0 };
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const anchorAt = (n: number): string => {
    const y = sy + Math.floor((sm - 1 + n) / 12);
    const m = ((sm - 1 + n) % 12) + 1;
    const d = Math.min(sd, daysInMonth(`${y}-${pad(m)}`));
    return `${y}-${pad(m)}-${pad(d)}`;
  };
  let n = Math.max(0, (ey - sy) * 12 + (em - sm));
  while (n > 0 && anchorAt(n) > end) n--;
  return {
    years: Math.floor(n / 12),
    months: n % 12,
    days: daysBetween(anchorAt(n), end),
    total,
  };
}

/** Libellé court « 1 an 2 mois 3 j » d'un écart calendaire. */
export function calendarSpanLabel(s: CalendarSpan): string {
  return (
    (s.years > 0 ? s.years + (s.years > 1 ? ' ans ' : ' an ') : '') +
    (s.months > 0 ? s.months + ' mois ' : '') +
    s.days +
    ' j'
  );
}

/**
 * Génère un identifiant unique.
 * Utilise crypto.randomUUID() (standard Web, disponible iOS 15.4+ / Chrome 92+)
 * avec fallback Math.random() pour les rares contextes sans crypto.
 */
export const uid = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
};

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
