// Technological regimes: three q(G) laws mapped through the static model over
// time (paper Section 11, "Technological Regimes, Consumer Prices, and Rent
// Shares", \label{sec:technology-regimes}).
//
// The four productivity-vs-cumulative-training laws, organized on two axes
// (are levels bounded? does the relative gap converge?):
//   common:             q_l(G) = qBar - d_l (psi_l G)^{-beta}  -> bounded; ratio -> 1
//   firm-specific:      q_l(G) = eta_l qBar - d_l G^{-beta}    -> bounded; ratio -> eta_L/eta_F
//   continuing (mult.): q_l(G) = eta_l G^{beta}                -> unbounded; ratio -> eta_L/eta_F
//   continuing (add.):  q_l(G) = G^{beta} + alpha_l           -> unbounded; ratio -> 1
// The additive case is the fourth cell: unbounded growth with a converging
// relative position (paper Section 12.4, subsec:additive-frontier). Its
// differential rents vanish as a SHARE of a growing market but freeze in LEVEL
// at the additive increment alpha_L - alpha_F.
//
// Each period, cumulative training G accumulates, capacity K and purchaser mass
// N may grow, and the qualities are pushed through the static model to trace
// paths of {quality gap q_L/q_F, scarcity rent r - c = lambda, leader markup
// mu_L, quality-adjusted price P_L/Q_L}. Scarcity rent uses the water-filling
// lambda from allocation.ts; the leader markup and price use the two-model
// Bertrand equilibrium of demand.ts with compute-inclusive marginal cost
// kappa = b + a (c + lambda). Coupling the Bertrand game to the allocation
// lambda this way is a modeling choice (documented) that keeps the scarcity
// component and the downstream markup consistent within one period.
//
// All functions pure. No DOM imports.

import type { Params } from './types'
import { allocate } from './allocation'
import { bertrandDuopoly } from './demand'

export type RegimeType = 'common' | 'firm-specific' | 'continuing' | 'continuing-additive'

/** Common global asymptote: q_l(G) = qBar - d (psi G)^{-beta}. */
export function qCommonAsymptote(
  G: number,
  qBar: number,
  d: number,
  psi: number,
  beta: number,
): number {
  return qBar - d * Math.pow(Math.max(psi * G, 1e-12), -beta)
}

/** Firm-specific asymptote: q_l(G) = eta qBar - d G^{-beta}. */
export function qFirmAsymptote(
  G: number,
  qBar: number,
  d: number,
  eta: number,
  beta: number,
): number {
  return eta * qBar - d * Math.pow(Math.max(G, 1e-12), -beta)
}

/** Continuing improvement, multiplicative advantage (no ceiling): q_l(G) = eta G^{beta}. */
export function qContinuing(
  G: number,
  eta: number,
  beta: number,
): number {
  return eta * Math.pow(Math.max(G, 0), beta)
}

/**
 * Continuing improvement, additive advantage (no ceiling): q_l(G) = G^{beta} + alpha.
 * Levels diverge, the absolute gap freezes at alpha_L - alpha_F, and the ratio
 * q_L/q_F -> 1 (the fourth regime). Same diverging frontier G^{beta} as the
 * multiplicative case, but the advantage rides on top as a fixed increment
 * rather than a multiplier, so relative position converges.
 */
export function qContinuingAdditive(
  G: number,
  alpha: number,
  beta: number,
): number {
  return Math.pow(Math.max(G, 0), beta) + alpha
}

/** Per-firm law parameters (arrays aligned with base.firms). */
export interface RegimeConfig {
  regime: RegimeType
  /** Market params + firms (a, b read; q overwritten by the law each period). */
  base: Params
  /** Common ceiling qBar (common & firm-specific regimes). */
  qBar: number
  /** Firm-specific multipliers eta_l (firm-specific & continuing-multiplicative regimes). */
  eta: number[]
  /** Additive increments alpha_l (continuing-additive regime only). */
  alpha: number[]
  /** Gap coefficients d_l (common & firm-specific regimes). */
  d: number[]
  /** Research-efficiency psi_l (common regime only). */
  psi: number[]
  /** Curvature beta > 0. */
  beta: number
  /** Initial cumulative training investment G_0 > 0. */
  G0: number
  /** Per-period multiplicative growth of G: G_{t+1} = G_t (1 + gG). */
  gG: number
  /** Per-period capacity growth: K_t = K_0 (1 + capacityGrowth)^t. */
  capacityGrowth: number
  /** Per-period demand growth: N_t = N_0 (1 + demandGrowth)^t. */
  demandGrowth: number
  periods: number
}

export interface RegimePeriod {
  t: number
  G: number
  /** Deployed productivity per firm. */
  q: number[]
  /** Leader / follower productivity ratio q_L/q_F (two highest-q firms). */
  qualityGap: number
  /** Scarcity rent per FLOP, r - c = lambda. */
  scarcityRent: number
  /** Leader Lerner markup mu_L from the two-model Bertrand equilibrium. */
  markupLeader: number
  /** Quality-adjusted purchaser price P_L / Q_L. */
  qualityAdjustedPrice: number
  K: number
  N: number
}

export interface RegimeSimResult {
  regime: RegimeType
  periods: RegimePeriod[]
}

/** Productivity of firm i at cumulative training G under the chosen regime. */
function qOfG(config: RegimeConfig, i: number, G: number): number {
  switch (config.regime) {
    case 'common':
      return qCommonAsymptote(G, config.qBar, config.d[i], config.psi[i], config.beta)
    case 'firm-specific':
      return qFirmAsymptote(G, config.qBar, config.d[i], config.eta[i], config.beta)
    case 'continuing':
      return qContinuing(G, config.eta[i], config.beta)
    case 'continuing-additive':
      return qContinuingAdditive(G, config.alpha[i], config.beta)
  }
}

/**
 * Trace the regime paths. Requires at least two firms; the leader and follower
 * for the gap/markup are the two highest-q firms in each period.
 */
export function simulateRegime(config: RegimeConfig): RegimeSimResult {
  const { base } = config
  const periods: RegimePeriod[] = []

  let G = config.G0
  for (let t = 0; t < config.periods; t++) {
    const K = base.K * Math.pow(1 + config.capacityGrowth, t)
    const N = base.N * Math.pow(1 + config.demandGrowth, t)

    const q = base.firms.map((_, i) => qOfG(config, i, G))

    const params: Params = {
      ...base,
      K,
      N,
      firms: base.firms.map((f, i) => ({ ...f, q: q[i] })),
    }

    const { lambda } = allocate(params)
    const r = base.c + lambda

    // Identify the two highest-q firms as leader and follower.
    const order = q
      .map((qq, i) => ({ qq, i }))
      .sort((x, y) => y.qq - x.qq)
    const li = order[0].i
    const fi = order[1].i
    const lead = base.firms[li]
    const foll = base.firms[fi]
    const QL = lead.a * q[li]
    const QF = foll.a * q[fi]
    const kappaL = lead.b + lead.a * r
    const kappaF = foll.b + foll.a * r

    const bert = bertrandDuopoly(QL, QF, kappaL, kappaF, base.thetaMax)

    periods.push({
      t,
      G,
      q,
      qualityGap: q[fi] > 1e-12 ? q[li] / q[fi] : Number.POSITIVE_INFINITY,
      scarcityRent: lambda,
      markupLeader: bert.muL,
      qualityAdjustedPrice: QL > 1e-12 ? bert.PL / QL : 0,
      K,
      N,
    })

    G = G * (1 + config.gG)
  }

  return { regime: config.regime, periods }
}
