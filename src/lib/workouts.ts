import type { AppData, DayType, Exercise, RunnerStep, Workout } from '@/types';
import { DEFAULT_WEEK_TEMPLATE, defaultSession } from './defaults';
import { daysBetween, dateKey, inRange, parseKey } from './utils';

/** Type de jour par défaut selon le jour de semaine (lun/mar/jeu/ven = séance). */
export function dayType(d: Date = new Date()): DayType {
  const w = d.getDay();
  if ([1, 2, 4, 5].includes(w)) return 'train';
  if (w === 3) return 'recup';
  return 'repos';
}

export function getWorkouts(data: AppData): Workout[] {
  return data.workouts && data.workouts.length
    ? data.workouts
    : [{ id: 'law', name: 'LA Règle', items: data.workouts?.[0]?.items || defaultSession() }];
}

export function workoutIdsForDay(data: AppData, k: string): string[] {
  const wt = data.weekTemplate || DEFAULT_WEEK_TEMPLATE;
  const v = wt[parseKey(k).getDay()] as unknown as string | string[] | undefined;
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function workoutsForDay(data: AppData, k: string): Workout[] {
  const ws = getWorkouts(data);
  return workoutIdsForDay(data, k)
    .map((id) => ws.find((w) => w.id === id))
    .filter((w): w is Workout => Boolean(w));
}

export function workoutForDay(data: AppData, k: string): Workout | null {
  return workoutsForDay(data, k)[0] || null;
}

/** Libellé "Semaine N/8" du cycle d'entraînement de 9 semaines. */
export function cycleLabel(s: string): string {
  const w = Math.floor(daysBetween(s, dateKey()) / 7);
  const pos = ((w % 9) + 9) % 9;
  return pos < 8 ? `Semaine ${pos + 1}/8` : 'Semaine de décharge';
}

export function cycleLabelFor(data: AppData, k: string): string {
  const agenda = data.agenda || {};
  const cur = (agenda.periods || []).find(
    (p) => p.kind === 'cycle' && inRange(k, p.start, p.end)
  );
  if (cur) {
    if (cur.catId === 'off') return 'Semaine de décharge';
    const wk = Math.floor(daysBetween(cur.start, k) / 7) + 1;
    return `Semaine ${wk}`;
  }
  return cycleLabel(data.cycleStart || dateKey());
}

/**
 * Statut sportif d'un jour : "actif" ou "off", uniquement si une période de
 * cycle a été explicitement définie dans Réglages → Tableau de bord → Agenda.
 * Retourne `null` si aucun cycle n'est configuré (pas de calcul automatique).
 */
export function sportStatus(data: AppData, k: string): string | null {
  const agenda = data.agenda || {};
  const cyc = (agenda.periods || []).find(
    (p) => p.kind === 'cycle' && inRange(k, p.start, p.end)
  );
  return cyc ? cyc.catId : null;
}

/**
 * Transforme une liste d'exercices en séquence d'étapes pour le lecteur :
 * chaque série devient une étape "work" ou "timed", suivie d'une étape "rest"
 * si un repos est défini. Porté à l'identique depuis expandSession() de la v1.
 */
export function expandSession(items: Exercise[] | undefined): RunnerStep[] {
  const steps: RunnerStep[] = [];
  (items || []).forEach((it) => {
    const sets = it.sets && it.sets > 1 ? it.sets : 1;
    for (let s = 0; s < sets; s++) {
      const tag = sets > 1 ? `${s + 1}/${sets}` : null;
      if (it.timed) {
        steps.push({
          kind: 'timed',
          block: it.name,
          name: it.name,
          reps: (it.dur || 0) + ' s',
          dur: it.dur || 20,
          tag,
        });
      } else {
        steps.push({
          kind: 'work',
          block: it.name,
          name: it.name,
          reps: String(it.reps),
          dur: 0,
          cue: null,
          tag,
        });
      }
      if (it.rest > 0) {
        steps.push({ kind: 'rest', block: it.name, name: 'Repos', reps: '', dur: it.rest, tag: null });
      }
    }
  });
  return steps;
}
