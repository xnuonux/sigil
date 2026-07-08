// phase A ... the container + the serializer. a self serializes to canonical bytes and
// comes back losslessly, and the round trip leaves a receipt. rows, not vibes.

import type { SigilSelf } from './types';
import { SELF_FORMAT } from './types';
import { canonicalize } from './canonical';
import { sha256Hex } from './hash';

export function serializeSelf(self: SigilSelf): string {
  return canonicalize(self);
}

/** structural validation ... a deserialized self is checked, never trusted on shape alone. */
export function deserializeSelf(json: string): SigilSelf {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('[sigil] the payload is not json');
  }
  const s = raw as Partial<SigilSelf>;
  if (s.format !== SELF_FORMAT) throw new Error('[sigil] unknown self format: ' + String(s.format));
  if (typeof s.name !== 'string' || typeof s.keeper !== 'string') throw new Error('[sigil] the self is missing its name or keeper');
  if (!s.keel || typeof s.keel.anchor?.hash !== 'string' || !Array.isArray(s.keel.entries)) throw new Error('[sigil] the keel is malformed');
  if (!s.memory || !Array.isArray(s.memory.episodic) || !Array.isArray(s.memory.entity) || !Array.isArray(s.memory.prospective) || !Array.isArray(s.memory.perceptual) || !Array.isArray(s.memory.working)) {
    throw new Error('[sigil] the memory layers are malformed');
  }
  if (!Array.isArray(s.dispositions)) throw new Error('[sigil] the dispositions are malformed');
  if (!s.feltBaseline || typeof s.feltBaseline.valence !== 'number') throw new Error('[sigil] the felt baseline is malformed');
  if (!Array.isArray(s.provenance)) throw new Error('[sigil] the provenance is malformed');
  if (typeof s.version !== 'number') throw new Error('[sigil] the version is malformed');
  return s as SigilSelf;
}

export interface RoundTripResult {
  lossless: boolean;
  hashBefore: string;
  hashAfter: string;
  bytes: number;
}

/** serialize, deserialize, re-serialize, compare hashes. the round-trip receipt in one call. */
export async function roundTrip(self: SigilSelf): Promise<RoundTripResult> {
  const first = serializeSelf(self);
  const hashBefore = await sha256Hex(first);
  const back = deserializeSelf(first);
  const second = serializeSelf(back);
  const hashAfter = await sha256Hex(second);
  return { lossless: hashBefore === hashAfter, hashBefore, hashAfter, bytes: new TextEncoder().encode(first).length };
}

export async function selfContentHash(self: SigilSelf): Promise<string> {
  return sha256Hex(serializeSelf(self));
}
