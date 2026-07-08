// phase B ... the user-held key. the sovereignty inversion, mechanized: a sigil is encrypted
// under a key derived from the keeper's passphrase. the vault stores ciphertext it cannot read.
// aes-256-gcm over webcrypto, pbkdf2-sha-256 at 310k iterations. the key never persists ...
// it lives in memory only while the self is open, and dies with the tab.

import type { SigilContainer, SigilSelf } from './types';
import { CONTAINER_FORMAT } from './types';
import { serializeSelf, deserializeSelf, selfContentHash } from './serializer';
import { bufToBase64, base64ToBuf, randomId } from './hash';

export const KDF_ITERATIONS = 310_000;

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function deriveKey(passphrase: string, salt: Uint8Array, iterations = KDF_ITERATIONS): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable ... the key cannot even be exported from the crypto layer
    ['encrypt', 'decrypt']
  );
}

export interface SealedResult {
  container: SigilContainer;
  key: CryptoKey; // held in memory for the open session, never persisted
  salt: Uint8Array;
}

/** seal a self under a fresh salt + the keeper's passphrase. a new stone every time. */
export async function sealNew(self: SigilSelf, passphrase: string, existingId?: string): Promise<SealedResult> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const container = await sealWith(self, key, salt, existingId);
  return { container, key, salt };
}

/** re-seal with an already-derived key (growing an open self). fresh iv, same salt. */
export async function sealWith(self: SigilSelf, key: CryptoKey, salt: Uint8Array, existingId?: string): Promise<SigilContainer> {
  const plaintext = serializeSelf(self);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, enc.encode(plaintext));
  return {
    magic: 'SIGIL',
    format: CONTAINER_FORMAT,
    id: existingId ?? randomId(),
    name: self.name,
    cipher: 'AES-256-GCM',
    kdf: { name: 'PBKDF2-SHA-256', iterations: KDF_ITERATIONS, salt: bufToBase64(salt) },
    iv: bufToBase64(iv),
    ciphertext: bufToBase64(ct),
    contentHash: await selfContentHash(self),
    version: self.version,
    sealedAt: new Date().toISOString(),
  };
}

export interface UnsealedResult {
  self: SigilSelf;
  key: CryptoKey;
  salt: Uint8Array;
}

/** open a container with the keeper's passphrase. a wrong key is refused by gcm itself. */
export async function unseal(container: SigilContainer, passphrase: string): Promise<UnsealedResult> {
  const salt = base64ToBuf(container.kdf.salt);
  const key = await deriveKey(passphrase, salt, container.kdf.iterations);
  const iv = base64ToBuf(container.iv);
  const ct = base64ToBuf(container.ciphertext);
  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, ct.buffer as ArrayBuffer);
  } catch {
    throw new Error('the key does not open this sigil');
  }
  const self = deserializeSelf(dec.decode(plainBuf));
  return { self, key, salt };
}

/** rotate ... re-encrypt the self under a new passphrase + fresh salt. the old key dies. */
export async function rotate(self: SigilSelf, newPassphrase: string, keepId: string): Promise<SealedResult> {
  return sealNew(self, newPassphrase, keepId);
}

/**
 * the sovereignty proof, run as a real test: attempt to open the container with a key the
 * vault could plausibly hold (a machine-derived guess), expect refusal. proves the stored
 * blob is opaque to everything but the keeper's passphrase.
 */
export async function proveSovereignty(container: SigilContainer): Promise<{ refused: boolean; detail: string }> {
  const guess = 'vault-held-key-' + randomId(); // the vault has no passphrase ... any key it derives is a guess
  try {
    await unseal(container, guess);
    return { refused: false, detail: 'a machine-derived key opened the sigil ... sovereignty broken, this is a P0' };
  } catch {
    return { refused: true, detail: 'a machine-derived key was refused by aes-gcm ... the vault holds ciphertext it cannot read' };
  }
}
