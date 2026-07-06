const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Itérations PBKDF2, VERSIONNÉES.
 * - LEGACY (150k) : valeur historique. Les journaux créés avant l'ajout de
 *   `kdfIter` dans journalMeta ont été chiffrés avec — on DOIT continuer à
 *   dériver avec 150k pour eux, sinon la clé change et tout devient illisible.
 * - V2 (310k) : recommandation OWASP actuelle pour PBKDF2-SHA-256, appliquée
 *   aux nouveaux codes. Le coût n'est payé qu'au déverrouillage (~centaines
 *   de ms), pas à chaque chiffrement d'entrée.
 * Un code court reste brute-forçable côté Firestore : préférer une phrase.
 */
export const PBKDF2_ITER_LEGACY = 150_000;
export const PBKDF2_ITER_V2 = 310_000;
const VERIFIER_PLAIN = 'ma-discipline-journal-ok';

function saltFor(uid: string): ArrayBuffer {
  return enc.encode('mad-journal-v1::' + uid).buffer as ArrayBuffer;
}

export interface CipherPayload {
  iv: string;
  ct: string;
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

export async function deriveKey(
  pin: string,
  uid: string,
  iterations: number = PBKDF2_ITER_LEGACY
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin).buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltFor(uid),
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(key: CryptoKey, plain: string): Promise<CipherPayload> {
  const ivArray = crypto.getRandomValues(new Uint8Array(12));
  const ivBuffer = ivArray.buffer as ArrayBuffer;
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    enc.encode(plain).buffer as ArrayBuffer
  );
  return { iv: bufToB64(ivBuffer), ct: bufToB64(ct) };
}

export async function decryptText(key: CryptoKey, payload: CipherPayload): Promise<string> {
  const iv = b64ToBuf(payload.iv);
  const ct = b64ToBuf(payload.ct);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct
  );
  return dec.decode(plain);
}

export async function makeVerifier(key: CryptoKey): Promise<CipherPayload> {
  return encryptText(key, VERIFIER_PLAIN);
}

export async function checkVerifier(key: CryptoKey, verifier: CipherPayload): Promise<boolean> {
  try {
    const plain = await decryptText(key, verifier);
    return plain === VERIFIER_PLAIN;
  } catch {
    return false;
  }
}
