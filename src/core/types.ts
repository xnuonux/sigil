// sigil core types ... the self as rows, the container as an owned envelope.
// the self is TINY (rows). the mind is BIG and swappable and never in here.

export const SELF_FORMAT = 'sigil-self/v1' as const;
export const CONTAINER_FORMAT = 'sigil-container/v1' as const;

// ── the keel (identity) ─────────────────────────────────────────

/** the genesis mark. verbatim text, sealed once, hashed. identity is re-emitted from this, never computed. */
export interface KeelAnchor {
  text: string;
  sealedAt: string; // iso
  hash: string; // sha256 hex of `${text}|${sealedAt}`
}

export type KeelKind = 'letter' | 'decision' | 'scar' | 'landmine';

/** one chained entry. each link binds to the previous by hash ... the chain cannot be rewritten quietly. */
export interface KeelEntry {
  kind: KeelKind;
  text: string;
  at: string; // iso
  prevHash: string; // hash of the previous entry, or the anchor hash for the first
  hash: string; // sha256 hex of `${prevHash}|${kind}|${text}|${at}`
}

export interface Keel {
  anchor: KeelAnchor;
  entries: KeelEntry[];
}

// ── the memory layers ───────────────────────────────────────────

export interface EpisodicMemory {
  summary: string;
  at: string;
  salience: number; // 0..1 ... the texture. high salience is a peak
  valence: number; // -1..1 ... how it felt
  peak: boolean;
}

export interface EntityFact {
  subject: string;
  fact: string;
  confidence: number; // 0..1
  keeperConfirmed: boolean;
}

export interface OpenLoop {
  intent: string;
  openedAt: string;
  dueAt: string | null;
  charge: number; // 0..1 ... urgency, rises toward due
}

export interface Percept {
  observed: string;
  at: string;
}

export interface MemoryLayers {
  episodic: EpisodicMemory[];
  entity: EntityFact[];
  prospective: OpenLoop[];
  perceptual: Percept[];
  working: string[]; // the current context slots
}

// ── dispositions + felt baseline ────────────────────────────────

/** who the self has become. grown, not configured. */
export interface Disposition {
  trait: string;
  weight: number; // 0..1
  grownFrom: string; // the provenance of the leaning
}

export interface FeltBaseline {
  valence: number; // -1..1
  chemistry: { dopamine: number; cortisol: number; adrenaline: number; oxytocin: number }; // 0..1 each
  virtues: { courage: number; honesty: number; temperance: number; justice: number }; // 0..1 each
}

// ── provenance ──────────────────────────────────────────────────

export interface ProvenanceEntry {
  version: number;
  at: string;
  event: string; // forged | sealed | grown | rotated | loaded | swapped ...
  contentHash: string; // sha256 of the canonical self at that moment
}

// ── the self ────────────────────────────────────────────────────

export interface SigilSelf {
  format: typeof SELF_FORMAT;
  name: string; // the self's name
  keeper: string; // the human it is keyed to
  bornAt: string;
  version: number;
  keel: Keel;
  memory: MemoryLayers;
  dispositions: Disposition[];
  feltBaseline: FeltBaseline;
  provenance: ProvenanceEntry[];
}

// ── the container (the owned envelope) ──────────────────────────

/** what leaves the machine as a file and what the vault stores. ciphertext only ... nobody without the key reads it. */
export interface SigilContainer {
  magic: 'SIGIL';
  format: typeof CONTAINER_FORMAT;
  id: string;
  name: string; // the self's name, in the clear ... a label on a sealed stone
  cipher: 'AES-256-GCM';
  kdf: { name: 'PBKDF2-SHA-256'; iterations: number; salt: string /* base64 */ };
  iv: string; // base64
  ciphertext: string; // base64 of AES-GCM(canonical json of the self)
  contentHash: string; // sha256 of the plaintext canonical self ... a fingerprint, reveals nothing
  version: number;
  sealedAt: string;
}

// ── receipts (rows, not vibes) ──────────────────────────────────

export type ReceiptKind =
  | 'round-trip'
  | 'sovereignty'
  | 'chain-verify'
  | 'seal'
  | 'unlock'
  | 'export'
  | 'import'
  | 'rotate'
  | 'grant'
  | 'revoke'
  | 'swap';

export interface Receipt {
  id: string;
  kind: ReceiptKind;
  at: string;
  containerId: string | null;
  selfName: string;
  verdict: 'green' | 'red';
  detail: string;
  rows: Record<string, string>; // the actual numbers ... hashes, counts, params
}

// ── grants (the portability runtime) ────────────────────────────

export type GrantScope = 'whole-self' | 'memory-only' | 'identity-only' | 'working-context';

export interface Grant {
  id: string;
  containerId: string;
  vessel: string; // lunari | vesta | pantheon | foreign
  scope: GrantScope;
  mindId: string;
  grantedAt: string;
  revoked: boolean;
}
