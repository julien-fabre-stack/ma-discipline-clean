import { useCallback, useEffect, useRef, useState } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppData } from '@/types';
import { defaultAppData, migrateData } from './defaults';
import { dateKey, pruneOldDays } from './utils';
import { decideSnapshot, stripUndefined } from './guards';
import { parseRemoteAppData } from './schema';

/**
 * Un patch peut être un objet partiel OU une fonction (prev) => patch.
 * La forme fonctionnelle est la seule sûre pour les contrôles tapés
 * rapidement (cases à cocher, steppers de quantité) : elle calcule la
 * nouvelle valeur à partir de l'état LE PLUS RÉCENT (prev), jamais d'un
 * instantané figé au moment du render. Sans ça, deux taps rapprochés ou
 * un snapshot intercalé font repartir le 2ᵉ calcul d'un état périmé et
 * annulent le 1ᵉ (« la case se décoche toute seule », « +1 au lieu de +2 »).
 */
export type AppDataPatch =
  | Partial<AppData>
  | ((prev: AppData) => Partial<AppData>);

export interface UseAppDataResult {
  data: AppData | null;
  update: (patch: AppDataPatch) => void;
  pendingWrites: boolean;
  archiveError: string | null;       // mois échoués à archiver, null si aucun
  localCacheError: boolean;          // true si localStorage a dépassé son quota
  /**
   * Code d'erreur Firestore si l'écriture du document principal a échoué
   * après épuisement des tentatives (ex. 'invalid-argument',
   * 'permission-denied'). null tant que tout va bien. AVANT ce champ, ces
   * échecs étaient totalement silencieux : le serveur restait figé à la
   * dernière écriture réussie pendant que l'app affichait des données
   * locales — d'où une synchro « bloquée » à une date passée.
   */
  syncError: string | null;
}

const SAVE_DEBOUNCE_MS = 400;
/** Délais (ms) entre tentatives d'écriture après un échec. */
const RETRY_DELAYS_MS = [2000, 6000, 15000];

function localKey(uid: string) { return `appdata_${uid}`; }

function loadLocal(uid: string): AppData | null {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = parseRemoteAppData(parsed);
    if (!validated.ok) {
      console.warn('Cache local corrompu, ignoré :', validated.error);
      return null;
    }
    return migrateData({ ...defaultAppData(), ...validated.data });
  } catch { return null; }
}

/**
 * Tente d'écrire dans localStorage.
 * Retourne false si le quota est dépassé (QuotaExceededError) ou en cas
 * d'autre erreur, true si la sauvegarde a réussi.
 */
function saveLocal(uid: string, data: AppData): boolean {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(data));
    return true;
  } catch (e) {
    // QuotaExceededError sur iOS/Safari quand le stockage est plein.
    console.warn('localStorage plein ou indisponible :', e);
    return false;
  }
}

