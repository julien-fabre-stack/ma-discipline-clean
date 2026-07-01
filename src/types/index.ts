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
  dur: number;
}

export interface Workout {
  id: string;
  name: string;
  items: Exercise[];
}

export type WeekTemplate = Partial<Record<number, string[]>>;

export interface SessionProgress {
  idx: number;
  wid?: string;
}

// ===== WOD =====

export interface WodItem {
  name: string;
  dur: number;
}

export interface Wod {
  id: string;
  name: string;
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
  p: number;
  c: number;
  f: number;
}

export interface MealEntry {
  id: string;
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
  water: number;
}

// ===== Habitudes =====

export interface Habit {
  id: string;
  label: string;
}

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
  start: string;
  end: string;
}

export interface AgendaEvent {
  id: string;
  date: string;
  label: string;
  time: string;
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

export type DaysMap = Record<string, DayEntry>;

// ===== Profil =====

export interface Profile {
  name: string;
  birthdate: string;
  height: string;
  weight: string;
  goals: string;
  photo: string;
}

// ===== Dates anniversaires =====

/**
 * Anniversaire récurrent annuel. La comparaison se fait sur le mois+jour
 * (MM-DD), indépendamment de l'année : l'événement revient chaque année.
 * `date` est stockée au format ISO "YYYY-MM-DD" (sortie native de <input
 * type="date">) ; l'année sert uniquement à calculer l'âge atteint quand
 * elle correspond à une vraie année d'origine.
 */
export interface Anniversary {
  id: string;
  label: string;
  date: string;     // "YYYY-MM-DD" — seul MM-DD est utilisé pour la récurrence
  notify: boolean;  // alerte 7 jours à l'avance dans le tableau de bord
}

// ===== Thème / apparence =====

export type ThemeId = 'aube' | 'nuit' | 'ardoise' | 'aurore' | 'foret' | 'paper' | 'custom';

/** Couleurs de base d'un thème personnalisé. Le reste de la palette en dérive. */
export interface CustomColors {
  night: string;
  ember: string;
  gold: string;
}

export type FontFamilyId = 'system' | 'rounded' | 'serif' | 'mono';
export type FontScaleId = 'compact' | 'normal' | 'large';
export type TabTransitionId = 'slide' | 'fade' | 'scale' | 'none';
export type AnimSpeedId = 'fast' | 'normal' | 'slow' | 'off';

// ===== Chiffrement journal =====

export interface JournalMeta {
  verifier: { iv: string; ct: string };
}

// ===== Document principal =====

export interface DrinkFreeCounter {
  start: string;
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

  /** Dates anniversaires récurrentes (annuelles). */
  anniversaries: Anniversary[];

  /**
   * Horodatage (epoch ms) de la dernière modification locale.
   * Sert de garde de fraîcheur : un snapshot Firestore plus ancien que
   * l'état local ne doit JAMAIS l'écraser (sinon retour aux vieilles données
   * à chaque relance si une écriture serveur a été perdue).
   */
  updatedAt?: number;

  /** Chiffrement du journal (optionnel tant que pas configuré). */
  journalMeta?: JournalMeta;

  // Apparence
  theme?: ThemeId;
  accent?: string | null;
  navAlpha?: number;
  runnerTextColor?: string;
  runnerFinishMsg?: string;

  /** Couleurs du thème personnalisé (utilisées quand theme === 'custom'). */
  customColors?: CustomColors;
  /** Typographie. */
  fontFamily?: FontFamilyId;
  fontScale?: FontScaleId;
  /** Surcharges de couleur de texte (null/undefined = couleur du thème). */
  textColor?: string | null;
  dimColor?: string | null;
  /** Animations. */
  tabTransition?: TabTransitionId;
  animSpeed?: AnimSpeedId;
  buttonAnim?: boolean;
}

// ===== Runner =====

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
