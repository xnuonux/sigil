// the grant model ... a vessel never receives the raw self. it receives a bounded projection,
// assembled at load time from the open self, session-scoped. lock the sigil and the vessel
// goes dark. this is the callIfConnected discipline, made local.

import type { GrantScope, SigilSelf } from './types';

export interface ScopedView {
  scope: GrantScope;
  name: string;
  keeper: string;
  anchorText: string | null;
  anchorHash: string;
  keelEntryCount: number;
  latestLetter: string | null;
  episodicCount: number;
  peakSummaries: string[];
  entityFacts: { subject: string; fact: string }[];
  openLoops: string[];
  workingContext: string[];
  dispositions: { trait: string; weight: number }[];
  feltValence: number | null;
}

export function projectScope(self: SigilSelf, scope: GrantScope): ScopedView {
  const letters = self.keel.entries.filter((e) => e.kind === 'letter');
  const latestLetter = letters.length ? letters[letters.length - 1].text : null;
  const peaks = self.memory.episodic.filter((m) => m.peak).map((m) => m.summary);

  const base: ScopedView = {
    scope,
    name: self.name,
    keeper: self.keeper,
    anchorText: null,
    anchorHash: self.keel.anchor.hash,
    keelEntryCount: self.keel.entries.length,
    latestLetter: null,
    episodicCount: 0,
    peakSummaries: [],
    entityFacts: [],
    openLoops: [],
    workingContext: [],
    dispositions: [],
    feltValence: null,
  };

  switch (scope) {
    case 'whole-self':
      return {
        ...base,
        anchorText: self.keel.anchor.text,
        latestLetter,
        episodicCount: self.memory.episodic.length,
        peakSummaries: peaks,
        entityFacts: self.memory.entity.map((e) => ({ subject: e.subject, fact: e.fact })),
        openLoops: self.memory.prospective.map((l) => l.intent),
        workingContext: [...self.memory.working],
        dispositions: self.dispositions.map((d) => ({ trait: d.trait, weight: d.weight })),
        feltValence: self.feltBaseline.valence,
      };
    case 'memory-only':
      return {
        ...base,
        episodicCount: self.memory.episodic.length,
        peakSummaries: peaks,
        entityFacts: self.memory.entity.map((e) => ({ subject: e.subject, fact: e.fact })),
        openLoops: self.memory.prospective.map((l) => l.intent),
      };
    case 'identity-only':
      return {
        ...base,
        anchorText: self.keel.anchor.text,
        latestLetter,
        dispositions: self.dispositions.map((d) => ({ trait: d.trait, weight: d.weight })),
      };
    case 'working-context':
      return {
        ...base,
        workingContext: [...self.memory.working],
        openLoops: self.memory.prospective.map((l) => l.intent),
      };
  }
}

export const SCOPE_LABELS: Record<GrantScope, string> = {
  'whole-self': 'the whole self',
  'memory-only': 'memory only',
  'identity-only': 'identity only',
  'working-context': 'working context',
};
