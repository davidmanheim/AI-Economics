import { describe, it, expect } from 'vitest'
import type { Params } from '../types'
import {
  allocate,
  wtaTest,
  surplusSplit,
  vSchedule,
  vIntercept,
  dominancePrice,
} from '../allocation'
import { NORMALIZED } from '../presets'

function params(over: Partial<Params>): Params {
  return { ...NORMALIZED, firms: NORMALIZED.firms.map((f) => ({ ...f })), ...over }
}

describe('water-filling allocation (Sections 5-6)', () => {
  it('single firm, hand-computed lambda = 7/3', () => {
    // q=1,a=1,b=0,thetaMax=10,N=300,c=1,K=100.
    // Unconstrained x = (aN/2)(1 - c/(q thetaMax)) = 150*0.9 = 135 > 100 -> binds.
    // x(lambda)=100 => 100 = 150(1 - (1+lambda)/10) => lambda = 7/3.
    const p = params({
      firms: [{ name: 'Solo', q: 1, a: 1, b: 0 }],
      c: 1,
      K: 100,
      N: 300,
      thetaMax: 10,
    })
    const res = allocate(p)
    expect(res.capacityBinds).toBe(true)
    expect(res.lambda).toBeCloseTo(7 / 3, 6)
    expect(res.allocations[0].x).toBeCloseTo(100, 4)
    expect(res.allocations[0].v).toBeCloseTo(1 + 7 / 3, 6) // c + lambda
  })

  it('invariant: allocated compute never exceeds K', () => {
    const res = allocate(params({ K: 40 }))
    const total = res.allocations.reduce((s, a) => s + a.x, 0)
    expect(total).toBeLessThanOrEqual(40 + 1e-6)
  })

  it('invariant: v_m equalized to c + lambda across all active firms', () => {
    const p = params({ K: 60 })
    const res = allocate(p)
    const target = p.c + res.lambda
    for (const a of res.allocations) {
      if (a.active) expect(a.v).toBeCloseTo(target, 6)
    }
  })

  it('slack capacity: lambda = 0 and every firm sits at v = c', () => {
    const res = allocate(params({ K: 100000 }))
    expect(res.capacityBinds).toBe(false)
    expect(res.lambda).toBeCloseTo(0, 9)
    for (const a of res.allocations) {
      if (a.active) expect(a.v).toBeCloseTo(NORMALIZED.c, 6)
    }
  })

  it('WTA test agrees with a direct schedule comparison', () => {
    const p = params({ K: 40 })
    const res = wtaTest(p)
    // Recompute directly: leader = highest intercept.
    const intercepts = p.firms.map((f) => vIntercept(f.q, f.a, f.b, p.thetaMax))
    let li = 0
    intercepts.forEach((v, i) => {
      if (v > intercepts[li]) li = i
    })
    const leader = p.firms[li]
    const vLK = vSchedule(p.K, leader.q, leader.a, leader.b, p.thetaMax, p.N)
    const bestFollower = Math.max(
      ...intercepts.filter((_, i) => i !== li),
    )
    expect(res.leader).toBe(leader.name)
    expect(res.vLeaderAtK).toBeCloseTo(vLK, 9)
    expect(res.bestFollowerV0).toBeCloseTo(bestFollower, 9)
    expect(res.isWTA).toBe(vLK >= bestFollower)
  })

  it('WTA holds when capacity is tiny (leader still valuable at K)', () => {
    // Very small K keeps v_L(K) high; a dominant leader takes all.
    const p = params({
      firms: [
        { name: 'Leader', q: 3.0, a: 1, b: 0 },
        { name: 'Follower', q: 0.9, a: 1, b: 0 },
      ],
      K: 5,
    })
    const res = wtaTest(p)
    expect(res.isWTA).toBe(true)
  })

  it('surplus split: hyperscaler rent = lambda*K and parts add to total', () => {
    const p = params({ K: 60 })
    const s = surplusSplit(p)
    expect(s.hyperscalerRent).toBeCloseTo(s.lambda * p.K, 9)
    expect(s.labRent + s.hyperscalerRent).toBeCloseTo(s.totalSurplus, 6)
    const perLabSum = s.perFirmLabRent.reduce((x, y) => x + y, 0)
    expect(perLabSum).toBeCloseTo(s.labRent, 6)
  })

  it('dominance price matches Q thetaMax (1 - K/(a N))', () => {
    const p = params({ K: 100, N: 300, thetaMax: 10 })
    // Leader q=1.4, a=1 -> Q=1.4. P* = 14 * (1 - 100/300) = 14*2/3.
    expect(dominancePrice(p)).toBeCloseTo((14 * 2) / 3, 9)
  })
})
