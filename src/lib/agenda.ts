import type { AppData, Agenda, AgendaCategory, AgendaEvent } from '@/types';
import { DEFAULT_HABITS } from './defaults';
import { inRange } from './utils';

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

/** Proportion d'habitudes cochées pour un jour (0 à 1). */
export function ratioOfDay(data: AppData, k: string): number {
  const habits = data.habits || DEFAULT_HABITS;
  const hl = habits.length || 1;
  const ddd = data.days[k];
  if (!ddd || !ddd.habits || Array.isArray(ddd.habits)) return 0;
  return Object.values(ddd.habits).filter(Boolean).length / hl;
}

export function cycleStatusOf(agenda: Agenda, k: string): string | null {
  const p = (agenda.periods || []).find(
    (p) => p.kind === 'cycle' && inRange(k, p.start, p.end)
  );
  return p ? p.catId : null;
}
