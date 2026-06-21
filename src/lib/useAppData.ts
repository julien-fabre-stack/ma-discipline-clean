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
  /** Met à jour partiellement le document, avec écriture Firestore debouncée. */
  update: (patch: Partial<AppData>) => void;
  pendingWrites: boolean;
}

const SAVE_DEBOUNCE_MS = 400;

/**
 * Gère le cycle de vie complet du document `users/{uid}/app/data` :
 *  - abonnement temps réel (onSnapshot)
 *  - création du document s'il n'existe pas
 *  - migration des anciennes formes de données
 *  - archivage automatique des jours > 400 jours vers `users/{uid}/archive/{YYYY-MM}`
 *  - écritures groupées et différées (debounce) pour limiter les coûts Firestore
 *
 * Toute cette logique vivait dans le composant App de la v1 ; l'isoler ici rend
 * App.tsx lisible et cette mécanique testable séparément.
 */
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
    const today = dateKey();
    const ref = doc(db, 'users', uid, 'app', 'data');
    docRef.current = ref;

    const unsub = onSnapshot(ref, (snap) => {
      setPendingWrites(snap.metadata.hasPendingWrites);

      const base = snap.exists()
        ? migrateData({ ...defaultAppData(), ...(snap.data() as Partial<AppData>) })
        : migrateData({ ...defaultAppData() });

      // Première initialisation : crée le document.
      if (!snap.exists()) {
        void setDoc(ref, defaultAppData());
      }

      // Archivage des jours trop anciens.
      const { kept, removed, changed } = pruneOldDays(base.days, today);
      if (changed) {
        const next: AppData = { ...base, days: kept };
        setData(next);

        // Regroupe les jours retirés par mois et les archive.
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
      }
    });

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [uid]);

  const update = useCallback((patch: Partial<AppData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (docRef.current) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        const ref = docRef.current;
        saveTimer.current = setTimeout(() => {
          void setDoc(ref, next, { merge: true });
        }, SAVE_DEBOUNCE_MS);
      }
      return next;
    });
  }, []);

  return { data, update, pendingWrites };
}
