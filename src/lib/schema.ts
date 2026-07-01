import { z } from 'zod';

/**
 * Schéma de validation VOLONTAIREMENT PERMISSIF.
 *
 * Ce n'est PAS un miroir strict de AppData (src/types/index.ts). Le rôle de
 * ce schéma n'est pas de rejeter des documents anciens ou incomplets —
 * migrateData() s'en charge déjà et sait combler les champs manquants.
 * Son seul rôle est d'attraper les formes IMPOSSIBLES à digérer sans planter
 * (ex. `days` qui serait une chaîne, `updatedAt` qui serait une chaîne),
 * c'est-à-dire des données corrompues plutôt que simplement anciennes.
 *
 * Toute clé non listée ici est acceptée telle quelle (.passthrough()) :
 * on ne veut pas qu'un ajout de champ futur fasse échouer la validation.
 */

const looseRecord = z.record(z.string(), z.unknown());

const exerciseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    reps: z.number(),
    rest: z.number(),
    sets: z.number(),
    timed: z.boolean(),
    dur: z.number(),
  })
  .passthrough();

const workoutSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    items: z.array(exerciseSchema),
  })
  .passthrough();

const habitSchema = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .passthrough();

const agendaCategorySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    color: z.string(),
  })
  .passthrough();

const agendaSchema = z
  .object({
    statuses: z.array(agendaCategorySchema).optional(),
    activities: z.array(agendaCategorySchema).optional(),
    rdvTypes: z.array(agendaCategorySchema).optional(),
    periods: z.array(looseRecord).optional(),
    events: z.array(looseRecord).optional(),
  })
  .passthrough();

/**
 * `days` : chaque entrée est un objet libre (DayEntry a beaucoup de champs
 * optionnels). On valide seulement que `days` lui-même est un objet dont
 * les clés pointent vers des objets — pas vers des chaînes/nombres/null,
 * ce qui casserait pruneOldDays() et tout composant qui lit `days[k].habits`.
 */
const daysSchema = z.record(z.string(), z.record(z.string(), z.unknown()).nullable());

export const remoteAppDataSchema = z
  .object({
    workouts: z.array(workoutSchema).optional(),
    weekTemplate: looseRecord.optional(),
    wods: z.array(looseRecord).optional(),
    habits: z.array(habitSchema).optional(),
    customFoods: z.array(looseRecord).optional(),
    combos: z.array(looseRecord).optional(),
    days: daysSchema.optional(),
    progress: looseRecord.nullable().optional(),
    agenda: agendaSchema.optional(),
    anniversaries: z.array(looseRecord).optional(),
    // updatedAt DOIT être un nombre s'il est présent : c'est le champ dont
    // dépend toute la garde de fraîcheur (decideSnapshot). Une valeur
    // corrompue ici (string, objet Firestore Timestamp mal sérialisé...)
    // romprait silencieusement la synchro.
    updatedAt: z.number().optional(),
    cycleStart: z.string().optional(),
    drinkfree: looseRecord.optional(),
    targets: looseRecord.optional(),
    profile: looseRecord.optional(),
  })
  .passthrough();

export type RemoteAppDataResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Valide une charge utile brute venant de Firestore ou de localStorage.
 * Ne lève jamais : retourne un résultat discriminé, à charge de l'appelant
 * de décider du fallback (cf. politique choisie dans useAppData.ts :
 * repli silencieux sur le dernier état local connu, sans UI).
 */
export function parseRemoteAppData(raw: unknown): RemoteAppDataResult {
  const result = remoteAppDataSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data as Record<string, unknown> };
  }
  return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
