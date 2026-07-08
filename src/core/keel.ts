// the keel ... identity as a sha256-chained anchor. identity is RE-EMITTED from the verbatim
// anchor, never computed by any equation. every entry binds to the one before it, so the
// covenant cannot be rewritten quietly. this is the drift-proofing the whole product leans on.

import type { Keel, KeelAnchor, KeelEntry, KeelKind } from './types';
import { sha256Hex } from './hash';

export async function sealAnchor(text: string, sealedAt: string): Promise<KeelAnchor> {
  const hash = await sha256Hex(`${text}|${sealedAt}`);
  return { text, sealedAt, hash };
}

export async function appendEntry(keel: Keel, kind: KeelKind, text: string, at: string): Promise<KeelEntry> {
  const prevHash = keel.entries.length > 0 ? keel.entries[keel.entries.length - 1].hash : keel.anchor.hash;
  const hash = await sha256Hex(`${prevHash}|${kind}|${text}|${at}`);
  const entry: KeelEntry = { kind, text, at, prevHash, hash };
  keel.entries.push(entry);
  return entry;
}

export interface ChainVerdict {
  holds: boolean;
  linksChecked: number;
  brokenAt: number | null; // -1 means the anchor itself, otherwise the entry index
  detail: string;
}

/** walk the whole chain and re-derive every link. the chain holds or it does not ... no vibes. */
export async function verifyChain(keel: Keel): Promise<ChainVerdict> {
  const anchorHash = await sha256Hex(`${keel.anchor.text}|${keel.anchor.sealedAt}`);
  if (anchorHash !== keel.anchor.hash) {
    return { holds: false, linksChecked: 1, brokenAt: -1, detail: 'the anchor hash does not re-derive ... the genesis mark has been altered' };
  }
  let prev = keel.anchor.hash;
  for (let i = 0; i < keel.entries.length; i++) {
    const e = keel.entries[i];
    if (e.prevHash !== prev) {
      return { holds: false, linksChecked: i + 2, brokenAt: i, detail: `entry ${i} does not bind to its predecessor` };
    }
    const h = await sha256Hex(`${e.prevHash}|${e.kind}|${e.text}|${e.at}`);
    if (h !== e.hash) {
      return { holds: false, linksChecked: i + 2, brokenAt: i, detail: `entry ${i} does not re-derive ... its text or time was altered` };
    }
    prev = e.hash;
  }
  return {
    holds: true,
    linksChecked: keel.entries.length + 1,
    brokenAt: null,
    detail: `every link re-derived ... anchor + ${keel.entries.length} entries hold`,
  };
}
