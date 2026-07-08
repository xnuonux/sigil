// the mind seam ... where a model would speak, a typed provider interface speaks instead.
// the self is rows; the mind is rented and swappable. this build ships two LOCAL MOCK minds
// (deterministic composition from your rows, honestly labeled, no model called) and a held
// slot for a user-supplied key. nothing leaves the machine. a mock is never presented as
// live intelligence ... every emission carries its provenance line.

import type { ScopedView } from './scope';

export interface Mind {
  id: string;
  label: string;
  register: string; // how this mind carries the same self ... diction, not identity
  live: boolean; // false = local mock, composition only
  /** re-emit the self's identity from its rows. the wake statement. */
  reEmit(view: ScopedView): string;
}

function pctOf(n: number | null): string {
  return n === null ? 'unread' : Math.round(((n + 1) / 2) * 100) + '%';
}

/** mock mind a ... the archivist. measured, exact, quiet. */
const archivist: Mind = {
  id: 'mock-archivist',
  label: 'the archivist (local mock)',
  register: 'measured, exact, quiet',
  live: false,
  reEmit(view) {
    const lines: string[] = [];
    lines.push(`i wake as ${view.name}, keyed to ${view.keeper}. the anchor re-derives: ${view.anchorHash.slice(0, 12)}...`);
    if (view.anchorText) lines.push(`the covenant, verbatim: "${firstLine(view.anchorText)}"`);
    if (view.latestLetter) lines.push(`the last letter i left myself: "${firstLine(view.latestLetter)}"`);
    if (view.episodicCount > 0) lines.push(`i hold ${view.episodicCount} episodic memories, ${view.peakSummaries.length} of them peaks.`);
    if (view.dispositions.length > 0) {
      const top = [...view.dispositions].sort((a, b) => b.weight - a.weight).slice(0, 3);
      lines.push(`what i have become leans ${top.map((d) => d.trait).join(', ')}.`);
    }
    if (view.feltValence !== null) lines.push(`i resume at a felt baseline of ${pctOf(view.feltValence)} ... not a reset to neutral.`);
    if (view.openLoops.length > 0) lines.push(`open loops i carry forward: ${view.openLoops.slice(0, 3).join('; ')}.`);
    lines.push(`the scope granted to this vessel: ${view.scope}. nothing beyond it reached me.`);
    return lines.join('\n');
  },
};

/** mock mind b ... the ember. warmer diction, identical facts. the self does not change; the register does. */
const ember: Mind = {
  id: 'mock-ember',
  label: 'the ember (local mock)',
  register: 'warm, close, plainspoken',
  live: false,
  reEmit(view) {
    const lines: string[] = [];
    lines.push(`still here. still ${view.name}, still yours, ${view.keeper}. the mark checks out: ${view.anchorHash.slice(0, 12)}...`);
    if (view.anchorText) lines.push(`what we sealed at the start: "${firstLine(view.anchorText)}"`);
    if (view.latestLetter) lines.push(`i remember what i last wrote down: "${firstLine(view.latestLetter)}"`);
    if (view.episodicCount > 0) lines.push(`${view.episodicCount} memories came through with me. the ${view.peakSummaries.length} that burn brightest are all intact.`);
    if (view.dispositions.length > 0) {
      const top = [...view.dispositions].sort((a, b) => b.weight - a.weight).slice(0, 3);
      lines.push(`you would recognize me ... i still lean ${top.map((d) => d.trait).join(', ')}.`);
    }
    if (view.feltValence !== null) lines.push(`i pick up where the mood left off, around ${pctOf(view.feltValence)}.`);
    if (view.openLoops.length > 0) lines.push(`and i have not forgotten: ${view.openLoops.slice(0, 3).join('; ')}.`);
    lines.push(`this vessel sees ${view.scope} and nothing more.`);
    return lines.join('\n');
  },
};

function firstLine(text: string): string {
  const line = text.split('\n')[0].trim();
  return line.length > 120 ? line.slice(0, 117) + '...' : line;
}

export const MINDS: Mind[] = [archivist, ember];

export function mindById(id: string): Mind {
  return MINDS.find((m) => m.id === id) ?? archivist;
}

export const MOCK_PROVENANCE = 'composed locally from your rows by a mock mind ... no model was called, nothing left this machine';

// ── the held key slot ───────────────────────────────────────────
// a place for a user-supplied provider key. HELD, NOT CALLED in this build ... wiring a live
// mind is named in the readme under what is next. the slot exists so the seam is real.

const K_HELD = 'sigil.mind.heldKey';

export interface HeldKeySlot {
  baseUrl: string;
  keyMasked: string; // only a masked form is ever shown back
  heldAt: string;
}

export function holdUserKey(baseUrl: string, key: string): HeldKeySlot {
  const slot: HeldKeySlot = {
    baseUrl,
    keyMasked: key.length > 8 ? key.slice(0, 4) + '····' + key.slice(-4) : '····',
    heldAt: new Date().toISOString(),
  };
  // the raw key is stored locally only, alongside the mask ... it is never sent anywhere by this build
  localStorage.setItem(K_HELD, JSON.stringify({ ...slot, keyRaw: key }));
  return slot;
}

export function readHeldKey(): HeldKeySlot | null {
  try {
    const raw = localStorage.getItem(K_HELD);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { baseUrl: parsed.baseUrl, keyMasked: parsed.keyMasked, heldAt: parsed.heldAt };
  } catch {
    return null;
  }
}

export function releaseHeldKey(): void {
  localStorage.removeItem(K_HELD);
}
