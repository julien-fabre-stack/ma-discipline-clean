/**
 * Modèle de données de "Ma Discipline".
 *
 * Ce fichier est la SOURCE DE VÉRITÉ UNIQUE pour la forme des données.
 * Toute fonction qui lit ou écrit dans Firestore doit utiliser ces types.
 * C'est ce qui empêche la classe de bug rencontrée dans la v1 : un composant
 * qui suppose une forme de données différente de ce qui existe réellement.
 */

// ===== Exercices & séances =====

export interface Exercise {
  id: string;
  name: string;
  reps: number;
  rest: number;
  sets: number;
  timed: boolean;
  dur: number; // secondes, utilisé si timed === true
}

export interface Workout {
  id: string;
  name: string;
  items: Exercise[];
}

/** jour de semaine JS (0 = dimanche ... 6 = samedi) -> liste d'ids de Workout */
export type WeekTemplate = Partial<Record<number, string[]>>;

export interface SessionProgress {
  idx: number;
  wid?: string; // id du workout en cours (multi-séances par jour)
}

// ===== WOD =====

export interface WodItem {
  name: string;
  dur: number; // durée de l'exercice en secondes
}

export interface Wod {
  id: string;
  name: string;
  /** Délai de "mise en place" entre deux exercices, en secondes. */
  transitionDur: number;
  items: WodItem[];
}

// ===== Nutrition =====

export type FoodUnit = 'g' | 'piece';

export interface Food {
  id: string;
  name: string;
  unit: FoodUnit;
  kcal: number;
  p: number; // protéines
  c: number; // glucides
  f: number; // lipides
}

export interface MealEntry {
  id: string; // référence vers Food.id (perso ou CIQUAL importé)
  qty: number;
}

export type MealKey = 'petitdej' | 'dej' | 'diner' | 'snack';

export type Meals = Record<MealKey, MealEntry[]>;

export interface ComboItem {
  id: string;
  qty: number;
}

export interface Combo {
  id: string;
  name: string;
  items: ComboItem[];
}

export type DayType = 'train' | 'recup' | 'repos';

export interface NutritionTargets {
  train: number;
  recup: number;
  repos: number;
  water: number; // litres
}

// ===== Habitudes =====

export interface Habit {
  id: string;
  label: string;
}

/** clé d'habitude -> coché ou non, pour un jour donné */
export type DayHabits = Record<string, boolean>;

// ===== Agenda =====

export interface AgendaCategory {
  id: string;
  label: string;
  color: string;
}

export type PeriodKind = 'status' | 'activity' | 'cycle';

export interface Period {
  id: string;
  kind: PeriodKind;
  catId: string;
  start: string; // dateKey
  end: string; // dateKey
}

export interface AgendaEvent {
  id: string;
  date: string; // dateKey
  label: string;
  time: string; // "HH:MM" ou ""
  typeId: string | null;
  color: string;
}

export interface Agenda {
  statuses: AgendaCategory[];
  activities: AgendaCategory[];
  rdvTypes: AgendaCategory[];
  periods: Period[];
  events: AgendaEvent[];
}

// ===== Journal quotidien =====

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface DayEntry {
  meals?: Meals;
  water?: number;
  habits?: DayHabits;
  todos?: Todo[];
  note?: string;
}

export type DaysMap = Record<string, DayEntry>; // clé = dateKey "YYYY-MM-DD"

// ===== Profil =====

export interface Profile {
  name: string;
  birthdate: string; // dateKey ou ""
  height: string;
  weight: string;
  goals: string;
  photo: string; // data URL
}

// ===== Thème / apparence =====

export type ThemeId = 'aube' | 'nuit' | 'ardoise' | 'aurore' | 'foret';

// ===== Document principal =====

export interface DrinkFreeCounter {
  start: string; // dateKey de départ ; le nb de jours se calcule depuis cette date
}

export interface AppData {
  cycleStart: string;
  drinkfree: DrinkFreeCounter;
  targets: NutritionTargets;
  profile: Profile;
  workouts: Workout[];
  weekTemplate: WeekTemplate;
  wods: Wod[];
  habits: Habit[];
  customFoods: Food[];
  combos: Combo[];
  days: DaysMap;
  progress: SessionProgress | null;
  agenda: Agenda;

  // Apparence
  theme?: ThemeId;
  accent?: string | null;
  navAlpha?: number;
  runnerTextColor?: string;
  runnerFinishMsg?: string;
}

// ===== Runner (lecteur de séance) =====

export type StepKind = 'work' | 'rest' | 'timed';

export interface RunnerStep {
  kind: StepKind;
  block: string;
  name: string;
  reps: string;
  dur: number;
  tag: string | null;
  cue?: string | null;
}
