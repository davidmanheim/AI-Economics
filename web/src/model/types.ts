// Shared types for the model core.
//
// Every equation in the web companion lives exactly once, in `src/model/`.
// This file holds the canonical parameter object and the result records that
// the pure functions in the sibling modules return. No DOM imports anywhere.
//
// Paper reference: "The Future Economics of LLMs" (paper-draft-July-15.tex).

/** A single model/laboratory. `Q = a * q` is total standardized quality. */
export interface Firm {
  /** Display name. Generic only: 'Leader' | 'Follower A' | 'Follower B'. */
  name: string
  /** Quality-adjusted productivity per FLOP, q = Q/a. */
  q: number
  /** FLOPs per standardized output, a_m. */
  a: number
  /** Non-compute variable cost per standardized output, b_m. */
  b: number
}

/**
 * Canonical parameter object. Defaults are the notes' normalization
 * (see `presets.ts`, `NORMALIZED`).
 */
export interface Params {
  /** Physical operating cost per FLOP, c. */
  c: number
  /** Aggregate short-run capacity (FLOPs/period), K. */
  K: number
  /** Purchaser mass, N. */
  N: number
  /** Willingness-to-pay upper bound; theta ~ Uniform[0, thetaMax]. */
  thetaMax: number
  /** The active set of firms/models. */
  firms: Firm[]
  /** Dynamics parameters (Section 10, temporary leadership). */
  dynamics: DynamicsParams
}

/** Dynamics / temporary-leadership parameters (Section 10). */
export interface DynamicsParams {
  /** Discount rate r. */
  r: number
  /** Catch-up hazard Lambda (per period). */
  Lambda: number
}

/** Total standardized quality Q = a * q. */
export function totalQuality(firm: Firm): number {
  return firm.a * firm.q
}

// ---------------------------------------------------------------------------
// Demand result records (Section 4.1 / Appendix F, two-model system).
// ---------------------------------------------------------------------------

/** Segmentation cutoffs on the theta line. */
export interface Cutoffs {
  /** theta* = (P_L - P_F)/(Q_L - Q_F): follower vs. leader indifference. */
  thetaStar: number
  /** theta0 = P_F/Q_F: buy-nothing vs. follower indifference. */
  thetaZero: number
}

/** Two-model demand quantities. */
export interface DemandPair {
  DL: number
  DF: number
}

/** Two-model inverse-demand prices. */
export interface PricePair {
  PL: number
  PF: number
}

// ---------------------------------------------------------------------------
// Allocation result records (Sections 5-6, integrated benchmark).
// ---------------------------------------------------------------------------

/** Per-firm outcome of the water-filling allocation. */
export interface FirmAllocation {
  name: string
  /** Compute allocated, x_m (FLOPs). */
  x: number
  /** Output, y_m = x_m / a_m. */
  y: number
  /** Marginal net revenue per FLOP at the solution, v_m = c + lambda if active. */
  v: number
  /** True when x_m > 0. */
  active: boolean
}

/** Result of `allocate`. */
export interface AllocationResult {
  allocations: FirmAllocation[]
  /** Capacity shadow price lambda (>= 0). */
  lambda: number
  /** True when capacity binds (lambda > 0). */
  capacityBinds: boolean
}

/** Result of the winner-take-all test, v_L(K) >= max_{j != L} v_j(0). */
export interface WtaResult {
  isWTA: boolean
  /** Name of the leader (highest initial marginal value per FLOP). */
  leader: string
  /** v_L(K): leader's marginal value of the last funded FLOP. */
  vLeaderAtK: number
  /** max over followers of v_j(0). */
  bestFollowerV0: number
}

/** Division of producer surplus above physical cost. */
export interface SurplusSplit {
  /** Total surplus above physical cost, S = sum_m integral (v_m - c) dx. */
  totalSurplus: number
  /** Hyperscaler scarcity rent, lambda * K. */
  hyperscalerRent: number
  /** Aggregate laboratory rent, S - lambda*K. */
  labRent: number
  /** Per-firm laboratory rent, area_m - lambda*x_m (aligned with params.firms). */
  perFirmLabRent: number[]
  lambda: number
}

// ---------------------------------------------------------------------------
// Oligopoly / Cournot result records (Section 8, Appendix D).
// ---------------------------------------------------------------------------

/** Linear inverse demand P(Y) = A - B*Y. */
export interface LinearDemand {
  A: number
  B: number
}

/** Three-component price decomposition; the three parts sum to `total`. */
export interface PriceDecomposition {
  physicalCost: number
  scarcityRent: number
  markup: number
  total: number
}

/** Result of the symmetric Cournot closed forms (Appendix D). */
export interface CournotResult {
  /** Consumer price P*. */
  P: number
  /** Wholesale compute price r*. */
  r: number
  physicalCost: number
  scarcityRent: number
  markup: number
  /** Per-firm markup P* - kappa. */
  perFirmMarkup: number
  /** Aggregate laboratory operating profit. */
  labProfitAggregate: number
  /** True when capacity binds. */
  binding: boolean
}

// ---------------------------------------------------------------------------
// Bargaining result records (Appendix A).
// ---------------------------------------------------------------------------

export interface BargainingSplit {
  /** Negotiated wholesale price r = zeta*vBarH + (1-zeta)*vHat. */
  negotiatedPrice: number
  /** Match-specific surplus, vHat - vBarH. */
  matchSurplus: number
  /** Hyperscaler outside option, max(c, vHatF). */
  barVH: number
  /** Laboratory's retained rent, zeta*(vHat - vBarH). */
  labRent: number
  /** Hyperscaler incremental gain over outside option, (1-zeta)*(vHat - vBarH). */
  hyperscalerIncremental: number
  /** Hyperscaler total margin over physical cost. */
  hyperscalerMargin: number
}
