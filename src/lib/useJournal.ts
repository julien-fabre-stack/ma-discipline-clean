import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CipherPayload } from './journalCrypto';

export interface JournalDoc {
  date: string;
  title?: CipherPayload;
  body: CipherPayload;
  createdAt: number;
  updatedAt: number;
}

export interface UseJournalResult {
  entries: Record<string, JournalDoc>;
  loading: boolean;
  /**
   * Code d'erreur Firestore (écoute OU écriture), null tant que tout va bien.
   * AVANT : l'écouteur onSnapshot n'avait pas de callback d'erreur → en cas
   * de refus de permission, `loading` restait true pour toujours (onglet figé
   * sur « Chargement… » sans aucune explication) ; et les échecs d'écriture
   * étaient d'éventuelles rejections non gérées, invisibles.
   */
  error: string | null;
  saveEntry: (date: string, payload: { title?: CipherPayload; body: CipherPayload }) => void;
  deleteEntry: (date: string) => void;
}

export function useJournal(uid: string | null): UseJournalResult {
  const [entries, setEntries] = useState<Record<string, JournalDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);
  // Miroir synchrone de `entries` : la source de vérité pour createdAt.
  // AVANT : saveEntry lisait `entries` via la closure du render — si le
  // premier snapshot n'était pas encore arrivé (ou juste après un save
  // précédent), l'entrée existante était invisible et createdAt était
  // réinitialisé à `now`, écrasant la date de création d'origine.
  const entriesRef = useRef<Record<string, JournalDoc>>({});

  useEffect(() => {
    uidRef.current = uid;
    if (!uid || !db) {
      setEntries({});
      entriesRef.current = {};
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const col = collection(db, 'users', uid, 'journal');
    const unsub = onSnapshot(
      col,
      (snap) => {
        const next: Record<string, JournalDoc> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as JournalDoc;
        });
        entriesRef.current = next;
        setEntries(next);
        setLoading(false);
      },
      (err) => {
        console.warn('Journal snapshot error :', err.code, err);
        setError(err.code ?? 'unknown');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  /**
   * NON BLOQUANT — correctif du « spinner infini hors-ligne ».
   * `setDoc` ne résout qu'à l'accusé de réception SERVEUR : en mode avion,
   * `await setDoc(...)` ne résolvait jamais → le bouton « Enregistrer »
   * restait bloqué sur « … » pour toujours, alors que l'écriture était déjà
   * durable dans le cache IndexedDB (persistentLocalCache) et repartirait
   * seule au retour du réseau. On écrit donc en fire-and-forget : l'entrée
   * apparaît immédiatement (mise à jour optimiste + snapshot local), et une
   * vraie erreur (invalid-argument, permission-denied…) est rendue visible
   * via `error` au lieu d'être avalée.
   */
  const saveEntry = useCallback<UseJournalResult['saveEntry']>((date, payload) => {
    const u = uidRef.current;
    if (!u || !db) return;
    const ref = doc(db, 'users', u, 'journal', date);
    const now = Date.now();
    const existing = entriesRef.current[date];
    const docData: JournalDoc = {
      date,
      body: payload.body,
      ...(payload.title ? { title: payload.title } : {}),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    // Mise à jour optimiste synchrone : deux saves rapprochés lisent chacun
    // le bon createdAt, et la liste reflète l'entrée sans attendre le snapshot.
    entriesRef.current = { ...entriesRef.current, [date]: docData };
    setEntries(entriesRef.current);
    setDoc(ref, docData)
      .then(() => setError(null))
      .catch((e: { code?: string }) => {
        console.warn('Journal setDoc échoué :', e);
        setError(e?.code ?? 'unknown');
      });
  }, []);

  const deleteEntry = useCallback<UseJournalResult['deleteEntry']>((date) => {
    const u = uidRef.current;
    if (!u || !db) return;
    const next = { ...entriesRef.current };
    delete next[date];
    entriesRef.current = next;
    setEntries(next);
    deleteDoc(doc(db, 'users', u, 'journal', date))
      .then(() => setError(null))
      .catch((e: { code?: string }) => {
        console.warn('Journal deleteDoc échoué :', e);
        setError(e?.code ?? 'unknown');
      });
  }, []);

  return { entries, loading, error, saveEntry, deleteEntry };
}
