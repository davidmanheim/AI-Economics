// Parameter presets (plan Section 3 defaults).
//
// NORMALIZED is the notes' normalization used everywhere by default. ILLUSTRATIVE
// uses round, real-ish units and MUST be badged "illustrative calibration --
// round numbers, not estimates" wherever it changes a displayed unit. Both use
// generic firm names only (Leader / Follower A / Follower B). No DOM imports.

import type { Firm, Params } from './types'

/** Normalized firms: Leader q=1.4, Follower A q=1.1, Follower B q=0.9. */
const NORMALIZED_FIRMS: Firm[] = [
  { name: 'Leader', q: 1.4, a: 1, b: 0 },
  { name: 'Follower A', q: 1.1, a: 1, b: 0 },
  { name: 'Follower B', q: 0.9, a: 1, b: 0 },
]

/**
 * Normalized preset (plan Section 3): c=1, K=100, N=300, thetaMax=10;
 * dynamics r=0.05, Lambda=0.5.
 */
export const NORMALIZED: Params = {
  c: 1,
  K: 100,
  N: 300,
  thetaMax: 10,
  firms: NORMALIZED_FIRMS.map((f) => ({ ...f })),
  dynamics: { r: 0.05, Lambda: 0.5 },
}

/**
 * Illustrative firms: same quality premiums (40% / 10% leads) but with a small
 * non-compute cost per output. Round numbers, not estimates.
 */
const ILLUSTRATIVE_FIRMS: Firm[] = [
  { name: 'Leader', q: 1.4, a: 1, b: 0.1 },
  { name: 'Follower A', q: 1.1, a: 1, b: 0.1 },
  { name: 'Follower B', q: 0.9, a: 1, b: 0.1 },
]

/**
 * Illustrative preset -- round, real-ish units, clearly NOT estimated:
 * cost ~ $0.30 per million tokens (c), capacity in GPU-years (K), a larger
 * purchaser mass, and willingness-to-pay in dollars-per-quality (thetaMax).
 * Cite nothing; this exists to show the mechanics in familiar-looking numbers.
 */
export const ILLUSTRATIVE: Params = {
  c: 0.3,
  K: 1000,
  N: 5000,
  thetaMax: 20,
  firms: ILLUSTRATIVE_FIRMS.map((f) => ({ ...f })),
  dynamics: { r: 0.08, Lambda: 0.4 },
}

/** Deep-clone a preset so callers can mutate freely. */
export function clonePreset(p: Params): Params {
  return {
    ...p,
    firms: p.firms.map((f) => ({ ...f })),
    dynamics: { ...p.dynamics },
  }
}
