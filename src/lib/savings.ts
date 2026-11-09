/**
 * Logique pure du compteur d'épargne (aucune dépendance React / Firebase).
 *
 * Règle : une occurrence est comptée DÈS LE JOUR J (00:00), à partir de la
 * date initiale incluse.
 *  - day   : chaque jour
 *  - week  : tous les 7 jours (même jour de semaine que la date initiale)
 *  - month : même quantième, borné à la fin du mois (31 janv → 28/29 févr)
 *  - year  : anniversaire (29 févr → 28 févr les années non bissextiles)
 */
import type { SavingsAccount, SavingsCounter, SavingsPeriod } from '@/types';
import { daysBetween, daysInMonth, pad } from './utils';

export const SAVINGS_PERIODS: { id: SavingsPeriod; label: string; unit: string }[] = [
  { id: 'day', label: 'Jour', unit: 'jour' },
  { id: 'week', label: 'Semaine', unit: 'sem.' },
  { id: 'month', label: 'Mois', unit: 'mois' },
  { id: 'year', label: 'Année', unit: 'an' },
];

const isKey = (k: unknown): k is string => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);

/** Arrondi au centime (évite 0.1 + 0.2 = 0.30000000000000004 à l'affichage). */
export const roundCents = (n: number): number => Math.round(n * 100) / 100;

/**
 * Nombre d'occurrences entre `start` et `today`, les deux inclus.
 * 0 si `start` est dans le futur ou si une date est invalide.
 */
export function countOccurrences(start: string, today: string, period: SavingsPeriod): number {
  if (!isKey(start) || !isKey(today) || today < start) return 0;

  if (period === 'day') return daysBetween(start, today) + 1;
  if (period === 'week') return Math.floor(daysBetween(start, today) / 7) + 1;

  const step = period === 'year' ? 12 : 1;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em] = today.split('-').map(Number);
  const anchorAt = (n: number): string => {
    const months = n * step;
    const y = sy + Math.floor((sm - 1 + months) / 12);
    const m = ((sm - 1 + months) % 12) + 1;
    const d = Math.min(sd, daysInMonth(`${y}-${pad(m)}`));
    return `${y}-${pad(m)}-${pad(d)}`;
  };
  let n = Math.floor(((ey - sy) * 12 + (em - sm)) / step);
  while (n >= 0 && anchorAt(n) > today) n--;
  return n + 1; // n = -1 → 0 occurrence
}

/** Total théorique du compteur à la date `today` (arrondi au centime). */
export function savingsTotal(counter: SavingsCounter, today: string): number {
  const amount = Number.isFinite(counter.amount) ? counter.amount : 0;
  const adjust = Number.isFinite(counter.adjust) ? counter.adjust : 0;
  return roundCents(countOccurrences(counter.start, today, counter.period) * amount + adjust);
}

/** Total des comptes d'épargne (montants invalides ignorés). */
export function accountsTotal(accounts: SavingsAccount[] | undefined): number {
  return roundCents(
    (accounts || []).reduce((sum, a) => sum + (Number.isFinite(a.amount) ? a.amount : 0), 0)
  );
}

const euroFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** « 5 050 € » / « 12,50 € ». */
export const formatEuros = (n: number): string => euroFmt.format(Number.isFinite(n) ? n : 0);

/**
 * Lecture tolérante d'un montant saisi (virgule ou point).
 * '' et '-' valent 0 (saisie en cours) ; une saisie illisible renvoie null.
 */
export function parseAmount(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.' || t === '-.') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
