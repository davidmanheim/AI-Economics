// Bilateral Nash bargaining over a marginal block of compute.
//
// Primary source: paper Appendix A, "Bargaining, Auctions, and Oligopsony"
// (\label{app:bargaining}). A laboratory with private marginal value vHat and
// Nash bargaining weight zeta in [0,1] splits the match-specific surplus
// vHat - barVH with a hyperscaler whose outside option is barVH = max(c, vHatF).
//
// All functions pure. No DOM imports.

import type { BargainingSplit } from './types'

/**
 * Nash bargaining split of the match-specific surplus (paper app:bargaining).
 *
 * The Nash solution maximizes (vHat - r)^zeta * (r - barVH)^(1-zeta), giving
 *   r        = zeta * barVH + (1 - zeta) * vHat            (negotiated price)
 *   barVH    = max(c, vHatF)                               (hyperscaler outside option)
 *   labRent  = vHat - r        = zeta       * (vHat - barVH)
 *   hyperInc = r    - barVH     = (1 - zeta) * (vHat - barVH)
 *   r - c    = (barVH - c) + (1 - zeta) * (vHat - barVH)   (total hyperscaler margin)
 *
 * @param vHat  laboratory private marginal profit per FLOP (leader's vHat_L)
 * @param vHatF best losing bidder's private value (enters the outside option)
 * @param c     physical operating cost per FLOP
 * @param zeta  laboratory Nash bargaining weight in [0, 1]
 */
export function nashBargain(
  vHat: number,
  vHatF: number,
  c: number,
  zeta: number,
): BargainingSplit {
  const barVH = Math.max(c, vHatF)
  const matchSurplus = vHat - barVH
  const negotiatedPrice = zeta * barVH + (1 - zeta) * vHat
  const labRent = zeta * matchSurplus
  const hyperscalerIncremental = (1 - zeta) * matchSurplus
  const hyperscalerMargin = negotiatedPrice - c
  return {
    negotiatedPrice,
    matchSurplus,
    barVH,
    labRent,
    hyperscalerIncremental,
    hyperscalerMargin,
  }
}

/**
 * The competitive-auction benchmark is the corner case zeta -> 0, where the
 * hyperscaler captures the whole match-specific surplus and the wholesale price
 * approaches the winning laboratory's own value vHat. Provided as a convenience
 * for the S3 sub-view; identical to `nashBargain(vHat, vHatF, c, 0)`.
 */
export function competitiveAuctionBenchmark(
  vHat: number,
  vHatF: number,
  c: number,
): BargainingSplit {
  return nashBargain(vHat, vHatF, c, 0)
}
