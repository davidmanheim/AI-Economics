// Uniform-theta vertical-differentiation demand.
//
// Primary source: paper Section 4.1 ("Demand and revenue from purchaser
// heterogeneity", \label{subsec:two-model-demand}) and Appendix F
// (\label{app:two-model}). Purchaser utility is theta*Q_m - P_m with
// theta ~ Uniform[0, thetaMax] over a purchaser mass N.
//
// Two layers live here:
//   1. The exact TWO-MODEL demand system (leader L, follower F) with
//      three-tier segmentation -- the rigorous system from the paper.
//   2. The SINGLE-MODEL residual demand used for the dominance-case price
//      and (in allocation.ts) the water-filling marginal-value schedules.
//
// All functions pure. No DOM imports.

import type { Cutoffs, DemandPair, PricePair } from './types'

// ---------------------------------------------------------------------------
// The uniform willingness-to-pay distribution F = U[0, thetaMax].
// ---------------------------------------------------------------------------

/** F(z) = z / thetaMax, clamped to [0, 1]. */
export function cdf(z: number, thetaMax: number): number {
  return Math.min(1, Math.max(0, z / thetaMax))
}

/** F^{-1}(u) = u * thetaMax, for u in [0, 1]. */
export function invCdf(u: number, thetaMax: number): number {
  return u * thetaMax
}

// ---------------------------------------------------------------------------
// Two-model demand system (paper eqs. in subsec:two-model-demand).
// Arguments are TOTAL qualities Q_L = a_L q_L, Q_F = a_F q_F, with Q_L > Q_F.
// ---------------------------------------------------------------------------

/**
 * Segmentation cutoffs:
 *   theta* = (P_L - P_F)/(Q_L - Q_F),  theta0 = P_F/Q_F.
 * Three tiers are non-empty when theta0 < theta* < thetaMax.
 */
export function segmentationCutoffs(
  PL: number,
  PF: number,
  QL: number,
  QF: number,
): Cutoffs {
  return {
    thetaStar: (PL - PF) / (QL - QF),
    thetaZero: PF / QF,
  }
}

/**
 * Demand system:
 *   D_L = N[1 - (P_L - P_F)/((Q_L - Q_F) thetaMax)]
 *   D_F = N[(P_L - P_F)/((Q_L - Q_F) thetaMax) - P_F/(Q_F thetaMax)]
 */
export function demandTwoModel(
  PL: number,
  PF: number,
  QL: number,
  QF: number,
  N: number,
  thetaMax: number,
): DemandPair {
  const share = (PL - PF) / ((QL - QF) * thetaMax)
  return {
    DL: N * (1 - share),
    DF: N * (share - PF / (QF * thetaMax)),
  }
}

/**
 * Inverse demands (invert the system above, using y_m = D_m):
 *   P_L = thetaMax [Q_L - (Q_L y_L + Q_F y_F)/N]
 *   P_F = thetaMax Q_F [1 - (y_L + y_F)/N]
 */
export function inverseDemandTwoModel(
  yL: number,
  yF: number,
  QL: number,
  QF: number,
  N: number,
  thetaMax: number,
): PricePair {
  return {
    PL: thetaMax * (QL - (QL * yL + QF * yF) / N),
    PF: thetaMax * QF * (1 - (yL + yF) / N),
  }
}

/**
 * Downstream revenue R(y;Q) = P_L y_L + P_F y_F, the quadratic form
 *   R = thetaMax(Q_L y_L + Q_F y_F)
 *       - (thetaMax/N)(Q_L y_L^2 + 2 Q_F y_L y_F + Q_F y_F^2).
 */
export function revenueTwoModel(
  yL: number,
  yF: number,
  QL: number,
  QF: number,
  N: number,
  thetaMax: number,
): number {
  return (
    thetaMax * (QL * yL + QF * yF) -
    (thetaMax / N) * (QL * yL * yL + 2 * QF * yL * yF + QF * yF * yF)
  )
}

/** Marginal revenues of the two-model system (paper app:two-model). */
export function marginalRevenueTwoModel(
  yL: number,
  yF: number,
  QL: number,
  QF: number,
  N: number,
  thetaMax: number,
): { MRL: number; MRF: number } {
  return {
    MRL: thetaMax * QL - (2 * thetaMax) / N * (QL * yL + QF * yF),
    MRF: thetaMax * QF * (1 - (2 * (yL + yF)) / N),
  }
}

