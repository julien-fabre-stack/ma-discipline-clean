import type { AppData, Agenda, AgendaCategory, AgendaEvent } from '@/types';
import { DEFAULT_HABITS } from './defaults';
import { addDays, inRange } from './utils';

export function statusOf(agenda: Agenda, k: string): AgendaCategory | null {
  const p = (agenda.periods || []).find(
    (p) => p.kind === 'status' && inRange(k, p.start, p.end)
  );
  return p ? (agenda.statuses || []).find((s) => s.id === p.catId) || null : null;
}

export function activitiesOf(agenda: Agenda, k: string): AgendaCategory[] {
  const ps = (agenda.periods || []).filter(
    (p) => p.kind === 'activity' && inRange(k, p.start, p.end)
  );
  return ps
    .map((p) => (agenda.activities || []).find((a) => a.id === p.catId))
    .filter((a): a is AgendaCategory => Boolean(a));
}

export function eventsOf(agenda: Agenda, k: string): AgendaEvent[] {
  return (agenda.events || [])
    .filter((e) => e.date === k)
    .sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1));
}

/**
 * Proportion d'habitudes cochées pour un jour (0 à 1).
 * On ne compte QUE les habitudes actuellement définies dans data.habits :
 * une habitude supprimée mais encore cochée dans un vieux jour ne doit pas
 * gonfler le ratio (sinon le ratio pouvait dépasser 1 et marquer à tort
 * une journée comme "parfaite").
 */
export function ratioOfDay(data: AppData, k: string): number {
  const habits = data.habits || DEFAULT_HABITS;
  const hl = habits.length || 1;
  const ddd = data.days[k];
  if (!ddd || !ddd.habits || Array.isArray(ddd.habits)) return 0;
  const dh = ddd.habits;
  const done = habits.reduce((n, h) => n + (dh[h.id] ? 1 : 0), 0);
  return done / hl;
}

export function cycleStatusOf(agenda: Agenda, k: string): string | null {
  const p = (agenda.periods || []).find(
    (p) => p.kind === 'cycle' && inRange(k, p.start, p.end)
  );
  return p ? p.catId : null;
}

// ===== Anniversaires (récurrence annuelle) =====

/** Extrait la portion "MM-DD" d'une clé "YYYY-MM-DD". */
function mmdd(k: string): string {
  return k.length >= 10 ? k.slice(5, 10) : k;
}

export interface AnnivHit {
  label: string;
  /** Âge atteint ce jour-là, si l'année d'origine est connue ; sinon null. */
  years: number | null;
}

/**
 * Anniversaires tombant un jour donné. Fusionne la date de naissance du
 * profil (si renseignée) et la liste personnalisée data.anniversaries.
 * La comparaison porte UNIQUEMENT sur le mois+jour : contrairement à un
 * AgendaEvent (lié à une date fixe), un anniversaire revient chaque année.
 */
export function anniversariesOf(data: AppData, dayKey: string): AnnivHit[] {
  const md = mmdd(dayKey);
  const year = Number(dayKey.slice(0, 4));
  const hits: AnnivHit[] = [];
  const bd = data.profile?.birthdate;
  if (bd && mmdd(bd) === md) {
    const by = Number(bd.slice(0, 4));
    hits.push({ label: 'Ton anniversaire', years: by && by < year ? year - by : null });
  }
  for (const a of data.anniversaries || []) {
    if (a.date && mmdd(a.date) === md) {
      const ay = Number(a.date.slice(0, 4));
      hits.push({ label: a.label, years: ay && ay < year ? year - ay : null });
    }
  }
  return hits;
}

/**
 * Ensemble des "MM-DD" portant au moins un anniversaire.
 * Pré-calculé une seule fois puis interrogé en O(1) par la frise, qui
 * affiche ~600 jours : évite de reparcourir la liste pour chaque jour.
 */
export function anniversaryDaySet(data: AppData): Set<string> {
  const s = new Set<string>();
  const bd = data.profile?.birthdate;
  if (bd) s.add(mmdd(bd));
  for (const a of data.anniversaries || []) {
    if (a.date) s.add(mmdd(a.date));
  }
  return s;
}

/**
 * Anniversaires à venir dans les `within` prochains jours (exclut le jour
 * même). Respecte le drapeau `notify` des anniversaires personnalisés ;
 * la date de naissance du profil alerte toujours.
 */
export function upcomingAnniversaries(
  data: AppData,
  fromKey: string,
  within = 7
): { label: string; inDays: number }[] {
  const out: { label: string; inDays: number }[] = [];
  const bd = data.profile?.birthdate;
  const list = data.anniversaries || [];
  for (let i = 1; i <= within; i++) {
    const md = mmdd(addDays(fromKey, i));
    if (bd && mmdd(bd) === md) out.push({ label: 'Ton anniversaire', inDays: i });
    for (const a of list) {
      if (a.notify && a.date && mmdd(a.date) === md) out.push({ label: a.label, inDays: i });
    }
  }
  return out;
}
