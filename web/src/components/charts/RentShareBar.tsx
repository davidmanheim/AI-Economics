// M2 (plan §4.3): the canonical SHARES chart for the module. A 100%-normalized
// horizontal bar showing how total producer surplus (everything above physical
// cost) divides between laboratories and hyperscalers. This chart owns design
// distinction 1: it carries a permanent "SHARES, not levels" caption and never
// prints a level (currency-ish) number — only percentages. Colours match
// PriceStackBar (purple = lab, teal = hyperscaler) so identity is consistent.
//
// The section passes shares already normalized to [0,1]; this component only
// renders them, so it cannot accidentally mix levels with shares.

import { useChartDims } from './useChartDims'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

interface RentShareBarProps {
  /** Laboratories' share of producer surplus, in [0, 1]. */
  labShare: number
  /** Hyperscalers' share of producer surplus, in [0, 1]. */
  hyperShare: number
}

const HEIGHT = 132
const MARGIN = { top: 20, right: 16, bottom: 44, left: 16 }
const pct = (v: number) => `${Math.round(v * 100)}%`

export function RentShareBar({ labShare, hyperShare }: RentShareBarProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 520, height: HEIGHT })
  const width = dims.width
  const innerW = Math.max(120, width - MARGIN.left - MARGIN.right)
  const total = labShare + hyperShare
  const lab = total > 0 ? labShare / total : 0
  const hyper = total > 0 ? hyperShare / total : 0

  const barY = MARGIN.top
  const barH = 40
  const labW = innerW * lab
  const hyperW = innerW * hyper
  const gap = lab > 0 && hyper > 0 ? 2 : 0 // 2px surface gap between segments

  const summary = `Producer-surplus shares: laboratories ${pct(lab)}, hyperscalers ${pct(hyper)}.`

  return (
    <div className="chart-frame" ref={ref}>
      <p className="chart-caption">Shares of producer surplus — not levels</p>
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={summary}>
        {/* Lab segment (purple). */}
        {lab > 0 && (
          <g>
            <rect x={MARGIN.left} y={barY} width={Math.max(0, labW - gap)} height={barH} fill="var(--leader)" rx={2}>
              <title>{`Laboratories: ${pct(lab)} of producer surplus`}</title>
            </rect>
            {labW > 42 && (
              <text x={MARGIN.left + labW / 2} y={barY + barH / 2} dy="0.32em" textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>
                {pct(lab)}
              </text>
            )}
          </g>
        )}
        {/* Hyperscaler segment (teal). */}
        {hyper > 0 && (
          <g>
            <rect x={MARGIN.left + labW} y={barY} width={Math.max(0, hyperW)} height={barH} fill="var(--accent)" rx={2}>
              <title>{`Hyperscalers: ${pct(hyper)} of producer surplus`}</title>
            </rect>
            {hyperW > 42 && (
              <text x={MARGIN.left + labW + hyperW / 2} y={barY + barH / 2} dy="0.32em" textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>
                {pct(hyper)}
              </text>
            )}
          </g>
        )}
        {/* Axis: a plain 0–100% scale label under the bar. */}
        <text x={MARGIN.left} y={barY + barH + 20} textAnchor="start" fontSize={11} fill="var(--muted)">
          0%
        </text>
        <text x={MARGIN.left + innerW} y={barY + barH + 20} textAnchor="end" fontSize={11} fill="var(--muted)">
          100%
        </text>
        <VarLabel def={varDefs.producerSurplus} label="producer surplus" x={MARGIN.left + innerW / 2} y={barY + barH + 20} textAnchor="middle" className="chart-axis-label">
          % of producer surplus above physical cost
        </VarLabel>
      </svg>
      {/* Visually-hidden data table (sibling of the role="img" SVG, not a child):
          the two shares a sighted reader sees printed in the bar. */}
      <table className="sr-only">
        <caption>Shares of producer surplus above physical cost — not levels.</caption>
        <thead>
          <tr>
            <th scope="col">Party</th>
            <th scope="col">Share of producer surplus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Laboratories</th>
            <td>{pct(lab)}</td>
          </tr>
          <tr>
            <th scope="row">Hyperscalers</th>
            <td>{pct(hyper)}</td>
          </tr>
        </tbody>
      </table>
      <div className="chart-legend" aria-hidden="true">
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--leader)' }} />
          Laboratories
        </span>
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--accent)' }} />
          Hyperscalers
        </span>
      </div>
    </div>
  )
}
