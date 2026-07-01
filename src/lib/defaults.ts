import type {
  Agenda,
  AgendaCategory,
  AppData,
  Habit,
  MealKey,
  Exercise,
  WeekTemplate,
  Workout,
} from '@/types';
import { addDays, dateKey } from './utils';

export const MEALS: [MealKey, string][] = [
  ['petitdej', 'Petit Déjeuner'],
  ['dej', 'Déjeuner'],
  ['diner', 'Dîner'],
  ['snack', 'Snacks / Autre'],
];

export const MEAL_COLORS: Record<MealKey, string> = {
  petitdej: '#FFC24B',
  dej: '#FF7A45',
  diner: '#5BC0FF',
  snack: '#A78BFA',
};

export const DEFAULT_HABITS: Habit[] = [
  { id: 'reveil', label: 'Réveil 05h00' },
  { id: 'sport', label: 'Sport' },
  { id: 'douche', label: 'Douche froide' },
  { id: 'pills', label: 'Pills' },
  { id: 'medit', label: 'Méditation' },
  { id: 'studi', label: 'studi' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'promenade', label: 'Promenade' },
  { id: 'manger', label: 'Manger sain' },
  { id: 'dormir', label: 'Dormir 21:00' },
];

let _n = 0;
function ex(
  name: string,
  reps: number,
  rest = 0,
  sets = 1,
  timed = false,
  dur = 0
): Exercise {
  return { id: 's' + _n++, name, reps, rest, sets, timed, dur };
}

/** La séance "LA Règle" originale, portée fidèlement depuis la v1. */
export function defaultSession(): Exercise[] {
  _n = 0;
  const items: Exercise[] = [];
  const A = (
    name: string,
    reps: number,
    rest = 0,
    sets = 1,
    timed = false,
    dur = 0
  ) => items.push(ex(name, reps, rest, sets, timed, dur));

  // Bloc 1 — pompes
  A('Pompes diamants', 10, 25, 3);
  A('Pompes normales', 10, 25, 3);
  A('Pompes jambes surélevées', 10, 25, 3);
  A('Pompes torse surélevé', 10, 25, 3);
  A('Burpees', 10, 90, 1);
  // Bloc 2 — tractions
  A('Tractions pronation', 3, 25, 3);
  A('Tractions supination', 3, 25, 3);
  A('Tractions prise milieu', 3, 25, 3);
  A('Burpees', 10, 90, 1);
  // Bloc 3 — tractions max + burpees
  A('Tractions pronation', 10, 0, 1);
  A('Burpees', 10, 90, 1);
  A('Tractions supination', 10, 0, 1);
  A('Burpees', 10, 90, 1);
  A('Tractions prise milieu', 10, 0, 1);
  A('Burpees', 10, 90, 1);
  // Bloc 4 — pompes max + burpees
  A('Pompes diamant', 15, 0, 1);
  A('Burpees', 10, 90, 1);
  A('Pompes normales', 15, 0, 1);
  A('Burpees', 10, 90, 1);
  A('Pompes pieds surélevés', 15, 0, 1);
  A('Burpees', 10, 90, 1);
  A('Pompes buste surélevé', 15, 0, 1);
  A('Burpees', 10, 90, 1);
  // Bloc 5 — tractions x2 + burpees 5
  A('Tractions pronation', 3, 25, 2);
  A('Tractions supination', 3, 25, 2);
  A('Tractions milieu', 3, 25, 2);
  A('Burpees', 5, 90, 1);
  // Bloc 6 — pompes x2 + burpees 5
  A('Pompes diamants', 10, 25, 2);
  A('Pompes normales', 10, 25, 2);
  A('Pompes pieds surélevés', 10, 25, 2);
  A('Pompes torse surélevé', 10, 25, 2);
  A('Burpees', 5, 90, 1);
  // Bloc 7 — maker + frappes
  A('Maker complex 8 kg', 20, 60, 1);
  A('Coups de pied (sac)', 0, 10, 8, true, 20);
  A('Repos', 0, 0, 1, true, 60);
  A('Coups de poing + esquive', 0, 10, 1, true, 20);
  A('Repos', 0, 0, 1, true, 60);
  A('Gainage', 0, 10, 1, true, 20);
  A('Repos', 0, 0, 1, true, 60);
  // Bloc 8 — circuit cardio
  A('Roue abdos', 0, 20, 1, true, 40);
  A('Battle rope', 0, 20, 1, true, 40);
  A('Gainage rotation', 0, 20, 1, true, 40);
  A('Jumping jack', 0, 20, 1, true, 40);
  A('Deep squat', 0, 20, 1, true, 40);
  A('Wall sit', 0, 20, 1, true, 40);
  A('Mountain climbers', 0, 20, 1, true, 40);
  A('Shoulder tap', 0, 20, 1, true, 40);
  A('Squat', 0, 20, 1, true, 40);
  A('Coups de pieds', 0, 20, 1, true, 40);
  A('Bear crawling', 0, 20, 1, true, 40);
  // Bloc 9 — explosifs
  A('Pompes explosives descente souple', 5, 0, 1);
  A('Tractions explosives descente souple', 5, 0, 1);
  return items;
}

export const DEFAULT_STATUSES: AgendaCategory[] = [
  { id: 'mission', label: 'Mission', color: '#FF7A45' },
  { id: 'repos', label: 'Repos', color: '#5BC0FF' },
  { id: 'perm', label: 'Permission', color: '#A78BFA' },
];