// ---------------------------------------------------------------------------
// Single-model residual demand (paper subsec "Purchaser-facing price under
// complete dominance": D_L(P) = N[1 - F(P/Q)]).
//
// Used for the dominance price and, in allocation.ts, for the separable
// per-model marginal-value schedules of the integrated benchmark. Treating
// each model's demand as a residual against the full purchaser distribution
// is the separable reduced form the paper invokes for its concentration
// result (v_l = G_l', G' > 0, G'' < 0). It drops cross-model substitution;
// the two-model system above keeps it. Both share the same utility and F.
// ---------------------------------------------------------------------------

/** Single-model inverse demand P(y) = Q thetaMax (1 - y/N). */
export function inverseDemandSingle(
  y: number,
  Q: number,
  N: number,
  thetaMax: number,
): number {
  return Q * thetaMax * (1 - y / N)
}

/** Single-model marginal revenue MR(y) = Q thetaMax (1 - 2y/N). */
export function marginalRevenueSingle(
  y: number,
  Q: number,
  N: number,
  thetaMax: number,
): number {
  return Q * thetaMax * (1 - (2 * y) / N)
}

/** Single-model demand D(P) = N[1 - F(P/Q)] = N(1 - P/(Q thetaMax)). */
export function demandSingle(
  P: number,
  Q: number,
  N: number,
  thetaMax: number,
): number {
  return N * (1 - cdf(P / Q, thetaMax))
}

/**
 * Purchaser-facing price under complete dominance (paper eq. for P_L^*):
 *   P_L^* = Q_L F^{-1}(1 - K/(a_L N)) = Q_L thetaMax (1 - K/(a_L N)).
 * Requires K/a_L <= N (otherwise demand exceeds mass; caller ensures scarcity).
 */
export function dominancePrice(
  Q: number,
  a: number,
  K: number,
  N: number,
  thetaMax: number,
): number {
  return Q * invCdf(1 - K / (a * N), thetaMax)
}

/** Normalized dominance price per FLOP: p_L^* = q_L thetaMax (1 - K/(a_L N)). */
export function dominancePriceNormalized(
  q: number,
  a: number,
  K: number,
  N: number,
  thetaMax: number,
): number {
  return q * invCdf(1 - K / (a * N), thetaMax)
}

// ---------------------------------------------------------------------------
// Bertrand equilibrium of the uncovered vertical-differentiation duopoly.
// (Paper Appendix F, "Bertrand equilibrium and comparative statics".)
// Used by regimes.ts to trace the leader markup mu_L as qualities evolve.
// ---------------------------------------------------------------------------

export interface BertrandResult {
  PL: number
  PF: number
  /** Leader Lerner markup mu_L = P_L - kappa_L. */
  muL: number
}

/**
 * Iterated best-response solver for general compute-inclusive marginal costs
 * kappa_L, kappa_F. Best responses (paper FOCs, theta cancels except via PL):
 *   P_L = (dQ*thetaMax + P_F + kappa_L)/2
 *   P_F = (P_L/dQ + kappa_F*inv) / (2*inv),  inv = 1/dQ + 1/Q_F.
 */
export function bertrandDuopoly(
  QL: number,
  QF: number,
  kappaL: number,
  kappaF: number,
  thetaMax: number,
  iters = 400,
): BertrandResult {
  const dQ = Math.max(QL - QF, 1e-9)
  const inv = 1 / dQ + 1 / QF
  let PL = kappaL + 0.5 * dQ * thetaMax
  let PF = kappaF + 0.1
  for (let i = 0; i < iters; i++) {
    const PLnew = 0.5 * (dQ * thetaMax + PF + kappaL)
    const PFnew = (PLnew / dQ + kappaF * inv) / (2 * inv)
    if (Math.abs(PLnew - PL) < 1e-12 && Math.abs(PFnew - PF) < 1e-12) {
      PL = PLnew
      PF = PFnew
      break
    }
    PL = PLnew
    PF = PFnew
  }
  return { PL, PF, muL: Math.max(PL - kappaL, 0) }
}

/**
 * Exact zero-cost, N = thetaMax = 1 closed form (paper Appendix F):
 *   P_L = 2 Q_L (Q_L - Q_F)/(4 Q_L - Q_F),
 *   P_F =   Q_F (Q_L - Q_F)/(4 Q_L - Q_F).
 * Serves as the exact oracle for `bertrandDuopoly` with kappa = 0.
 */
export function bertrandDuopolyClosedForm(QL: number, QF: number): PricePair {
  const dQ = QL - QF
  const denom = 4 * QL - QF
  return {
    PL: (2 * QL * dQ) / denom,
    PF: (QF * dQ) / denom,
  }
}
