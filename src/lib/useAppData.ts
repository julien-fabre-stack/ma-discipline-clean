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
}

const SAVE_DEBOUNCE_MS = 400;

function localKey(uid: string) { return `appdata_${uid}`; }

function loadLocal(uid: string): AppData | null {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (!raw) return null;
    return migrateData({ ...defaultAppData(), ...JSON.parse(raw) });
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

  useEffect(() => { dataRef.current = data; }, [data]);

  // Planificateur d'écriture unique et debouncé. Une seule écriture « en vol »
  // à la fois : chaque appel annule la précédente et garde localDirty=true
  // jusqu'au flush effectif. Remplace l'ancien compteur pendingVersion qui
  // pouvait rester bloqué > 0 après une rafale de modifications.
  const scheduleSave = useCallback((ref: DocumentReference, next: AppData) => {
    const u = uidRef.current;
    if (u) {
      const ok = saveLocal(u, next);
      if (!ok) setLocalCacheError(true);
    }
    localDirty.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      localDirty.current = false;
      void setDoc(ref, next, { merge: true });
    }, SAVE_DEBOUNCE_MS);
  }, []);

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

        // Une modification locale est en attente : on ne laisse AUCUN snapshot
        // (cache OU serveur) réécrire l'état, sinon la saisie en cours (case,
        // quantité…) serait écrasée par une version qui ne la contient pas
        // encore. Exception : si rien n'est encore affiché, on accepte le tout
        // premier chargement pour ne pas rester sur un écran vide.
        if (localDirty.current && dataRef.current !== null) return;

        const base = snap.exists()
          ? migrateData({ ...defaultAppData(), ...(snap.data() as Partial<AppData>) })
          : migrateData({ ...defaultAppData() });

        if (!snap.exists() && snap.metadata.fromCache === false) {
          console.log('Création du document Firestore (première initialisation)');
          void setDoc(ref, defaultAppData());
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
                setDoc(archiveRef, obj, { merge: true }).catch((e) => {
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
      if (saveTimer.current) clearTimeout(saveTimer.current);
      localDirty.current = false;
    };
  }, [uid, scheduleSave]);

  const update = useCallback((patch: AppDataPatch) => {
    setData((prev) => {
      if (!prev) return prev;
      const resolved = typeof patch === 'function' ? patch(prev) : patch;
      // Convention : si l'updater renvoie `prev` tel quel, c'est un no-op
      // (rien à écrire). On évite ainsi une écriture Firestore inutile.
      if (resolved === prev) return prev;
      const next: AppData = { ...prev, ...resolved };
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

  return { data, update, pendingWrites, archiveError, localCacheError };
}
