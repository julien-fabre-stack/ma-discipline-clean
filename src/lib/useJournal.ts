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
  saveEntry: (date: string, payload: { title?: CipherPayload; body: CipherPayload }) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
}

export function useJournal(uid: string | null): UseJournalResult {
  const [entries, setEntries] = useState<Record<string, JournalDoc>>({});
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    uidRef.current = uid;
    if (!uid || !db) {
      setEntries({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const col = collection(db, 'users', uid, 'journal');
    const unsub = onSnapshot(col, (snap) => {
      const next: Record<string, JournalDoc> = {};
      snap.forEach((d) => {
        next[d.id] = d.data() as JournalDoc;
      });
      setEntries(next);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const saveEntry = useCallback<UseJournalResult['saveEntry']>(async (date, payload) => {
    const u = uidRef.current;
    if (!u || !db) return;
    const ref = doc(db, 'users', u, 'journal', date);
    const now = Date.now();
    const existing = entries[date];
    const docData: JournalDoc = {
      date,
      body: payload.body,
      ...(payload.title ? { title: payload.title } : {}),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await setDoc(ref, docData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const deleteEntry = useCallback<UseJournalResult['deleteEntry']>(async (date) => {
    const u = uidRef.current;
    if (!u || !db) return;
    await deleteDoc(doc(db, 'users', u, 'journal', date));
  }, []);

  return { entries, loading, saveEntry, deleteEntry };
}
