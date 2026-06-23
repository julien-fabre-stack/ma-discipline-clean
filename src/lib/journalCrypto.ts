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
  const ivArray = crypto.getRandomValues(new Uint8Array(12));
  const ivBuffer = ivArray.buffer as ArrayBuffer;
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    enc.encode(plain)
  );
  return { iv: bufToB64(ivBuffer), ct: bufToB64(ct) };
}

export async function decryptText(key: CryptoKey, payload: CipherPayload): Promise<string> {
  const iv = b64ToBuf(payload.iv);
  const ct = b64ToBuf(payload.ct);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct.buffer as ArrayBuffer
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
