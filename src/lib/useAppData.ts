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

function saveLocal(uid: string, data: AppData) {
  try { localStorage.setItem(localKey(uid), JSON.stringify(data)); } catch {}
}

export function useAppData(uid: string | null): UseAppDataResult {
  const [data, setData] = useState<AppData | null>(null);
  const [pendingWrites, setPendingWrites] = useState(false);
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
          saveLocal(uid, next);

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
          saveLocal(uid, base);
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
      if (uid) saveLocal(uid, next);
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

  return { data, update, pendingWrites };
}
