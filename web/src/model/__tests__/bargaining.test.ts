import { describe, it, expect } from 'vitest'
import { nashBargain, competitiveAuctionBenchmark } from '../bargaining'

// Hand-computed: vHat=10, vHatF=6, c=1.
// barVH = max(1,6) = 6, matchSurplus = 4.

describe('nash bargaining split (Appendix A)', () => {
  it('zeta=0.5 splits the match surplus evenly', () => {
    const s = nashBargain(10, 6, 1, 0.5)
    expect(s.barVH).toBeCloseTo(6, 12)
    expect(s.matchSurplus).toBeCloseTo(4, 12)
    expect(s.negotiatedPrice).toBeCloseTo(8, 12) // 0.5*6 + 0.5*10
    expect(s.labRent).toBeCloseTo(2, 12) // vHat - r = 10 - 8
    expect(s.hyperscalerIncremental).toBeCloseTo(2, 12) // r - barVH = 8 - 6
    expect(s.hyperscalerMargin).toBeCloseTo(7, 12) // r - c = 8 - 1
  })

  it('identity: labRent + hyperscalerIncremental = matchSurplus', () => {
    const s = nashBargain(10, 6, 1, 0.37)
    expect(s.labRent + s.hyperscalerIncremental).toBeCloseTo(s.matchSurplus, 12)
    // labRent = vHat - negotiatedPrice
    expect(s.labRent).toBeCloseTo(10 - s.negotiatedPrice, 12)
  })

  it('zeta=1: laboratory captures the whole surplus', () => {
    const s = nashBargain(10, 6, 1, 1)
    expect(s.negotiatedPrice).toBeCloseTo(6, 12) // r = barVH
    expect(s.labRent).toBeCloseTo(4, 12)
    expect(s.hyperscalerIncremental).toBeCloseTo(0, 12)
  })

  it('zeta=0 competitive auction: hyperscaler captures the surplus', () => {
    const s = competitiveAuctionBenchmark(10, 6, 1)
    expect(s.negotiatedPrice).toBeCloseTo(10, 12) // r -> vHat
    expect(s.labRent).toBeCloseTo(0, 12)
    expect(s.hyperscalerIncremental).toBeCloseTo(4, 12)
  })

  it('outside option is max(c, vHatF): binds to c when vHatF < c', () => {
    const s = nashBargain(10, 0.5, 1, 0.5)
    expect(s.barVH).toBeCloseTo(1, 12)
    expect(s.matchSurplus).toBeCloseTo(9, 12)
  })
})
