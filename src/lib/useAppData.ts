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
              void setDoc(doc(db!, 'users', uid, 'archive', m), obj, { merge: true }).catch((e) =>
                console.warn('Archivage', m, e)
              );
            });
          }

          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
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
        saveTimer.current = setTimeout(() => {
          void setDoc(ref, next, { merge: true });
        }, SAVE_DEBOUNCE_MS);
      }
      return next;
    });
  }, [uid]);

  return { data, update, pendingWrites };
}