export const DEFAULT_ACTIVITIES: AgendaCategory[] = [
  { id: 'reposport', label: 'Repos sport', color: '#4ADE80' },
  { id: 'ophelia', label: 'Ophélia', color: '#FF6FA5' },
  { id: 'croixrouge', label: 'Croix-Rouge', color: '#E5484D' },
];

export const DEFAULT_RDV_TYPES: AgendaCategory[] = [
  { id: 'rdvperso', label: 'Perso', color: '#FFC24B' },
  { id: 'rdvtravail', label: 'Travail', color: '#5BC0FF' },
  { id: 'rdvsante', label: 'Santé', color: '#E5484D' },
  { id: 'rdvfamille', label: 'Famille', color: '#FF6FA5' },
];

export const CYCLE_CATS = [
  { id: 'actif', label: 'Actif', color: '#4ADE80' },
  { id: 'off', label: 'Off', color: '#2A2438' },
];

export const RDV_COLORS = [
  '#FFC24B',
  '#E5484D',
  '#FF6FA5',
  '#34D1BF',
  '#5BC0FF',
  '#A78BFA',
];

export const DEFAULT_WEEK_TEMPLATE: WeekTemplate = {
  1: ['law'],
  2: ['law'],
  4: ['law'],
  5: ['law'],
};

export function defaultAgenda(): Agenda {
  return {
    statuses: DEFAULT_STATUSES.map((s) => ({ ...s })),
    activities: DEFAULT_ACTIVITIES.map((s) => ({ ...s })),
    rdvTypes: DEFAULT_RDV_TYPES.map((s) => ({ ...s })),
    periods: [],
    events: [],
  };
}

export function defaultWorkouts(): Workout[] {
  return [{ id: 'law', name: 'LA Règle', items: defaultSession() }];
}

export function defaultAppData(): AppData {
  return {
    cycleStart: dateKey(),
    drinkfree: { start: dateKey() },
    targets: { train: 2400, recup: 2050, repos: 1800, water: 2 },
    profile: { name: '', birthdate: '', height: '', weight: '', goals: '', photo: '' },
    workouts: defaultWorkouts(),
    weekTemplate: { ...DEFAULT_WEEK_TEMPLATE },
    wods: [
      {
        id: 'w1',
        name: 'WOD exemple',
        transitionDur: 10,
        items: [
          { name: 'Pompes', dur: 30 },
          { name: 'Air squats', dur: 30 },
          { name: 'Mountain climbers', dur: 30 },
        ],
      },
    ],
    habits: DEFAULT_HABITS.map((h) => ({ ...h })),
    customFoods: [],
    combos: [],
    days: {},
    progress: null,
    agenda: defaultAgenda(),
    anniversaries: [],
    updatedAt: 0,
  };
}

/**
 * Migration des anciens documents Firestore vers la forme actuelle.
 * Conserve la compatibilité avec les données déjà stockées par la v1.
 */
export function migrateData(raw: Partial<AppData> & Record<string, unknown>): AppData {
  const x: AppData = { ...defaultAppData(), ...raw } as AppData;

  if (!x.workouts || !x.workouts.length) {
    const legacySession = (raw as { session?: Exercise[] }).session;
    x.workouts = [
      { id: 'law', name: 'LA Règle', items: legacySession?.length ? legacySession : defaultSession() },
    ];
  }
  if (!x.weekTemplate || !Object.keys(x.weekTemplate).length) {
    const w0 = x.workouts[0].id;
    x.weekTemplate = { 1: [w0], 2: [w0], 4: [w0], 5: [w0] };
  } else {
    // Normalise l'ancien modèle mono-séance ({jour: id}) vers une liste ({jour: [id]}).
    const nt: WeekTemplate = {};
    for (const k of Object.keys(x.weekTemplate)) {
      const v = (x.weekTemplate as Record<number, string | string[]>)[+k];
      if (Array.isArray(v)) {
        if (v.length) nt[+k] = v;
      } else if (v) {
        nt[+k] = [v];
      }
    }
    x.weekTemplate = nt;
  }
  // Compteur sans alcool : nouveau modèle basé sur une date de départ.
  const df = x.drinkfree as unknown as { start?: string; date?: string; count?: number };
  if (!df || !df.start) {
    const baseDate = (df && df.date) || dateKey();
    const baseCount = (df && df.count) || 0;
    x.drinkfree = { start: addDays(baseDate, -baseCount) };
  }
  if (!x.profile) {
    x.profile = { name: '', birthdate: '', height: '', weight: '', goals: '', photo: '' };
  }
  if (!x.agenda) {
    x.agenda = defaultAgenda();
  } else if (!x.agenda.rdvTypes) {
    x.agenda = { ...x.agenda, rdvTypes: DEFAULT_RDV_TYPES.map((s) => ({ ...s })) };
  }
  // Anniversaires : champ ajouté après coup, absent des anciens documents.
  if (!Array.isArray(x.anniversaries)) {
    x.anniversaries = [];
  }
  // Garde de fraîcheur : les anciens documents n'ont pas d'horodatage.
  if (typeof x.updatedAt !== 'number' || !Number.isFinite(x.updatedAt)) {
    x.updatedAt = 0;
  }
  return x;
}
