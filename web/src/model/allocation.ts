// Integrated-industry allocation benchmark (paper Sections 5-6).
//
// Marginal-net-revenue-per-FLOP schedules v_m(x), water-filling allocation
// solving v_m = c + lambda subject to sum_m a_m y_m <= K, the winner-take-all
// test v_L(K) >= max_j v_j(0), and the surplus split.
//
// The v_m schedule uses the separable single-model residual demand from
// demand.ts, giving the piecewise-linear schedule
//   v_m(x) = q_m thetaMax (1 - 2 x/(a_m N)) - b_m/a_m,
// with intercept v_m(0) = q_m thetaMax - b_m/a_m increasing in productivity
// (the paper's assumption d v_m / d q_m > 0 made concrete). The water-filling
// active set changes with K, so lambda is solved by bisection, not a closed
// form (per the plan's numerical note).
//
// All functions pure. No DOM imports.

import type {
  AllocationResult,
  FirmAllocation,
  Params,
  SurplusSplit,
  WtaResult,
} from './types'
import { dominancePrice as dominancePriceDemand } from './demand'

const BISECTION_ITERS = 200

/**
 * Marginal net revenue per FLOP for a model of productivity q with `x` FLOPs:
 *   v_m(x) = q thetaMax (1 - 2 x/(a N)) - b/a.
 * Not clipped: goes negative past the choke point.
 */
export function vSchedule(
  x: number,
  q: number,
  a: number,
  b: number,
  thetaMax: number,
  N: number,
): number {
  return q * thetaMax * (1 - (2 * x) / (a * N)) - b / a
}

/** Intercept v_m(0) = q thetaMax - b/a. */
export function vIntercept(
  q: number,
  a: number,
  b: number,
  thetaMax: number,
): number {
  return q * thetaMax - b / a
}

/**
 * Compute demand x_m(lambda) that sets v_m(x) = c + lambda, clipped at 0:
 *   x = (a N / 2)(1 - (c + lambda + b/a)/(q thetaMax)).
 */
function xOfLambda(
  lambda: number,
  q: number,
  a: number,
  b: number,
  c: number,
  thetaMax: number,
  N: number,
): number {
  const x = ((a * N) / 2) * (1 - (c + lambda + b / a) / (q * thetaMax))
  return Math.max(0, x)
}

/**
 * Water-filling allocation of the integrated benchmark. Solves v_m = c + lambda
 * for every active model with sum_m a_m y_m <= K and x_m >= 0. When capacity is
 * slack, lambda = 0 and each model sits at its unconstrained output (v_m = c).
 *
 * Note: sum_m a_m y_m = sum_m x_m, so the constraint is on total FLOPs directly.
 */
export function allocate(params: Params): AllocationResult {
  const { c, K, N, thetaMax, firms } = params

  const totalAt = (lambda: number): number =>
    firms.reduce(
      (sum, f) => sum + xOfLambda(lambda, f.q, f.a, f.b, c, thetaMax, N),
      0,
    )

  let lambda = 0
  if (totalAt(0) > K) {
    // Bisect lambda in [0, max_m v_m(0)] (upper bound zeroes every allocation).
    let lo = 0
    let hi = Math.max(...firms.map((f) => vIntercept(f.q, f.a, f.b, thetaMax)))
    for (let i = 0; i < BISECTION_ITERS; i++) {
      const mid = 0.5 * (lo + hi)
      if (totalAt(mid) > K) lo = mid
      else hi = mid
    }
    lambda = 0.5 * (lo + hi)
  }

  const allocations: FirmAllocation[] = firms.map((f) => {
    const x = xOfLambda(lambda, f.q, f.a, f.b, c, thetaMax, N)
    return {
      name: f.name,
      x,
      y: x / f.a,
      v: vSchedule(x, f.q, f.a, f.b, thetaMax, N),
      active: x > 1e-9,
    }
  })

  return { allocations, lambda, capacityBinds: lambda > 1e-9 }
}

/**
 * Winner-take-all test: the leader (highest v_m(0)) receives all compute iff
 *   v_L(K) >= max_{j != L} v_j(0).
 * Directly the boxed condition in the paper's Concentration section.
 */
export function wtaTest(params: Params): WtaResult {
  const { K, N, thetaMax, firms } = params
  const intercepts = firms.map((f) => vIntercept(f.q, f.a, f.b, thetaMax))
  let leaderIdx = 0
  for (let i = 1; i < firms.length; i++) {
    if (intercepts[i] > intercepts[leaderIdx]) leaderIdx = i
  }
  const leader = firms[leaderIdx]
  // v_L evaluated at the full capacity K allocated to the leader (y = K/a_L).
  const vLeaderAtK = vSchedule(K, leader.q, leader.a, leader.b, thetaMax, N)
  const bestFollowerV0 = firms.reduce(
    (best, f, i) => (i === leaderIdx ? best : Math.max(best, intercepts[i])),
    -Infinity,
  )
  return {
    isWTA: vLeaderAtK >= bestFollowerV0,
    leader: leader.name,
    vLeaderAtK,
    bestFollowerV0,
  }
}

/**
 * Division of producer surplus above physical cost, from the benchmark.
 *   S       = sum_m integral_0^{x_m} (v_m - c) dx  (area above physical cost),
 *   H       = lambda * K                            (hyperscaler scarcity rent),
 *   lab     = S - H,
 *   per-lab = area_m - lambda * x_m.
 * Area_m uses intercept0 = q thetaMax - b/a and slope 2 q thetaMax/(a N):
 *   area_m = (intercept0 - c) x_m - 0.5 slope x_m^2.
 */
export function surplusSplit(params: Params): SurplusSplit {
  const { c, K, N, thetaMax, firms } = params
  const { allocations, lambda } = allocate(params)

  const perFirmArea = firms.map((f, i) => {
    const x = allocations[i].x
    const intercept0 = vIntercept(f.q, f.a, f.b, thetaMax)
    const slope = (2 * f.q * thetaMax) / (f.a * N)
    return (intercept0 - c) * x - 0.5 * slope * x * x
  })

  const totalSurplus = perFirmArea.reduce((s, a) => s + a, 0)
  const hyperscalerRent = lambda * K
  const perFirmLabRent = firms.map(
    (_, i) => perFirmArea[i] - lambda * allocations[i].x,
  )

  return {
    totalSurplus,
    hyperscalerRent,
    labRent: totalSurplus - hyperscalerRent,
    perFirmLabRent,
    lambda,
  }
}

/**
 * Dominance-case purchaser-facing price when the leader receives all capacity.
 * Thin wrapper over demand.ts using the leader's total quality Q = a q.
 */
export function dominancePrice(params: Params): number {
  const { K, N, thetaMax, firms } = params
  const intercepts = firms.map((f) => vIntercept(f.q, f.a, f.b, thetaMax))
  let leaderIdx = 0
  for (let i = 1; i < firms.length; i++) {
    if (intercepts[i] > intercepts[leaderIdx]) leaderIdx = i
  }
  const leader = firms[leaderIdx]
  return dominancePriceDemand(leader.a * leader.q, leader.a, K, N, thetaMax)
}
