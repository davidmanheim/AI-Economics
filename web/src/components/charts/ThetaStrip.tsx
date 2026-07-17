// M1 secondary visual (plan Section 4.1a): the theta-line segmentation strip.
//
// Purchasers are sorted by willingness-to-pay theta in [0, thetaMax]. Under
// vertical differentiation the highest-theta purchasers are served by the
// highest-quality model, so service fills the theta line from the top down and
// capacity decides how far down it reaches. The top slice is the FRONTIER
// segment (distinction #3, plan Section 7.3): it carries the .token-frontier
// colour; every other served slice and the unserved tail read as the wider
// market via .token-market.
//
// Pure function of props: data in, SVG out. No model/store imports.

import { firmDisplayName } from '../../lib/displayName'
import { VarTerm } from './VarLabel'
import { varDefs } from './varDefs'

/** One served slice of the theta line, ordered highest-quality first. */
export interface ThetaSegment {
  name: string
  /** Purchaser mass served, in the same units as the total mass N. */
  mass: number
  /** True for the leader / frontier segment (top of the theta line). */
  frontier: boolean
}

export interface ThetaStripProps {
  segments: ThetaSegment[]
  /** Total purchaser mass N (full length of the theta line). */
  N: number
  /** Upper bound of willingness to pay, thetaMax. */
  thetaMax: number
  /** Willingness-to-pay of the marginal (lowest served) purchaser. */
  marginalTheta: number
}

const fmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))

export function ThetaStrip({ segments, N, thetaMax, marginalTheta }: ThetaStripProps) {
  const servedMass = segments.reduce((s, seg) => s + seg.mass, 0)
  const unserved = Math.max(0, N - servedMass)

  // The strip runs from thetaMax (left, highest WTP) down to 0 (right). Widths
  // are shares of the total mass N.
  const pct = (m: number) => `${(100 * m) / N}%`

  return (
    <div className="chart-frame" role="img" aria-label={
      `Theta-line segmentation: ${segments.length} served slice(s) covering ${fmt(servedMass)} of ` +
      `${fmt(N)} purchasers; the marginal served purchaser has willingness-to-pay ${fmt(marginalTheta)}.`
    }>
      <div className="chart-caption">Which purchasers get served, by willingness-to-pay</div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 40,
          border: '1px solid var(--line)',
          borderRadius: 6,
          overflow: 'hidden',
          fontSize: '0.72rem',
          fontWeight: 700,
        }}
      >
        {segments.map((seg) => (
          <div
            key={seg.name}
            title={`${firmDisplayName(seg.name)}: ${fmt(seg.mass)} purchasers`}
            style={{
              width: pct(seg.mass),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              background: seg.frontier ? 'var(--frontier)' : 'var(--muted)',
              opacity: seg.frontier ? 1 : 0.55,
            }}
          >
            {seg.mass / N > 0.08 ? firmDisplayName(seg.name) : ''}
          </div>
        ))}
        {unserved > 1e-6 && (
          <div
            title={`Unserved: ${fmt(unserved)} purchasers`}
            style={{
              width: pct(unserved),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 5px, var(--line) 5px, var(--line) 6px)',
            }}
          >
            {unserved / N > 0.1 ? 'unserved' : ''}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: '0.72rem',
          color: 'var(--muted)',
        }}
      >
        <span><VarTerm def={varDefs.theta} label="θ (willingness to pay)">θ</VarTerm> = {fmt(thetaMax)} (highest WTP)</span>
        <span>marginal served <VarTerm def={varDefs.theta} label="θ (willingness to pay)">θ</VarTerm> = {fmt(marginalTheta)}</span>
        <span>θ = 0</span>
      </div>
      <div className="chart-legend">
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--frontier)' }} />
          frontier segment — highest-value purchasers (served by the leading lab)
        </span>
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--muted)', opacity: 0.55 }} />
          rest of the served market
        </span>
        <span>
          <span
            className="chart-legend-swatch"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 3px, var(--line) 3px, var(--line) 4px)',
              border: '1px solid var(--line)',
            }}
          />
          unserved
        </span>
      </div>
    </div>
  )
}
