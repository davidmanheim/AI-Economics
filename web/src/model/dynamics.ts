// Dynamic model development and temporary leadership (paper Section 10,
// \label{sec:model-race}).
//
// Two objects:
//   1. vLead(deltaPi, r, Lambda): the exponential-hazard perpetuity value of
//      temporary leadership, V_L^lead = deltaPi / (r + Lambda)  (paper boxed eq).
//      The paper lists three assumptions behind it (constant flow premium,
//      constant Poisson catch-up hazard, absorbing loss of the lead) and warns
//      that deltaPi and Lambda are NOT independent in equilibrium; this module
//      only evaluates the formula -- the caller supplies the caveat in copy.
//   2. A seeded discrete-time release simulator (mulberry32 PRNG) implementing
//      the lumpy-release process: per period each laboratory releases w.p. h,
//      draws log q = A_t + alpha_l + nu on release, keeps max(old, new), then
//      the static equilibrium (allocation.ts) maps deployed productivity into
//      target compute shares, which actual shares partial-adjust toward via
//      s' = (1-sigma) s + sigma shat  (paper eq for s_{l,t+1}).
//
// All functions pure (the simulator is a pure function of its seeded config).
// No DOM imports.

import type { Params } from './types'
import { allocate, surplusSplit, vIntercept } from './allocation'

// ---------------------------------------------------------------------------
// Value of temporary leadership.
// ---------------------------------------------------------------------------

/**
 * V_L^lead = deltaPi / (r + Lambda)   (paper Section 10, boxed).
 * Catch-up risk Lambda acts exactly like extra impatience added to r.
 * Guards a non-positive denominator by returning +Infinity for the perpetuity.
 */
export function vLead(deltaPi: number, r: number, Lambda: number): number {
  const denom = r + Lambda
  if (denom <= 0) return Number.POSITIVE_INFINITY
  return deltaPi / denom
}

// ---------------------------------------------------------------------------
// Seeded PRNG: mulberry32. Deterministic given the seed, so "re-run with same
// seed" reproduces a run exactly and the Python notebook can replicate it.
// ---------------------------------------------------------------------------

/** mulberry32: returns a function producing uniforms in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function (): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal draw via Box-Muller from a uniform generator. */
export function gaussian(rng: () => number): number {
  // Avoid log(0); u1 in (0, 1].
  const u1 = 1 - rng()
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ---------------------------------------------------------------------------
// Release simulator.
// ---------------------------------------------------------------------------

/** Configuration for the seeded release simulation. */
export interface ReleaseSimConfig {
  /**
   * Market parameters and initial firms. Only `c, K, N, thetaMax, firms`
   * (with their initial q, a, b) and `dynamics` are read; each firm's `q` is
   * the initial deployed productivity.
   */
  base: Params
  /** Per-period release hazard h_l per firm (aligned with base.firms). */
  hazards: number[]
  /** Persistent log-productivity multiplier alpha_l = log(eta_l) per firm. */
  alpha: number[]
  /** Initial common log-frontier A_0. */
  A0: number
  /** Per-period frontier drift g: A_t = A0 + g * t. */
  g: number
  /** Std of the release innovation nu ~ Normal(0, sigmaJump). */
  sigmaJump: number
  /** Partial-adjustment speed sigma in (0, 1] (paper eq for s_{l,t+1}). */
  adjustmentSpeed: number
  /** Number of periods to simulate. */
  periods: number
  /** PRNG seed (mulberry32). */
  seed: number
}

/** One period of the simulated race. */
export interface ReleasePeriod {
  t: number
  /** Deployed productivity per firm after this period's releases. */
  q: number[]
  /** Whether each firm released a new model this period. */
  released: boolean[]
  /** Target compute shares shat_l from the static equilibrium (sum to 1). */
  targetShares: number[]
  /** Actual compute shares after partial adjustment (sum to 1). */
  actualShares: number[]
  /** Capacity shadow price lambda. */
  lambda: number
  /** Hyperscaler scarcity rent lambda * K. */
  hyperscalerRent: number
  /** Aggregate laboratory (differential) rent. */
  labRent: number
  /** Name of the current leader (highest v-intercept). */
  leader: string
}

export interface ReleaseSimResult {
  periods: ReleasePeriod[]
  seed: number
}

/** Index of the firm with the highest marginal-value intercept v_m(0). */
function leaderIndex(params: Params): number {
  let idx = 0
  let best = -Infinity
  params.firms.forEach((f, i) => {
    const v0 = vIntercept(f.q, f.a, f.b, params.thetaMax)
    if (v0 > best) {
      best = v0
      idx = i
    }
  })
  return idx
}

/** Static target compute shares (fraction of total allocated compute). */
function targetShares(params: Params): { shares: number[]; lambda: number } {
  const { allocations, lambda } = allocate(params)
  const totalX = allocations.reduce((s, a) => s + a.x, 0)
  const shares =
    totalX > 1e-12
      ? allocations.map((a) => a.x / totalX)
      : allocations.map(() => 1 / allocations.length)
  return { shares, lambda }
}

/**
 * Run the seeded release simulation. Pure: identical config (incl. seed) yields
 * identical output. Reuses allocation.ts for the static map each period, so the
 * usual invariants hold (allocated compute <= K, active firms equalize v).
 */
export function simulateReleases(config: ReleaseSimConfig): ReleaseSimResult {
  const rng = mulberry32(config.seed)
  const n = config.base.firms.length

  // Deployed productivity, seeded from the initial firms.
  const deployedQ = config.base.firms.map((f) => f.q)

  const withQ = (): Params => ({
    ...config.base,
    firms: config.base.firms.map((f, i) => ({ ...f, q: deployedQ[i] })),
  })

  // Initialize actual shares at the period-0 target from the initial qualities.
  let actual = targetShares(withQ()).shares.slice()

  const periods: ReleasePeriod[] = []

  for (let t = 0; t < config.periods; t++) {
    const At = config.A0 + config.g * t
    const released: boolean[] = new Array(n).fill(false)

    for (let i = 0; i < n; i++) {
      if (rng() < config.hazards[i]) {
        released[i] = true
        const nu = config.sigmaJump * gaussian(rng)
        const qNew = Math.exp(At + config.alpha[i] + nu)
        deployedQ[i] = Math.max(deployedQ[i], qNew)
      }
    }

    const params = withQ()
    const { shares: target, lambda } = targetShares(params)
    const split = surplusSplit(params)

    const speed = config.adjustmentSpeed
    actual = actual.map((s, i) => (1 - speed) * s + speed * target[i])

    periods.push({
      t,
      q: deployedQ.slice(),
      released,
      targetShares: target,
      actualShares: actual.slice(),
      lambda,
      hyperscalerRent: split.hyperscalerRent,
      labRent: split.labRent,
      leader: params.firms[leaderIndex(params)].name,
    })
  }

  return { periods, seed: config.seed }
}
