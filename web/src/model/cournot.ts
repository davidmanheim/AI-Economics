// Symmetric Cournot closed forms and the three-component price decomposition.
//
// Primary source: paper Appendix D, "A Symmetric Cournot Example"
// (\label{app:cournot}), and Section 7's boxed decomposition
//   P_l = (b + a c) + a (r - c) + mu   (physical cost / scarcity rent / markup).
// The binding-capacity neutrality result is stated as a formal Proposition in
// Section 8 (\label{prop:capacity-neutrality}); this module implements exactly
// its hypotheses (n symmetric labs, homogeneous good, linear inverse demand
// P(Y) = A - B*Y, each output needs a FLOPs).
//
// All functions pure. No DOM imports.

import type {
  CournotResult,
  LinearDemand,
  PriceDecomposition,
} from './types'

// ---------------------------------------------------------------------------
// Mapping the uniform-theta vertical demand to the linear inverse demand used
// by the Cournot example. For a single homogeneous model of total quality Q,
// the residual inverse demand of demand.ts is
//   P(y) = Q * thetaMax * (1 - y/N) = A - B*y,  A = Q*thetaMax, B = Q*thetaMax/N.
// With n symmetric firms selling that homogeneous good, Y = sum_l y_l and
// P = A - B*Y with the same (A, B). Units: A, B, P are per standardized output
// (so kappa = b + a*r is also per output); the plan's per-FLOP intercept
// "thetaMax * qbar" equals A/a here. Document the choice of Q by the caller.
// ---------------------------------------------------------------------------

/** Linear inverse demand {A, B} from a homogeneous good of total quality Q. */
export function linearDemandFromVertical(
  Q: number,
  N: number,
  thetaMax: number,
): LinearDemand {
  return { A: Q * thetaMax, B: (Q * thetaMax) / N }
}

/**
 * Aggregate Cournot output when compute is available at physical cost r = c:
 *   Y^Cournot(c) = n (A - b - a c) / (B (n+1)).   (paper app:cournot)
 */
export function cournotOutputAtCost(
  A: number,
  B: number,
  a: number,
  b: number,
  c: number,
  n: number,
): number {
  return (n * (A - b - a * c)) / (B * (n + 1))
}

/**
 * Capacity-binding threshold: capacity binds iff
 *   K < a n (A - b - a c) / (B (n+1)) = a * Y^Cournot(c).   (paper app:cournot)
 * Equivalently a * Y^Cournot(c) > K.
 */
export function bindingThreshold(
  A: number,
  B: number,
  a: number,
  b: number,
  c: number,
  n: number,
): number {
  return a * cournotOutputAtCost(A, B, a, b, c, n)
}

/**
 * General three-component decomposition of a purchaser-facing price
 * (paper Section 7, boxed):
 *   physicalCost = b + a c,
 *   scarcityRent = a (r - c),
 *   markup       = P - physicalCost - scarcityRent  (= mu = P - kappa).
 * The three parts sum to P by construction.
 */
export function decomposePrice(
  P: number,
  a: number,
  b: number,
  c: number,
  r: number,
): PriceDecomposition {
  const physicalCost = b + a * c
  const scarcityRent = a * (r - c)
  const markup = P - physicalCost - scarcityRent
  return { physicalCost, scarcityRent, markup, total: P }
}

/**
 * Symmetric Cournot equilibrium with a capacity constraint (paper app:cournot),
 * plus the price decomposition and the neutrality proposition made concrete.
 *
 * Binding case (K < bindingThreshold): all capacity is used, a*Y = K, and
 *   P*    = A - B K / a               (independent of n -- prop:capacity-neutrality)
 *   r*    = (A - b)/a - B(n+1)K/(a^2 n)   (rises with n)
 *   mu    = P* - kappa = B K / (a n)  (falls with n)
 *   Pi    = B K^2 / (a^2 n)           (aggregate lab operating profit)
 *
 * Slack case (K >= bindingThreshold): r* = c, ordinary Cournot,
 *   Y = Y^Cournot(c),  P = A - B Y,  mu = P - kappa,  Pi = n (P - kappa) y_l.
 */
export function cournotEquilibrium(
  A: number,
  B: number,
  a: number,
  b: number,
  c: number,
  n: number,
  K: number,
): CournotResult {
  const threshold = bindingThreshold(A, B, a, b, c, n)
  const binding = K < threshold - 1e-12

  let P: number
  let r: number
  let perFirmMarkup: number
  let labProfitAggregate: number

  if (binding) {
    P = A - (B * K) / a
    r = (A - b) / a - (B * (n + 1) * K) / (a * a * n)
    perFirmMarkup = (B * K) / (a * n)
    labProfitAggregate = (B * K * K) / (a * a * n)
  } else {
    r = c
    const kappa = b + a * c
    const yFirm = (A - kappa) / (B * (n + 1))
    const Y = n * yFirm
    P = A - B * Y
    perFirmMarkup = P - kappa
    labProfitAggregate = n * perFirmMarkup * yFirm
  }

  const { physicalCost, scarcityRent, markup } = decomposePrice(P, a, b, c, r)

  return {
    P,
    r,
    physicalCost,
    scarcityRent,
    markup,
    perFirmMarkup,
    labProfitAggregate,
    binding,
  }
}
