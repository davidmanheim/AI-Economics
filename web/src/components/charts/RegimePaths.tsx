// M4 (plan §4.6a): three-regime comparison. Pure presentational chart —
// data in, SVG out; NO model imports. The host section (S6Regimes) runs the
// model (regimes.ts) and hands each regime a `RegimePanel` of chart-ready points.
//
// Per active regime, two vertically-linked charts share a time axis:
//   (top)    q_L and q_F productivity paths plus their ratio (right axis);
//   (bottom) the three nominal price components as a stacked area (physical
//            cost / hyperscaler scarcity rent / lab markup) with the
//            quality-adjusted price drawn as a hatched twin line on a right
//            axis (design distinction 2, .qa-hatch-line).
// Plus end-state summary cards per regime.

import { scaleLinear, type ScaleLinear } from 'd3-scale'
import { area as d3area, line as d3line, curveMonotoneX } from 'd3-shape'
import { BottomAxis, LeftAxis } from './Axes'
import { useChartDims } from './useChartDims'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

export type RegimeKey = 'common' | 'firm-specific' | 'continuing'

/** One time step, already reduced to what the charts draw. */
export interface RegimePricePoint {
  t: number
  qLeader: number
  qFollower: number
  /** Productivity ratio q_L / q_F. */
  ratio: number
  /** Physical cost component b_L + a_L c. */
  physicalCost: number
  /** Hyperscaler scarcity-rent component a_L (r - c). */
  scarcityRent: number
  /** Lab markup component mu_L. */
  markup: number
  /** Quality-adjusted purchaser price P_L / Q_L. */
  qualityAdjustedPrice: number
}

export interface RegimePanel {
  key: RegimeKey
  label: string
  points: RegimePricePoint[]
  /** End-state cards, mirroring the paper's Section 11.4 comparison. */
  summary: { edge: string; markup: string; rent: string }
  /** Design distinction 4: firm-specific asymptotes = durable leadership. */
  leadership: 'temporary' | 'durable'
}

interface RegimePathsProps {
  panels: RegimePanel[]
  active: RegimeKey
  onSelect: (key: RegimeKey) => void
}

const COMPONENT_COLORS = {
  physicalCost: 'var(--muted)',
  scarcityRent: 'var(--frontier)',
  markup: 'var(--leader)',
} as const

const PAD = { top: 14, right: 52, bottom: 34, left: 48 }
const TOP_H = 190
const BOT_H = 210

interface Band {
  t: number
  y0: number
  y1: number
}

const REGIME_CSS = `
.regime-paths { margin-top: 20px; }
.regime-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.regime-tab { cursor: pointer; border: 1px solid var(--line); background: var(--surface);
  color: var(--muted); border-radius: 999px; padding: 7px 16px; font-size: .85rem; font-weight: 600; }
.regime-tab:hover { border-color: var(--accent); color: var(--accent); }
.regime-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.regime-paths .chart-caption { margin-top: 18px; }
.regime-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
.regime-card { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px;
  background: var(--surface); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 6px; }
.regime-card-title { font-size: .72rem; text-transform: uppercase; letter-spacing: .07em;
  color: var(--muted); font-weight: 700; }
.regime-card-value { font-size: 1.15rem; letter-spacing: -.02em; color: var(--ink); }
.regime-card-tag { align-self: flex-start; font-size: .68rem; font-weight: 700; padding: 2px 8px;
  border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
.regime-card-tag-durable { background: var(--leader); color: #fff; }
.regime-card-tag-temporary { background: var(--accent-pale); color: var(--accent);
  border: 1px dashed var(--leader); }
@media (max-width: 640px) { .regime-cards { grid-template-columns: 1fr; } }
`