export function useAppData(uid: string | null): UseAppDataResult {
  const [data, setData] = useState<AppData | null>(null);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [localCacheError, setLocalCacheError] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef<DocumentReference | null>(null);
  const uidRef = useRef<string | null>(null);
  // Miroir de `data` accessible sans dépendance (pour le handler de snapshot).
  const dataRef = useRef<AppData | null>(null);
  // True dès qu'une modification locale attend d'être persistée côté serveur.
  // Tant que c'est vrai, on ignore TOUS les snapshots entrants (cache ET
  // serveur) qui réécriraient l'état : c'est la protection contre l'écrasement
  // de la saisie optimiste en cours (l'équivalent du verrou de focus des notes,
  // mais valable pour TOUS les contrôles : cases, steppers, eau, todos…).
  const localDirty = useRef(false);
  // Dernière charge utile en attente de flush (pour le flush immédiat sur
  // pagehide : iOS peut tuer la PWA AVANT l'expiration du débounce de 400 ms,
  // auquel cas l'écriture serveur n'était jamais mise en file — perdue).
  const pendingPayload = useRef<{ ref: DocumentReference; next: AppData } | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { dataRef.current = data; }, [data]);

  /**
   * Écriture Firestore effective, avec interception d'erreur et tentatives.
   * Chaque nouvelle écriture annule les tentatives de la précédente (la
   * charge la plus récente contient tout l'état, inutile de rejouer l'ancienne).
   */
  const commit = useCallback((ref: DocumentReference, next: AppData, attempt = 0) => {
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    setDoc(ref, stripUndefined(next), { merge: true })
      .then(() => setSyncError(null))
      .catch((e: { code?: string }) => {
        const code = e?.code ?? 'unknown';
        console.warn(`setDoc échoué (tentative ${attempt + 1}) :`, code, e);
        if (attempt < RETRY_DELAYS_MS.length) {
          retryTimer.current = setTimeout(
            () => commit(ref, dataRef.current ?? next, attempt + 1),
            RETRY_DELAYS_MS[attempt]
          );
        } else {
          // Échec définitif : on le rend VISIBLE au lieu de le taire.
          // Les données restent dans localStorage, rien n'est perdu localement.
          setSyncError(code);
        }
      });
  }, []);

  // Planificateur d'écriture unique et debouncé. Une seule écriture « en vol »
  // à la fois : chaque appel annule la précédente et garde localDirty=true
  // jusqu'au flush effectif.
  const scheduleSave = useCallback((ref: DocumentReference, next: AppData) => {
    const u = uidRef.current;
    if (u) {
      const ok = saveLocal(u, next);
      if (!ok) setLocalCacheError(true);
    }
    localDirty.current = true;
    pendingPayload.current = { ref, next };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      localDirty.current = false;
      pendingPayload.current = null;
      commit(ref, next);
    }, SAVE_DEBOUNCE_MS);
  }, [commit]);

  /** Flush immédiat du débounce en cours (appelé quand la page se cache). */
  const flushNow = useCallback(() => {
    if (!pendingPayload.current) return;
    const { ref, next } = pendingPayload.current;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    localDirty.current = false;
    pendingPayload.current = null;
    commit(ref, next);
  }, [commit]);

  // iOS PWA : quand l'app passe en arrière-plan, les timers JS sont gelés puis
  // le processus peut être tué. Sans flush, toute modification faite dans les
  // 400 ms précédentes n'atteignait JAMAIS Firestore.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushNow(); };
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flushNow]);

  useEffect(() => {
    if (!uid || !db) {
      setData(null);
      dataRef.current = null;
      uidRef.current = null;
      return;
    }
    uidRef.current = uid;

    // Charge le cache local immédiatement pour ne pas bloquer l'UI (offline-first).
    const cached = loadLocal(uid);
    if (cached) {
      dataRef.current = cached;
      setData(cached);
    }

    const today = dateKey();
    const ref = doc(db, 'users', uid, 'app', 'data');
    docRef.current = ref;

    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        setPendingWrites(snap.metadata.hasPendingWrites);

        // Validation Zod AVANT migrateData : n'attrape que les formes
        // impossibles à digérer (données corrompues), pas les documents
        // simplement anciens — migrateData gère déjà ce cas. En cas de
        // rejet : repli silencieux sur le dernier état local connu (aucune
        // UI, aucun écrasement) ; s'il n'y en a aucun, repli sur les
        // valeurs par défaut pour ne jamais bloquer l'app.
        let base: AppData;
        if (snap.exists()) {
          const validated = parseRemoteAppData(snap.data());
          if (!validated.ok) {
            console.warn('Document Firestore corrompu, ignoré :', validated.error);
            if (dataRef.current) return; // garde l'état local affiché tel quel
            base = migrateData({ ...defaultAppData() });
          } else {
            base = migrateData({ ...defaultAppData(), ...validated.data });
          }
        } else {
          base = migrateData({ ...defaultAppData() });
        }

        // GARDE DE FRAÎCHEUR + verrou de saisie — logique pure extraite
        // dans guards.ts (decideSnapshot), testée unitairement. Le
        // comportement est identique à la version inline précédente.
        const local = dataRef.current;
        const decision = decideSnapshot({
          localDirty: localDirty.current,
          hasLocalData: local !== null,
          localUpdatedAt: local?.updatedAt ?? 0,
          incomingUpdatedAt: base.updatedAt ?? 0,
          fromCache: snap.metadata.fromCache,
          hasPendingWrites: snap.metadata.hasPendingWrites,
        });
        if (decision === 'ignore-dirty' || decision === 'ignore-stale') return;
        if (decision === 'repush-local') {
          console.log(
            `Serveur en retard (${base.updatedAt ?? 0} < ${local?.updatedAt ?? 0}) : re-poussée des données locales.`
          );
          if (local) scheduleSave(ref, local);
          return;
        }

        if (!snap.exists() && snap.metadata.fromCache === false) {
          console.log('Création du document Firestore (première initialisation)');
          setDoc(ref, stripUndefined(defaultAppData())).catch((e) =>
            console.warn('Création du document échouée :', e)
          );
        }

        const { kept, removed, changed } = pruneOldDays(base.days, today);
        if (changed) {
          const next: AppData = { ...base, days: kept };
          dataRef.current = next;
          setData(next);

          const byMonth: Record<string, Record<string, unknown>> = {};
          Object.keys(removed).forEach((k) => {
            const m = k.slice(0, 7);
            (byMonth[m] = byMonth[m] || {})[k] = removed[k];
          });
          if (db) {
            Object.entries(byMonth).forEach(([m, obj]) => {
              const archiveRef = doc(db!, 'users', uid, 'archive', m);
              const attempt = (retries: number) =>
                setDoc(archiveRef, stripUndefined(obj), { merge: true }).catch((e) => {
                  if (retries > 0) {
                    setTimeout(() => attempt(retries - 1), 5000);
                  } else {
                    console.warn('Archivage échoué définitivement pour', m, e);
                    setArchiveError(m);
                  }
                });
              attempt(2);
            });
          }

          // Écriture du document élagué via le planificateur unique.
          scheduleSave(ref, next);
        } else {
          dataRef.current = base;
          setData(base);
          const ok = saveLocal(uid, base);
          if (!ok) setLocalCacheError(true);
        }
      },
      (err) => {
        console.warn('Firestore snapshot error (hors-ligne) :', err.code);
        // Pas de données du tout : on démarre quand même sur un état par défaut
        // pour ne jamais bloquer l'app hors-ligne.
        setData((prev) => {
          const next = prev ?? defaultAppData();
          dataRef.current = next;
          return next;
        });
      }
    );

    return () => {
      unsub();
      // On FLUSH au lieu de jeter : avant, le clearTimeout du cleanup
      // annulait purement et simplement l'écriture en attente.
      flushNow();
      if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    };
  }, [uid, scheduleSave, flushNow]);

  const update = useCallback((patch: AppDataPatch) => {
    setData((prev) => {
      if (!prev) return prev;
      const resolved = typeof patch === 'function' ? patch(prev) : patch;
      // Convention : si l'updater renvoie `prev` tel quel, c'est un no-op
      // (rien à écrire). On évite ainsi une écriture Firestore inutile.
      if (resolved === prev) return prev;
      // Horodatage de fraîcheur : chaque modification locale date l'état.
      const next: AppData = { ...prev, ...resolved, updatedAt: Date.now() };
      dataRef.current = next;
      const ref = docRef.current;
      if (ref) {
        scheduleSave(ref, next);
      } else if (uidRef.current) {
        const ok = saveLocal(uidRef.current, next);
        if (!ok) setLocalCacheError(true);
      }
      return next;
    });
  }, [scheduleSave]);

  return { data, update, pendingWrites, archiveError, localCacheError, syncError };
}
