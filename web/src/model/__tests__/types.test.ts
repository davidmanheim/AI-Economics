import { describe, it, expect } from 'vitest'
import { totalQuality } from '../types'

describe('types helpers', () => {
  it('totalQuality Q = a * q', () => {
    expect(totalQuality({ name: 'Leader', q: 1.4, a: 2, b: 0 })).toBeCloseTo(2.8, 12)
    expect(totalQuality({ name: 'F', q: 0.9, a: 1, b: 0 })).toBeCloseTo(0.9, 12)
  })
})
