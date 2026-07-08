// the vault ... local-first persistence. localStorage holds containers (ciphertext only),
// receipts, and grants. no accounts, no cloud, no telemetry. what is stored here is exactly
// what an untrusted host would hold: sealed stones and public ledger rows.

import type { Grant, Receipt, SigilContainer } from './types';

const K_CONTAINERS = 'sigil.vault.containers';
const K_RECEIPTS = 'sigil.vault.receipts';
const K_GRANTS = 'sigil.vault.grants';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    console.error('[sigil] vault read degraded for ' + key + ' ... returning empty');
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── containers ──────────────────────────────────────────────────

export function loadContainers(): SigilContainer[] {
  return read<SigilContainer[]>(K_CONTAINERS, []);
}

export function saveContainer(container: SigilContainer): SigilContainer[] {
  const all = loadContainers();
  const idx = all.findIndex((c) => c.id === container.id);
  if (idx >= 0) all[idx] = container;
  else all.push(container);
  write(K_CONTAINERS, all);
  return all;
}

export function deleteContainer(id: string): SigilContainer[] {
  const all = loadContainers().filter((c) => c.id !== id);
  write(K_CONTAINERS, all);
  return all;
}

// ── receipts ────────────────────────────────────────────────────

export function loadReceipts(): Receipt[] {
  return read<Receipt[]>(K_RECEIPTS, []);
}

export function saveReceipt(receipt: Receipt): Receipt[] {
  const all = loadReceipts();
  all.unshift(receipt); // newest first
  write(K_RECEIPTS, all.slice(0, 400)); // the ledger stays bounded
  return all;
}

// ── grants ──────────────────────────────────────────────────────

export function loadGrants(): Grant[] {
  return read<Grant[]>(K_GRANTS, []);
}

export function saveGrants(grants: Grant[]): void {
  write(K_GRANTS, grants);
}
