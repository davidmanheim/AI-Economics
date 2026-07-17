// Oracle tests: assert the TypeScript model core matches fixtures.json, the
// values independently computed by the Python notebook (notebook/llm-econ-model.ipynb,
// final cells). This is the single source of numerical truth the plan calls for
// (§2, §3): every closed form lives once in src/model/, and the notebook checks it.
//
// Complements — does not replace — the hand-computed unit tests in the sibling
// files. Regenerate fixtures.json by running the notebook's fixtures cells (or
// scripts/gen equivalent) whenever a formula changes.

import { describe, it, expect } from 'vitest'
import fixtures from './fixtures.json'
import type { Params, Firm } from '../types'
import { allocate, wtaTest } from '../allocation'
import { cournotEquilibrium } from '../cournot'
import { nashBargain } from '../bargaining'
import { vLead } from '../dynamics'
import { qCommonAsymptote, qFirmAsymptote, qContinuing } from '../regimes'
import { bertrandDuopoly } from '../demand'
import {
  netValue,
  incrementalValue,
  portfolioUtility,
  greedyPortfolio,
  singleProviderSubscribes,
  type Provider,
  type TaskType,
} from '../subscriptions'

/** Relative-error assertion: |a-e| <= tol * max(1, |e|). Tight (1e-9) but robust
 *  for the larger-magnitude quantities (profits ~150). Exact Infinity passes through. */
function closeRel(actual: number, expected: number, tol = 1e-9): void {
  if (!Number.isFinite(expected)) {
    expect(actual).toBe(expected)
    return
  }
  const mag = Math.max(1, Math.abs(expected))
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * mag)
}

const DUMMY_DYNAMICS = { r: 0.05, Lambda: 0.5 }
const NAMED_FIRMS: Firm[] = fixtures.params.firms.map((f) => ({
  name: f.name,
  q: f.q,
  a: f.a,
  b: f.b,
}))

describe('fixtures.json oracle — allocation.ts', () => {
  it('water-filling allocation matches the notebook at every K', () => {
    for (const c of fixtures.allocation) {
      const params: Params = {
        c: c.c,
        K: c.K,
        N: c.N,
        thetaMax: c.thetaMax,
        firms: NAMED_FIRMS,
        dynamics: DUMMY_DYNAMICS,
      }
      const res = allocate(params)
      closeRel(res.lambda, c.lambda)
      expect(res.capacityBinds).toBe(c.capacityBinds)
      expect(res.allocations.length).toBe(c.allocations.length)
      c.allocations.forEach((exp, i) => {
        const got = res.allocations[i]
        expect(got.name).toBe(exp.name)
        closeRel(got.x, exp.x)
        closeRel(got.y, exp.y)
        closeRel(got.v, exp.v)
        expect(got.active).toBe(exp.active)
      })
    }
  })

  it('winner-take-all test matches (holds and fails cases)', () => {
    for (const c of fixtures.wta) {
      const params: Params = {
        c: 1,
        K: c.K,
        N: c.N,
        thetaMax: c.thetaMax,
        firms: NAMED_FIRMS,
        dynamics: DUMMY_DYNAMICS,
      }
      const res = wtaTest(params)
      expect(res.isWTA).toBe(c.isWTA)
      expect(res.leader).toBe(c.leader)
      closeRel(res.vLeaderAtK, c.vLeaderAtK)
      closeRel(res.bestFollowerV0, c.bestFollowerV0)
    }
  })
})

describe('fixtures.json oracle — cournot.ts', () => {
  it('symmetric Cournot closed forms match (binding, slack, neutrality)', () => {
    for (const c of fixtures.cournot) {
      const res = cournotEquilibrium(c.A, c.B, c.a, c.b, c.c, c.n, c.K)
      expect(res.binding).toBe(c.binding)
      closeRel(res.P, c.P)
      closeRel(res.r, c.r)
      closeRel(res.physicalCost, c.physicalCost)
      closeRel(res.scarcityRent, c.scarcityRent)
      closeRel(res.markup, c.markup)
      closeRel(res.perFirmMarkup, c.perFirmMarkup)
      closeRel(res.labProfitAggregate, c.labProfitAggregate)
    }
  })
})

describe('fixtures.json oracle — bargaining.ts', () => {
  it('Nash bargaining split matches (interior, corner, zeta=1)', () => {
    for (const c of fixtures.bargaining) {
      const res = nashBargain(c.vHat, c.vHatF, c.c, c.zeta)
      closeRel(res.negotiatedPrice, c.negotiatedPrice)
      closeRel(res.matchSurplus, c.matchSurplus)
      closeRel(res.barVH, c.barVH)
      closeRel(res.labRent, c.labRent)
      closeRel(res.hyperscalerIncremental, c.hyperscalerIncremental)
      closeRel(res.hyperscalerMargin, c.hyperscalerMargin)
    }
  })
})

describe('fixtures.json oracle — dynamics.ts (vLead)', () => {
  it('temporary-leadership value matches', () => {
    for (const c of fixtures.vLead) {
      closeRel(vLead(c.deltaPi, c.r, c.Lambda), c.V)
    }
  })
})

describe('fixtures.json oracle — regimes.ts', () => {
  it('the three q(G) laws match at a spot value', () => {
    for (const c of fixtures.regimes) {
      let got: number
      if (c.regime === 'common') {
        got = qCommonAsymptote(c.G, c.qBar!, c.d!, c.psi!, c.beta)
      } else if (c.regime === 'firm-specific') {
        got = qFirmAsymptote(c.G, c.qBar!, c.d!, c.eta!, c.beta)
      } else {
        got = qContinuing(c.G, c.eta!, c.beta)
      }
      closeRel(got, c.q)
    }
  })
})

describe('fixtures.json oracle — demand.ts (Bertrand duopoly)', () => {
  it('iterated best-response equilibrium matches', () => {
    for (const c of fixtures.bertrand) {
      const res = bertrandDuopoly(c.QL, c.QF, c.kappaL, c.kappaF, c.thetaMax)
      closeRel(res.PL, c.PL)
      closeRel(res.PF, c.PF)
      closeRel(res.muL, c.muL)
    }
  })
})

describe('fixtures.json oracle — subscriptions.ts', () => {
  it('portfolio value, greedy choice, and single-provider test match', () => {
    const s = fixtures.subscriptions
    const tasks: TaskType[] = s.tasks.map((t) => ({ name: t.name, count: t.count }))
    const providers: Provider[] = s.providers.map((p) => ({
      name: p.name,
      phi: p.phi,
      rho: p.rho,
      a: p.a,
      quality: p.quality,
    }))
    closeRel(netValue(s.theta, providers[0], 0), s.netValue_p0_t0)
    closeRel(incrementalValue(s.theta, 1, [], tasks, providers), s.incrementalValue_p1_empty)
    closeRel(incrementalValue(s.theta, 1, [0], tasks, providers), s.incrementalValue_p1_given0)
    closeRel(portfolioUtility(s.theta, [0, 1, 2], tasks, providers), s.portfolioUtility_all)
    expect(greedyPortfolio(s.theta, tasks, providers)).toEqual(s.greedyPortfolio)
    expect(singleProviderSubscribes(9.333, 1.0, 5.0, 20.0)).toBe(s.singleProviderSubscribes)
  })
})
