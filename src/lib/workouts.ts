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

export function workoutForDay(data: AppData, k: string): Workout | null {
  const wt = data.weekTemplate || DEFAULT_WEEK_TEMPLATE;
  const wid = wt[parseKey(k).getDay()];
  if (!wid) return null;
  return getWorkouts(data).find((w) => w.id === wid) || null;
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

/** Statut sportif d'un jour : "actif" ou "off". */
export function sportStatus(data: AppData, k: string): string {
  const agenda = data.agenda || {};
  const cyc = (agenda.periods || []).find(
    (p) => p.kind === 'cycle' && inRange(k, p.start, p.end)
  );
  if (cyc) return cyc.catId;
  const w = Math.floor(daysBetween(data.cycleStart || dateKey(), k) / 7);
  const pos = ((w % 9) + 9) % 9;
  if (pos >= 8) return 'off';
  return dayType(parseKey(k)) === 'repos' ? 'off' : 'actif';
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
