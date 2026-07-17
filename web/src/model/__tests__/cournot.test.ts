import { describe, it, expect } from 'vitest'
import {
  cournotEquilibrium,
  bindingThreshold,
  cournotOutputAtCost,
  decomposePrice,
  linearDemandFromVertical,
} from '../cournot'

// Hand-computed exact cases. Parameters: A=10, B=1, a=1, b=0, c=1.
// Binding threshold = a n (A-b-a c)/(B (n+1)) = 2*9/3 = 6 for n=2.

describe('cournot closed forms (Appendix D)', () => {
  it('binding threshold and cournot output at cost match the paper', () => {
    expect(cournotOutputAtCost(10, 1, 1, 0, 1, 2)).toBeCloseTo(6, 12)
    expect(bindingThreshold(10, 1, 1, 0, 1, 2)).toBeCloseTo(6, 12)
  })

  it('binding case (n=2, K=3): P*, r*, markup, profit are exact', () => {
    const res = cournotEquilibrium(10, 1, 1, 0, 1, 2, 3)
    expect(res.binding).toBe(true)
    expect(res.P).toBeCloseTo(7, 12) // A - B K / a = 10 - 3
    expect(res.r).toBeCloseTo(5.5, 12) // 10 - 1*3*3/(1*2) = 10 - 4.5
    expect(res.perFirmMarkup).toBeCloseTo(1.5, 12) // B K/(a n) = 3/2
    expect(res.markup).toBeCloseTo(1.5, 12)
    expect(res.labProfitAggregate).toBeCloseTo(4.5, 12) // B K^2/(a^2 n) = 9/2
  })

  it('price decomposition sums to P* in the binding case', () => {
    const res = cournotEquilibrium(10, 1, 1, 0, 1, 2, 3)
    expect(res.physicalCost).toBeCloseTo(1, 12) // b + a c
    expect(res.scarcityRent).toBeCloseTo(4.5, 12) // a (r - c) = 4.5
    expect(res.physicalCost + res.scarcityRent + res.markup).toBeCloseTo(res.P, 12)
  })

  it('capacity-binding neutrality: P* independent of n, markup falls, r* rises', () => {
    const K = 3 // < threshold for all n considered (threshold grows with n but P is n-free)
    const n2 = cournotEquilibrium(10, 1, 1, 0, 1, 2, K)
    const n5 = cournotEquilibrium(10, 1, 1, 0, 1, 5, K)
    expect(n2.binding && n5.binding).toBe(true)
    expect(n5.P).toBeCloseTo(n2.P, 12) // Proposition: P* has no n
    expect(n5.perFirmMarkup).toBeLessThan(n2.perFirmMarkup) // B K/(a n) falls
    expect(n5.r).toBeGreaterThan(n2.r) // rent transfers to hyperscalers
  })

  it('slack case (n=2, K=10 > 6): r*=c, ordinary Cournot', () => {
    const res = cournotEquilibrium(10, 1, 1, 0, 1, 2, 10)
    expect(res.binding).toBe(false)
    expect(res.r).toBeCloseTo(1, 12) // r* = c
    expect(res.P).toBeCloseTo(4, 12) // Y=6, P = 10 - 6
    expect(res.perFirmMarkup).toBeCloseTo(3, 12) // P - kappa = 4 - 1
    expect(res.scarcityRent).toBeCloseTo(0, 12)
    expect(res.physicalCost + res.scarcityRent + res.markup).toBeCloseTo(res.P, 12)
  })

  it('decomposePrice is a partition of P', () => {
    const d = decomposePrice(7, 1, 0, 1, 5.5)
    expect(d.physicalCost).toBeCloseTo(1, 12)
    expect(d.scarcityRent).toBeCloseTo(4.5, 12)
    expect(d.markup).toBeCloseTo(1.5, 12)
    expect(d.total).toBe(7)
  })

  it('linearDemandFromVertical: A = Q thetaMax, B = A/N', () => {
    const { A, B } = linearDemandFromVertical(1.4, 300, 10)
    expect(A).toBeCloseTo(14, 12)
    expect(B).toBeCloseTo(14 / 300, 12)
  })
})
