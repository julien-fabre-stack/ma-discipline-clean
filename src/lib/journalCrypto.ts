/**
 * Chiffrement du journal — Web Crypto natif (aucune dépendance).
 *
 * Principe :
 *  - Le PIN n'est JAMAIS stocké. Il sert uniquement à dériver une clé AES-GCM
 *    (via PBKDF2) en mémoire, le temps de la session.
 *  - Chaque entrée est chiffrée avec un IV aléatoire propre.
 *  - Firestore ne reçoit que { iv, ct } en base64 : du texte illisible.
 *
 * ⚠️ Sans le PIN, les entrées sont DÉFINITIVEMENT irrécupérables.
 *
 * Vérification du PIN :
 *  - À la création, on chiffre une phrase témoin fixe (VERIFIER_PLAIN) et on
 *    stocke le résultat dans Firestore (journalMeta.verifier).
 *  - À chaque déverrouillage, on tente de déchiffrer ce témoin : si ça réussit
 *    et qu'on retrouve la phrase, le PIN est bon.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const PBKDF2_ITERATIONS = 150_000;
const VERIFIER_PLAIN = 'ma-discipline-journal-ok';

function saltFor(uid: string): Uint8Array {
  return enc.encode('mad-journal-v1::' + uid);
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

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function deriveKey(pin: string, uid: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltFor(uid),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(key: CryptoKey, plain: string): Promise<CipherPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return { iv: bufToB64(iv.buffer), ct: bufToB64(ct) };
}

export async function decryptText(key: CryptoKey, payload: CipherPayload): Promise<string> {
  const iv = b64ToBuf(payload.iv);
  const ct = b64ToBuf(payload.ct);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
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