export function RegimePaths({ panels, active, onSelect }: RegimePathsProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 640, height: 400 })
  const panel = panels.find((p) => p.key === active) ?? panels[0]
  const pts = panel.points
  const width = Math.max(dims.width, 320)

  const tMax = pts.length ? pts[pts.length - 1].t : 1
  const xScale = scaleLinear()
    .domain([0, tMax])
    .range([PAD.left, width - PAD.right])

  // ----- top chart: quality paths + ratio ---------------------------------
  const qVals = pts.flatMap((p) => [p.qLeader, p.qFollower])
  const qMin = Math.min(...qVals)
  const qMax = Math.max(...qVals)
  const yTop = scaleLinear()
    .domain([Math.min(qMin * 0.95, qMin - 0.05), qMax * 1.05])
    .range([PAD.top + TOP_H - PAD.bottom, PAD.top])
  const ratioMax = Math.max(...pts.map((p) => p.ratio), 1.05)
  const yRatio = scaleLinear()
    .domain([1, ratioMax * 1.02])
    .range([PAD.top + TOP_H - PAD.bottom, PAD.top])

  const qLine = d3line<RegimePricePoint>()
    .x((p) => xScale(p.t))
    .curve(curveMonotoneX)
  const leaderPath = qLine.y((p) => yTop(p.qLeader))(pts) ?? ''
  const followerPath = qLine.y((p) => yTop(p.qFollower))(pts) ?? ''
  const ratioPath =
    d3line<RegimePricePoint>()
      .x((p) => xScale(p.t))
      .y((p) => yRatio(p.ratio))
      .curve(curveMonotoneX)(pts) ?? ''

  // ----- bottom chart: stacked price components + quality-adjusted twin ----
  const nominal = pts.map((p) => p.physicalCost + p.scarcityRent + p.markup)
  const nomMax = Math.max(...nominal, 1e-6)
  const yBot = scaleLinear()
    .domain([0, nomMax * 1.05])
    .range([PAD.top + BOT_H - PAD.bottom, PAD.top])
  const qapMax = Math.max(...pts.map((p) => p.qualityAdjustedPrice), 1e-6)
  const yQap = scaleLinear()
    .domain([0, qapMax * 1.1])
    .range([PAD.top + BOT_H - PAD.bottom, PAD.top])

  const bandPath = (pick: (p: RegimePricePoint) => [number, number]): string => {
    const bands: Band[] = pts.map((p) => {
      const [lo, hi] = pick(p)
      return { t: p.t, y0: lo, y1: hi }
    })
    return (
      d3area<Band>()
        .x((b) => xScale(b.t))
        .y0((b) => yBot(b.y0))
        .y1((b) => yBot(b.y1))
        .curve(curveMonotoneX)(bands) ?? ''
    )
  }
  const physBand = bandPath((p) => [0, p.physicalCost])
  const rentBand = bandPath((p) => [p.physicalCost, p.physicalCost + p.scarcityRent])
  const markBand = bandPath((p) => [
    p.physicalCost + p.scarcityRent,
    p.physicalCost + p.scarcityRent + p.markup,
  ])
  const qapPath =
    d3line<RegimePricePoint>()
      .x((p) => xScale(p.t))
      .y((p) => yQap(p.qualityAdjustedPrice))
      .curve(curveMonotoneX)(pts) ?? ''

  // End-state figures for the price-anatomy chart's text alternative: the last
  // period's nominal components + total and the quality-adjusted price, so a
  // screen-reader user gets the numbers a sighted reader reads off the final edge.
  const lastPt = pts.length ? pts[pts.length - 1] : undefined
  const endNominal = lastPt ? lastPt.physicalCost + lastPt.scarcityRent + lastPt.markup : 0
  const priceSummary = lastPt
    ? `By the final period, nominal price is ${endNominal.toFixed(1)} (physical cost ` +
      `${lastPt.physicalCost.toFixed(1)}, scarcity rent ${lastPt.scarcityRent.toFixed(1)}, ` +
      `lab markup ${lastPt.markup.toFixed(1)}) and the quality-adjusted price is ` +
      `${lastPt.qualityAdjustedPrice.toFixed(1)}.`
    : ''

  // Right-axis tick helper (hand-drawn; Axes.tsx only ships left/bottom).
  const rightAxis = (
    scale: ScaleLinear<number, number>,
    x: number,
    fmt: (v: number) => string,
    label: string,
    color: string,
    def?: string,
  ) => {
    const midY = (scale.range()[0] + scale.range()[1]) / 2
    const transform = `translate(${x + 40},${midY}) rotate(90)`
    return (
      <g className="chart-axis">
        <line x1={x} x2={x} y1={scale.range()[0]} y2={scale.range()[1]} />
        {scale.ticks(4).map((tk) => (
          <g key={tk} transform={`translate(${x},${scale(tk)})`}>
            <line x2={6} />
            <text x={10} dy="0.32em" textAnchor="start">
              {fmt(tk)}
            </text>
          </g>
        ))}
        {def ? (
          <VarLabel def={def} label={label} popX={x + 40} popY={midY} transform={transform} textAnchor="middle" className="chart-axis-label" style={{ fill: color }}>
            {label}
          </VarLabel>
        ) : (
          <text transform={transform} textAnchor="middle" className="chart-axis-label" style={{ fill: color }}>
            {label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="regime-paths" ref={ref}>
      <style>{REGIME_CSS}</style>
      <div className="regime-tabs" role="tablist" aria-label="Technological regime">
        {panels.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={p.key === active}
            className={p.key === active ? 'regime-tab active' : 'regime-tab'}
            onClick={() => onSelect(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Top: quality paths + ratio ------------------------------------- */}
      <div className="chart-caption">Productivity paths — leader, follower, and their gap</div>
      <div className="chart-frame">
        <svg viewBox={`0 0 ${width} ${TOP_H}`} role="img" aria-label={
          `Leader and follower quality-adjusted productivity over ${tMax + 1} periods in the ${panel.label} regime; ` +
          `the ratio ${pts.length ? pts[0].ratio.toFixed(2) : ''} moves to ${pts.length ? pts[pts.length - 1].ratio.toFixed(2) : ''}.`
        }>
          <LeftAxis scale={yTop} x={PAD.left} ticks={4} label="productivity q" labelDef={varDefs.q} />
          <BottomAxis scale={xScale} y={PAD.top + TOP_H - PAD.bottom} ticks={6} label="period" labelDef={varDefs.period} />
          {rightAxis(yRatio, width - PAD.right, (v) => `${v.toFixed(2)}×`, 'gap q_L/q_F', 'var(--accent)', varDefs.qualityGap)}
          <path
            d={ratioPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="2 3"
            className={panel.leadership === 'durable' ? 'leadership-durable' : 'leadership-temporary'}
            style={{ stroke: 'var(--accent)' }}
          />
          <path d={followerPath} fill="none" stroke="var(--frontier)" strokeWidth={2} />
          <path d={leaderPath} fill="none" stroke="var(--leader)" strokeWidth={2.4} />
        </svg>
      </div>

      {/* Bottom: price components + quality-adjusted twin --------------- */}
      <div className="chart-caption">
        Purchaser price anatomy — nominal components (stacked) vs quality-adjusted price
      </div>
      <div className="chart-frame">
        <svg viewBox={`0 0 ${width} ${BOT_H}`} role="img" aria-label={
          `Stacked nominal price components (physical cost, scarcity rent, lab markup) and the ` +
          `quality-adjusted price for the leader in the ${panel.label} regime. ${priceSummary}`
        }>
          <defs>
            <pattern id={`qa-hatch-${panel.key}`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={6} height={6} fill="none" />
              <line x1={0} y1={0} x2={0} y2={6} stroke="var(--accent)" strokeWidth={1.4} />
            </pattern>
          </defs>
          <LeftAxis scale={yBot} x={PAD.left} ticks={4} label="price / FLOP" labelDef={varDefs.P} />
          <BottomAxis scale={xScale} y={PAD.top + BOT_H - PAD.bottom} ticks={6} label="period" labelDef={varDefs.period} />
          {rightAxis(yQap, width - PAD.right, (v) => v.toFixed(1), 'quality-adj. price', 'var(--accent)', varDefs.qualityAdjustedPrice)}
          <path d={physBand} fill={COMPONENT_COLORS.physicalCost} fillOpacity={0.45} stroke="none" />
          <path d={rentBand} fill={COMPONENT_COLORS.scarcityRent} fillOpacity={0.5} stroke="none" />
          <path d={markBand} fill={COMPONENT_COLORS.markup} fillOpacity={0.55} stroke="none" />
          {/* quality-adjusted twin: hatched band down to axis + dashed line */}
          <path
            d={`${qapPath} L ${xScale(tMax)} ${yQap(0)} L ${xScale(0)} ${yQap(0)} Z`}
            fill={`url(#qa-hatch-${panel.key})`}
            fillOpacity={0.4}
            stroke="none"
          />
          <path
            d={qapPath}
            className="qa-hatch-line"
            style={{ color: 'var(--accent)' }}
            fill="none"
            strokeDasharray="5 3"
          />
        </svg>
      </div>

      <div className="chart-legend" aria-hidden="true">
        <span><span className="chart-legend-swatch" style={{ background: 'var(--leader)' }} />Leader q / lab markup</span>
        <span><span className="chart-legend-swatch" style={{ background: 'var(--frontier)' }} />Follower q / scarcity rent</span>
        <span><span className="chart-legend-swatch" style={{ background: 'var(--muted)' }} />Physical cost</span>
        <span><span className="chart-legend-swatch" style={{ background: 'var(--accent)' }} />Gap ratio &amp; quality-adjusted price (dashed)</span>
      </div>

      <div className="regime-cards">
        <RegimeCard title="Leader's edge" value={panel.summary.edge} kind={panel.leadership} />
        <RegimeCard title="Lab markup" value={panel.summary.markup} />
        <RegimeCard title="Hyperscaler rent" value={panel.summary.rent} />
      </div>
    </div>
  )
}

function RegimeCard({
  title,
  value,
  kind,
}: {
  title: string
  value: string
  kind?: 'temporary' | 'durable'
}) {
  return (
    <div className="regime-card">
      <span className="regime-card-title">{title}</span>
      <strong className="regime-card-value">{value}</strong>
      {kind && (
        <span className={`regime-card-tag regime-card-tag-${kind}`}>
          {kind === 'durable' ? 'durable leadership' : 'temporary leadership'}
        </span>
      )}
    </div>
  )
}
