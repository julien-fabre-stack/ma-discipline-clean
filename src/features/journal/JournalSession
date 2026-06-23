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
  type CipherPayload,
} from '@/lib/journalCrypto';

interface JournalSessionValue {
  hasPin: boolean;
  unlocked: boolean;
  createPin: (pin: string, uid: string) => Promise<CipherPayload>;
  unlock: (pin: string, uid: string) => Promise<boolean>;
  lock: () => void;
  encrypt: (plain: string) => Promise<CipherPayload>;
  decrypt: (payload: CipherPayload) => Promise<string>;
}

const Ctx = createContext<JournalSessionValue | null>(null);

export function JournalSessionProvider({
  verifier,
  children,
}: {
  verifier: CipherPayload | null;
  children: ReactNode;
}) {
  const keyRef = useRef<CryptoKey | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const createPin = useCallback(async (pin: string, uid: string) => {
    const key = await deriveKey(pin, uid);
    keyRef.current = key;
    setUnlocked(true);
    return makeVerifier(key);
  }, []);

  const unlock = useCallback(
    async (pin: string, uid: string) => {
      if (!verifier) return false;
      const key = await deriveKey(pin, uid);
      const ok = await checkVerifier(key, verifier);
      if (ok) {
        keyRef.current = key;
        setUnlocked(true);
      }
      return ok;
    },
    [verifier]
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
