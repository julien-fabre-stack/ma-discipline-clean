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

export interface UseAppDataResult {
  data: AppData | null;
  update: (patch: Partial<AppData>) => void;
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
  // pendingVersion : nombre d'écritures locales en attente de persistance.
  // Permet d'ignorer les snapshots cache qui arriveraient PENDANT un debounce
  // (évite la race condition snapshot ↔ modification locale).
  const pendingVersion = useRef(0);

  useEffect(() => {
    if (!uid || !db) {
      setData(null);
      return;
    }

    // Charge le cache local immédiatement pour ne pas bloquer l'UI
    const cached = loadLocal(uid);
    if (cached) setData(cached);

    const today = dateKey();
    const ref = doc(db, 'users', uid, 'app', 'data');
    docRef.current = ref;

    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        setPendingWrites(snap.metadata.hasPendingWrites);

        // Si un debounce local est en attente, ignorer le snapshot entrant
        // pour éviter d'écraser une modification UI non encore persistée.
        if (pendingVersion.current > 0 && snap.metadata.fromCache) return;

        const base = snap.exists()
          ? migrateData({ ...defaultAppData(), ...(snap.data() as Partial<AppData>) })
          : migrateData({ ...defaultAppData() });

        if (!snap.exists() && snap.metadata.fromCache === false) {
          console.log("Création du document Firestore (première initialisation)");
          void setDoc(ref, defaultAppData());
        }

        const { kept, removed, changed } = pruneOldDays(base.days, today);
        if (changed) {
          const next: AppData = { ...base, days: kept };
          setData(next);

          // Sauvegarde locale — si le quota est dépassé, on le signale.
          const ok = saveLocal(uid, next);
          if (!ok) setLocalCacheError(true);

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
                    // Échec définitif : on remonte l'erreur à l'UI via state.
                    console.warn('Archivage échoué définitivement pour', m, e);
                    setArchiveError(m);
                  }
                });
              attempt(2);
            });
          }

          if (saveTimer.current) clearTimeout(saveTimer.current);
          pendingVersion.current++;
          saveTimer.current = setTimeout(() => {
            pendingVersion.current = Math.max(0, pendingVersion.current - 1);
            void setDoc(ref, next, { merge: true });
          }, SAVE_DEBOUNCE_MS);
        } else {
          setData(base);
          const ok = saveLocal(uid, base);
          if (!ok) setLocalCacheError(true);
        }
      },
      (err) => {
        console.warn('Firestore snapshot error (hors-ligne) :', err.code);
        if (data === null) setData(defaultAppData());
      }
    );

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      pendingVersion.current = 0;
    };
  }, [uid]);

  const update = useCallback((patch: Partial<AppData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (uid) {
        const ok = saveLocal(uid, next);
        if (!ok) setLocalCacheError(true);
      }
      if (docRef.current) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        const ref = docRef.current;
        pendingVersion.current++;
        saveTimer.current = setTimeout(() => {
          pendingVersion.current = Math.max(0, pendingVersion.current - 1);
          void setDoc(ref, next, { merge: true });
        }, SAVE_DEBOUNCE_MS);
      }
      return next;
    });
  }, [uid]);

  return { data, update, pendingWrites, archiveError, localCacheError };
}
