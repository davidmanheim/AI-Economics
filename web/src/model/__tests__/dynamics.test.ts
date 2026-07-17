import { describe, it, expect } from 'vitest'
import {
  vLead,
  mulberry32,
  simulateReleases,
  type ReleaseSimConfig,
} from '../dynamics'
import { NORMALIZED } from '../presets'

describe('value of temporary leadership (Section 10)', () => {
  it('vLead = deltaPi / (r + Lambda), exact', () => {
    expect(vLead(10, 0.05, 0.5)).toBeCloseTo(10 / 0.55, 12)
    expect(vLead(100, 0.1, 0)).toBeCloseTo(1000, 12) // Lambda=0
  })

  it('catch-up risk acts like extra impatience (monotone in Lambda)', () => {
    expect(vLead(10, 0.05, 1.0)).toBeLessThan(vLead(10, 0.05, 0.2))
  })
})

describe('mulberry32 PRNG', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    for (let i = 0; i < 20; i++) expect(a()).toBe(b())
  })

  it('produces uniforms in [0, 1)', () => {
    const rng = mulberry32(7)
    let sum = 0
    const M = 5000
    for (let i = 0; i < M; i++) {
      const u = rng()
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
      sum += u
    }
    expect(sum / M).toBeCloseTo(0.5, 1) // mean ~ 0.5
  })
})

function simConfig(seed: number): ReleaseSimConfig {
  return {
    base: { ...NORMALIZED, firms: NORMALIZED.firms.map((f) => ({ ...f })) },
    hazards: [0.2, 0.2, 0.2],
    alpha: [Math.log(1.4), Math.log(1.1), Math.log(0.9)],
    A0: 0,
    g: 0.02,
    sigmaJump: 0.2,
    adjustmentSpeed: 0.4,
    periods: 40,
    seed,
  }
}

describe('seeded release simulator (Section 10)', () => {
  it('same seed reproduces the run exactly', () => {
    const r1 = simulateReleases(simConfig(999))
    const r2 = simulateReleases(simConfig(999))
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })

  it('different seeds generally differ', () => {
    const r1 = simulateReleases(simConfig(1))
    const r2 = simulateReleases(simConfig(2))
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2))
  })

  it('target and actual shares each sum to 1 every period', () => {
    const res = simulateReleases(simConfig(42))
    for (const p of res.periods) {
      const st = p.targetShares.reduce((s, x) => s + x, 0)
      const sa = p.actualShares.reduce((s, x) => s + x, 0)
      expect(st).toBeCloseTo(1, 9)
      expect(sa).toBeCloseTo(1, 9)
      for (const s of p.actualShares) expect(s).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it('rents are non-negative and lambda>=0 throughout', () => {
    const res = simulateReleases(simConfig(3))
    for (const p of res.periods) {
      expect(p.lambda).toBeGreaterThanOrEqual(-1e-9)
      expect(p.hyperscalerRent).toBeGreaterThanOrEqual(-1e-9)
      expect(p.labRent).toBeGreaterThanOrEqual(-1e-6)
    }
  })
})
