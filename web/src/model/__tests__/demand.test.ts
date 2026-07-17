import { describe, it, expect } from 'vitest'
import {
  segmentationCutoffs,
  demandTwoModel,
  inverseDemandTwoModel,
  marginalRevenueSingle,
  inverseDemandSingle,
  demandSingle,
  dominancePrice,
  dominancePriceNormalized,
  bertrandDuopoly,
  bertrandDuopolyClosedForm,
} from '../demand'

describe('two-model vertical demand (Section 4.1 / Appendix F)', () => {
  it('cutoffs match theta* and theta0', () => {
    const { thetaStar, thetaZero } = segmentationCutoffs(6, 3, 2, 1)
    expect(thetaStar).toBeCloseTo((6 - 3) / (2 - 1), 12) // 3
    expect(thetaZero).toBeCloseTo(3 / 1, 12) // 3
  })

  it('demand and inverse demand are mutual inverses', () => {
    const QL = 2
    const QF = 1
    const N = 300
    const tMax = 10
    // Pick quantities in the interior and recover prices, then demand again.
    const yL = 40
    const yF = 30
    const { PL, PF } = inverseDemandTwoModel(yL, yF, QL, QF, N, tMax)
    const back = demandTwoModel(PL, PF, QL, QF, N, tMax)
    expect(back.DL).toBeCloseTo(yL, 6)
    expect(back.DF).toBeCloseTo(yF, 6)
  })

  it('single-model formulas: MR = P at y=0 and demand inverts price', () => {
    const Q = 1.4
    const N = 300
    const tMax = 10
    expect(marginalRevenueSingle(0, Q, N, tMax)).toBeCloseTo(
      inverseDemandSingle(0, Q, N, tMax),
      9,
    )
    const P = inverseDemandSingle(90, Q, N, tMax)
    expect(demandSingle(P, Q, N, tMax)).toBeCloseTo(90, 6)
  })

  it('dominance price: Q thetaMax (1 - K/(a N)) and per-FLOP variant', () => {
    expect(dominancePrice(1.4, 1, 100, 300, 10)).toBeCloseTo((14 * 2) / 3, 9)
    expect(dominancePriceNormalized(1.4, 1, 100, 300, 10)).toBeCloseTo(
      (1.4 * 10 * 2) / 3,
      9,
    )
  })
})

describe('Bertrand duopoly solver (Appendix F)', () => {
  it('iterative solver matches the zero-cost closed form', () => {
    const QL = 2
    const QF = 1
    const cf = bertrandDuopolyClosedForm(QL, QF)
    const num = bertrandDuopoly(QL, QF, 0, 0, 1)
    expect(num.PL).toBeCloseTo(cf.PL, 9) // 2*2*1/(8-1) = 4/7
    expect(num.PF).toBeCloseTo(cf.PF, 9) // 1*1/7 = 1/7
    expect(cf.PL).toBeCloseTo(4 / 7, 12)
    expect(cf.PF).toBeCloseTo(1 / 7, 12)
  })

  it('leader markup shrinks as the quality gap shrinks (prop:breakthrough)', () => {
    const wide = bertrandDuopoly(2.0, 1.0, 0, 0, 1).muL
    const narrow = bertrandDuopoly(1.2, 1.0, 0, 0, 1).muL
    expect(narrow).toBeLessThan(wide)
    // mu_L -> 0 as QF -> QL.
    const converged = bertrandDuopoly(1.0001, 1.0, 0, 0, 1).muL
    expect(converged).toBeLessThan(0.01)
  })
})
