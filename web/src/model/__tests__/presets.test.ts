import { describe, it, expect } from 'vitest'
import { NORMALIZED, ILLUSTRATIVE, clonePreset } from '../presets'

describe('parameter presets (plan Section 3)', () => {
  it('NORMALIZED matches the notes normalization', () => {
    expect(NORMALIZED.c).toBe(1)
    expect(NORMALIZED.K).toBe(100)
    expect(NORMALIZED.N).toBe(300)
    expect(NORMALIZED.thetaMax).toBe(10)
    expect(NORMALIZED.firms.map((f) => f.q)).toEqual([1.4, 1.1, 0.9])
    expect(NORMALIZED.dynamics).toEqual({ r: 0.05, Lambda: 0.5 })
  })

  it('both presets use only generic firm names', () => {
    const allowed = new Set(['Leader', 'Follower A', 'Follower B'])
    for (const preset of [NORMALIZED, ILLUSTRATIVE]) {
      for (const f of preset.firms) expect(allowed.has(f.name)).toBe(true)
    }
  })

  it('clonePreset produces an independent deep copy', () => {
    const c = clonePreset(NORMALIZED)
    c.firms[0].q = 99
    c.dynamics.r = 99
    expect(NORMALIZED.firms[0].q).toBe(1.4)
    expect(NORMALIZED.dynamics.r).toBe(0.05)
  })
})
