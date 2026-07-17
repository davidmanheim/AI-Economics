// M2 (plan §4.3a): the three-segment stacked price bar with a quality-adjusted
// twin. Left bar = nominal purchaser price P, split into physical cost /
// hyperscaler scarcity rent / lab markup (paper Section 7 boxed decomposition).
// Right bar = the quality-adjusted price P/Q, drawn with the hatched-fill
// convention (design distinction 2). A persistent legend distinguishes nominal
// (solid) from quality-adjusted (hatched); colours follow the entity that earns
// each piece and are shared with RentShareBar so "purple = lab, teal =
// hyperscaler" reads consistently across the module.
//
// Pure presentational component: all numbers come from src/model (cournot.ts).

import type { PriceDecomposition } from '../../model/types'
import { useChartDims } from './useChartDims'
import { LeftAxis } from './Axes'
import { scaleLinear } from 'd3-scale'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

interface PriceStackBarProps {
  /** Nominal price decomposition (segments sum to total P). */
  decomposition: PriceDecomposition
  /** Total standardized quality Q of the representative good (for P/Q). */
  quality: number
  /** True when capacity binds (drives a small status chip). */
  binding: boolean
}

interface Segment {
  key: string
  label: string
  /** Compact name shown directly inside the bar band (label is the full name). */
  short: string
  value: number
  color: string
}

const HEIGHT = 300
const MARGIN = { top: 26, right: 16, bottom: 44, left: 46 }
const fmt = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1))

export function PriceStackBar({ decomposition, quality, binding }: PriceStackBarProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 520, height: HEIGHT })
  const width = dims.width
  const innerW = Math.max(120, width - MARGIN.left - MARGIN.right)

  // Clamp tiny negative floats to zero for display only.
  const clamp = (v: number) => (v < 0 ? 0 : v)
  const segments: Segment[] = [
    { key: 'physical', label: 'Physical cost', short: 'Physical cost', value: clamp(decomposition.physicalCost), color: 'var(--muted)' },
    { key: 'scarcity', label: 'Hyperscaler scarcity rent', short: 'Scarcity rent', value: clamp(decomposition.scarcityRent), color: 'var(--accent)' },
    { key: 'markup', label: 'Lab markup', short: 'Lab markup', value: clamp(decomposition.markup), color: 'var(--leader)' },
  ]

  const nominalTotal = segments.reduce((s, g) => s + g.value, 0)
  const q = quality > 0 ? quality : 1
  const qaTotal = nominalTotal / q
  const yMax = Math.max(nominalTotal, qaTotal) * 1.15 || 1

  const y = scaleLinear().domain([0, yMax]).range([HEIGHT - MARGIN.bottom, MARGIN.top])
  const barW = Math.min(96, innerW * 0.3)
  const nominalCx = MARGIN.left + innerW * 0.3
  const qaCx = MARGIN.left + innerW * 0.72
  const base = HEIGHT - MARGIN.bottom

  // Build stacked rects (bottom → top) for a given scale factor (1 = nominal).
  function stack(cx: number, factor: number) {
    let acc = 0
    return segments.map((seg) => {
      const v = seg.value * factor
      const y0 = y(acc)
      const y1 = y(acc + v)
      acc += v
      const h = Math.max(0, y0 - y1 - 2) // 2px surface gap between segments
      return { seg, x: cx - barW / 2, y: y1 + 1, h, w: barW, v }
    })
  }
  const nominalRects = stack(nominalCx, 1)
  const qaRects = stack(qaCx, 1 / q)

  const summary =
    `Nominal price ${fmt(nominalTotal)}: physical cost ${fmt(segments[0].value)}, ` +
    `hyperscaler scarcity rent ${fmt(segments[1].value)}, lab markup ${fmt(segments[2].value)}. ` +
    `Quality-adjusted price P/Q ${fmt(qaTotal)}.`

  return (
    <div className="chart-frame" ref={ref}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <span className="chart-chip">{binding ? 'Capacity binding' : 'Capacity slack'}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={summary}>
        <defs>
          <pattern id="qa-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line className="qa-hatch-line" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>

        <LeftAxis scale={y} x={MARGIN.left} ticks={5} label="Price per output" labelDef={varDefs.P} />

        {/* Nominal bar: solid fills. */}
        {nominalRects.map((r) => (
          <g key={`n-${r.seg.key}`}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.seg.color} rx={2}>
              <title>{`${r.seg.label}: ${fmt(r.v)}`}</title>
            </rect>
            {r.h > 30 ? (
              // Tall band: name + value, stacked and centred vertically.
              <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" fill="#fff">
                <tspan x={r.x + r.w / 2} dy="-0.2em" fontSize={10} fontWeight={600}>{r.seg.short}</tspan>
                <tspan x={r.x + r.w / 2} dy="1.25em" fontSize={11} fontWeight={800}>{fmt(r.v)}</tspan>
              </text>
            ) : r.h > 16 ? (
              // Thin band: value only (full name stays in the hover title).
              <text x={r.x + r.w / 2} y={r.y + r.h / 2} dy="0.32em" textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
                {fmt(r.v)}
              </text>
            ) : null}
          </g>
        ))}
        <VarLabel def={varDefs.P} label="P (nominal price)" x={nominalCx} y={y(nominalTotal) - 8} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--ink)">
          P = {fmt(nominalTotal)}
        </VarLabel>
        <text x={nominalCx} y={base + 20} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">
          Nominal
        </text>

        {/* Quality-adjusted twin: faded fill + hatch overlay (currentColor). */}
        {qaRects.map((r) => (
          <g key={`q-${r.seg.key}`}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.seg.color} opacity={0.22} rx={2} />
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#qa-hatch)" rx={2} style={{ color: r.seg.color }}>
              <title>{`${r.seg.label} (quality-adjusted): ${fmt(r.v)}`}</title>
            </rect>
          </g>
        ))}
        <VarLabel def={varDefs.qualityAdjustedPrice} label="P/Q (quality-adjusted price)" x={qaCx} y={y(qaTotal) - 8} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--ink)">
          P/Q = {fmt(qaTotal)}
        </VarLabel>
        <text x={qaCx} y={base + 20} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">
          Quality-adjusted
        </text>
      </svg>

      {/* Visually-hidden data table: the exact numbers a sighted reader gets off
          the two bars, exposed to assistive tech. Kept a SIBLING of the role="img"
          SVG (not a child) so screen readers don't fold it into the image. */}
      <table className="sr-only">
        <caption>{`Price decomposition. Capacity is currently ${binding ? 'binding' : 'slack'}.`}</caption>
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Nominal price P</th>
            <th scope="col">Quality-adjusted P/Q</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              <td>{fmt(s.value)}</td>
              <td>{fmt(s.value / q)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{fmt(nominalTotal)}</td>
            <td>{fmt(qaTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div className="chart-legend" aria-hidden="true">
        {segments.map((s) => (
          <span key={s.key}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="chart-legend" aria-hidden="true" style={{ marginTop: 4 }}>
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--muted)' }} />
          Solid = nominal price P
        </span>
        <span>
          <span
            className="chart-legend-swatch"
            style={{ background: 'repeating-linear-gradient(45deg, var(--muted) 0 1.5px, transparent 1.5px 4px)' }}
          />
          Hatched = quality-adjusted P/Q
        </span>
      </div>
    </div>
  )
}
