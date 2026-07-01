/**
 * Gardes pures extraites de useAppData.ts pour être testables unitairement,
 * sans dépendance React ni Firebase. Le comportement est STRICTEMENT
 * identique à la version inline précédente.
 */

/**
 * Retire récursivement toutes les valeurs `undefined` d'un objet/tableau.
 * Firestore REJETTE tout document contenant `undefined` (contrairement à
 * `null`, accepté). Une seule valeur `undefined` glissée dans AppData
 * suffisait à faire échouer TOUTES les écritures suivantes — silencieusement.
 * Ce nettoyage élimine cette classe d'échec à la racine.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/** Décision prise pour chaque snapshot Firestore entrant. */
export type SnapshotDecision =
  /** Appliquer le snapshot (cas normal). */
  | 'accept'
  /** Ignorer : une saisie locale est en cours de débounce (localDirty). */
  | 'ignore-dirty'
  /** Ignorer : snapshot plus ancien que l'état local (cache/pending). */
  | 'ignore-stale'
  /**
   * Ignorer ET re-pousser l'état local vers le serveur : le SERVEUR
   * lui-même est en retard (écriture perdue : débounce tué par iOS,
   * setDoc échoué…). C'est l'auto-guérison du bug « bloqué au 29 juin ».
   */
  | 'repush-local';

export interface SnapshotContext {
  /** True si une modification locale attend son flush (débounce en cours). */
  localDirty: boolean;
  /** True si un état est déjà affiché (dataRef.current !== null). */
  hasLocalData: boolean;
  /** updatedAt de l'état local (0 si absent). */
  localUpdatedAt: number;
  /** updatedAt du snapshot entrant, après migrateData (0 si absent). */
  incomingUpdatedAt: number;
  /** snap.metadata.fromCache */
  fromCache: boolean;
  /** snap.metadata.hasPendingWrites */
  hasPendingWrites: boolean;
}

/**
 * GARDE DE FRAÎCHEUR — cœur du correctif de synchro.
 * Règles, dans l'ordre :
 * 1. Saisie locale en cours + état déjà affiché → on n'écrase rien
 *    (exception : premier chargement, hasLocalData=false, pour ne pas
 *    rester sur un écran vide).
 * 2. Snapshot plus ancien que l'état local → jamais appliqué. S'il vient
 *    du serveur (fromCache=false, pas de pendingWrites), on re-pousse
 *    l'état local pour remettre le serveur à niveau.
 * 3. Sinon → accepté.
 */
export function decideSnapshot(ctx: SnapshotContext): SnapshotDecision {
  if (ctx.localDirty && ctx.hasLocalData) return 'ignore-dirty';
  if (ctx.hasLocalData && ctx.incomingUpdatedAt < ctx.localUpdatedAt) {
    if (!ctx.fromCache && !ctx.hasPendingWrites) return 'repush-local';
    return 'ignore-stale';
  }
  return 'accept';
}
