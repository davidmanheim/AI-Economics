import { describe, it, expect } from 'vitest'
import {
  qCommonAsymptote,
  qFirmAsymptote,
  qContinuing,
  simulateRegime,
  type RegimeConfig,
} from '../regimes'
import { NORMALIZED } from '../presets'

describe('regime productivity laws (Section 11)', () => {
  it('common asymptote approaches qBar and ratio -> 1', () => {
    const qBar = 2
    const big = 1e9
    expect(qCommonAsymptote(big, qBar, 1, 1, 0.4)).toBeCloseTo(qBar, 3)
    const qL = qCommonAsymptote(big, qBar, 1.0, 1.0, 0.4)
    const qF = qCommonAsymptote(big, qBar, 1.5, 0.8, 0.4)
    expect(qL / qF).toBeCloseTo(1, 3)
  })

  it('firm-specific asymptote ratio -> eta_L/eta_F', () => {
    const qBar = 2
    const big = 1e9
    const qL = qFirmAsymptote(big, qBar, 1, 1.4, 0.4)
    const qF = qFirmAsymptote(big, qBar, 1, 1.1, 0.4)
    expect(qL / qF).toBeCloseTo(1.4 / 1.1, 3)
  })

  it('continuing improvement is increasing in G', () => {
    const a = qContinuing(10, 1.4, 0.4)
    const b = qContinuing(100, 1.4, 0.4)
    expect(b).toBeGreaterThan(a)
    expect(qContinuing(1, 1.4, 0.4)).toBeCloseTo(1.4, 12) // eta * 1^beta
  })
})

function baseTwoFirm(): RegimeConfig['base'] {
  return {
    ...NORMALIZED,
    firms: [
      { name: 'Leader', q: 1.4, a: 1, b: 0 },
      { name: 'Follower', q: 1.1, a: 1, b: 0 },
    ],
  }
}

describe('regime simulation maps through the static model', () => {
  it('firm-specific: quality gap stays above 1 and settles near eta ratio', () => {
    const cfg: RegimeConfig = {
      regime: 'firm-specific',
      base: baseTwoFirm(),
      qBar: 2,
      eta: [1.4, 1.1],
      d: [1, 1],
      psi: [1, 1],
      beta: 0.4,
      G0: 1,
      gG: 0.3,
      capacityGrowth: 0.1,
      demandGrowth: 0.08,
      periods: 30,
    }
    const res = simulateRegime(cfg)
    const last = res.periods[res.periods.length - 1]
    expect(last.qualityGap).toBeGreaterThan(1)
    expect(last.qualityGap).toBeCloseTo(1.4 / 1.1, 1)
    for (const p of res.periods) {
      expect(p.markupLeader).toBeGreaterThanOrEqual(0)
      expect(p.scarcityRent).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('common asymptote: quality gap converges toward 1 over time', () => {
    const cfg: RegimeConfig = {
      regime: 'common',
      base: baseTwoFirm(),
      qBar: 2,
      eta: [1, 1],
      d: [1.0, 1.4],
      psi: [1, 1],
      beta: 0.5,
      G0: 1,
      gG: 0.5,
      capacityGrowth: 0.1,
      demandGrowth: 0.05,
      periods: 40,
    }
    const res = simulateRegime(cfg)
    const first = res.periods[2].qualityGap
    const last = res.periods[res.periods.length - 1].qualityGap
    expect(Math.abs(last - 1)).toBeLessThan(Math.abs(first - 1))
  })
})
