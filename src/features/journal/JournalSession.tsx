import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  checkVerifier,
  decryptText,
  deriveKey,
  encryptText,
  makeVerifier,
  PBKDF2_ITER_LEGACY,
  PBKDF2_ITER_V2,
  type CipherPayload,
} from '@/lib/journalCrypto';
import type { JournalMeta } from '@/types';

interface JournalSessionValue {
  hasPin: boolean;
  unlocked: boolean;
  /** Crée le code : retourne le verifier ET les itérations KDF à persister. */
  createPin: (pin: string, uid: string) => Promise<{ verifier: CipherPayload; kdfIter: number }>;
  unlock: (pin: string, uid: string) => Promise<boolean>;
  lock: () => void;
  encrypt: (plain: string) => Promise<CipherPayload>;
  decrypt: (payload: CipherPayload) => Promise<string>;
}

const Ctx = createContext<JournalSessionValue | null>(null);

export function JournalSessionProvider({
  meta,
  children,
}: {
  meta: JournalMeta | null;
  children: ReactNode;
}) {
  const keyRef = useRef<CryptoKey | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const verifier = meta?.verifier ?? null;
  // Journaux historiques : kdfIter absent → dérivation LEGACY (150k),
  // indispensable pour continuer à déchiffrer l'existant.
  const kdfIter = meta?.kdfIter ?? PBKDF2_ITER_LEGACY;

  const createPin = useCallback(async (pin: string, uid: string) => {
    const key = await deriveKey(pin, uid, PBKDF2_ITER_V2);
    keyRef.current = key;
    setUnlocked(true);
    const v = await makeVerifier(key);
    return { verifier: v, kdfIter: PBKDF2_ITER_V2 };
  }, []);

  const unlock = useCallback(
    async (pin: string, uid: string) => {
      if (!verifier) return false;
      const key = await deriveKey(pin, uid, kdfIter);
      const ok = await checkVerifier(key, verifier);
      if (ok) {
        keyRef.current = key;
        setUnlocked(true);
      }
      return ok;
    },
    [verifier, kdfIter]
  );

  const lock = useCallback(() => {
    keyRef.current = null;
    setUnlocked(false);
  }, []);

  const encrypt = useCallback(async (plain: string) => {
    if (!keyRef.current) throw new Error('Journal verrouillé');
    return encryptText(keyRef.current, plain);
  }, []);

  const decrypt = useCallback(async (payload: CipherPayload) => {
    if (!keyRef.current) throw new Error('Journal verrouillé');
    return decryptText(keyRef.current, payload);
  }, []);

  const value = useMemo<JournalSessionValue>(
    () => ({
      hasPin: verifier != null,
      unlocked,
      createPin,
      unlock,
      lock,
      encrypt,
      decrypt,
    }),
    [verifier, unlocked, createPin, unlock, lock, encrypt, decrypt]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useJournalSession(): JournalSessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useJournalSession hors JournalSessionProvider');
  return v;
}
