// S4 (plan §4.4a): a vertical "price ladder" for a trailing laboratory. Three
// rungs mark the firm's cash cost, its economic opportunity cost (the market
// value of the compute), and its average total cost. The firm's price p_j is
// draggable up and down the ladder (pointer drag on the handle, plus a slider in
// the host section for keyboard use); the diagram labels which of the paper's
// four regimes the current price sits in (Section 9, sec:trailing-labs).
//
// Rung values are computed in the host section from the model; this component is
// presentational and reports drags back through onChange.

import { useRef } from 'react'
import { useChartDims } from './useChartDims'
import { LeftAxis } from './Axes'
import { scaleLinear } from 'd3-scale'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

export interface LadderRungs {
  /** Marginal cash cost per output, r_j + b_j/a_j. */
  cash: number
  /** Economic opportunity cost per output, r* + b_j/a_j. */
  opportunity: number
  /** Average total cost per output (cash + amortized fixed cost). */
  averageTotal: number
}

interface LadderDiagramProps {
  price: number
  rungs: LadderRungs
  min: number
  max: number
  onChange: (price: number) => void
}

interface Regime {
  key: string
  label: string
  meaning: string
  color: string
}

const HEIGHT = 340
const MARGIN = { top: 20, right: 20, bottom: 24, left: 54 }
const fmt = (v: number) => v.toFixed(1)

export function classifyRegime(price: number, rungs: LadderRungs): Regime {
  if (price < rungs.cash)
    return {
      key: 'below-cash',
      label: 'Below marginal cash cost',
      meaning: 'Every output loses cash — loss-leading, rational only if staying in the game pays off later.',
      color: '#d84a2f', // vermillion: legible as text on both light and dark backgrounds
    }
  if (price < rungs.opportunity)
    return {
      key: 'below-opp',
      label: 'Below opportunity cost',
      meaning: 'Cash-positive, but the compute would earn more sold to the frontier — value is burning quietly.',
      color: 'var(--frontier)',
    }
  if (price < rungs.averageTotal)
    return {
      key: 'below-atc',
      label: 'Below average total cost',
      meaning: 'Above cash and opportunity cost, but not recovering historical training and overhead — ordinary for a young firm.',
      color: 'var(--leader)',
    }
  return {
    key: 'viable',
    label: 'Fully viable',
    meaning: 'Price covers cash cost, the opportunity cost of compute, and historical fixed costs.',
    color: 'var(--accent)',
  }
}

export function LadderDiagram({ price, rungs, min, max, onChange }: LadderDiagramProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 460, height: HEIGHT })
  const width = dims.width
  const svgRef = useRef<SVGSVGElement | null>(null)
  const draggingRef = useRef(false)

  const y = scaleLinear().domain([min, max]).range([HEIGHT - MARGIN.bottom, MARGIN.top]).clamp(true)
  const ladderX = MARGIN.left + 20
  const ladderRight = width - MARGIN.right
  const regime = classifyRegime(price, rungs)

  const rungList = [
    { key: 'cash', label: 'Cash cost', value: rungs.cash, dash: '4 3', def: varDefs.cashCost, defLabel: 'cash cost' },
    { key: 'opportunity', label: 'Opportunity cost (r*)', value: rungs.opportunity, dash: '4 3', def: varDefs.opportunityCost, defLabel: 'opportunity cost (r*)' },
    { key: 'averageTotal', label: 'Average total cost', value: rungs.averageTotal, dash: '2 4', def: varDefs.averageTotalCost, defLabel: 'average total cost' },
  ]

  function priceFromEvent(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return price
    const rect = svg.getBoundingClientRect()
    // Map screen Y into the viewBox's Y (viewBox height = HEIGHT).
    const vbY = ((clientY - rect.top) / rect.height) * HEIGHT
    return y.invert(vbY)
  }
  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    onChange(priceFromEvent(e.clientY))
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    onChange(priceFromEvent(e.clientY))
  }
  function onPointerUp() {
    draggingRef.current = false
  }

  const py = y(price)
  const summary = `Trailing lab price ${fmt(price)} per output is ${regime.label.toLowerCase()}. Cash cost ${fmt(
    rungs.cash,
  )}, opportunity cost ${fmt(rungs.opportunity)}, average total cost ${fmt(rungs.averageTotal)}.`

  return (
    <div className="chart-frame" ref={ref}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={summary}
        style={{ touchAction: 'none', cursor: 'ns-resize' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <LeftAxis scale={y} x={MARGIN.left} ticks={5} label="Price per output" labelDef={varDefs.pj} />

        {/* The ladder pole. */}
        <line x1={ladderX} x2={ladderX} y1={y(min)} y2={y(max)} stroke="var(--line)" strokeWidth={2} />

        {/* Rungs. */}
        {rungList.map((r) => (
          <g key={r.key}>
            <line
              x1={ladderX}
              x2={ladderRight}
              y1={y(r.value)}
              y2={y(r.value)}
              stroke="var(--muted)"
              strokeWidth={1.5}
              strokeDasharray={r.dash}
            />
            <VarLabel def={r.def} label={r.defLabel} x={ladderRight} y={y(r.value) - 5} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--muted)">
              {r.label} · {fmt(r.value)}
            </VarLabel>
          </g>
        ))}

        {/* Current price handle. */}
        <line x1={ladderX} x2={ladderRight} y1={py} y2={py} stroke={regime.color} strokeWidth={2.5} />
        <circle cx={ladderX} cy={py} r={9} fill={regime.color} stroke="#fff" strokeWidth={2.5} style={{ cursor: 'grab' }}>
          <title>{summary}</title>
        </circle>
        <VarLabel def={varDefs.pj} label="pⱼ (trailing-lab price)" x={ladderX + 14} y={py - 8} fontSize={12} fontWeight={800} fill={regime.color}>
          p_j = {fmt(price)}
        </VarLabel>
      </svg>

      {/* Visually-hidden data table (sibling of the role="img" SVG, not a child):
          the three rung values and the current price, which sighted readers read
          straight off the ladder. */}
      <table className="sr-only">
        <caption>{`Trailing-lab price ladder. Current price p_j = ${fmt(price)} is ${regime.label.toLowerCase()}.`}</caption>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Price per output</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Cash cost</th>
            <td>{fmt(rungs.cash)}</td>
          </tr>
          <tr>
            <th scope="row">Opportunity cost (r*)</th>
            <td>{fmt(rungs.opportunity)}</td>
          </tr>
          <tr>
            <th scope="row">Average total cost</th>
            <td>{fmt(rungs.averageTotal)}</td>
          </tr>
          <tr>
            <th scope="row">Current price p_j</th>
            <td>{fmt(price)}</td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          marginTop: 8,
          padding: '10px 14px',
          borderLeft: `3px solid ${regime.color}`,
          background: 'var(--surface)',
          borderRadius: 6,
        }}
      >
        <strong style={{ color: regime.color }}>{regime.label}</strong>
        <p style={{ margin: '4px 0 0', fontSize: '.92rem', color: 'var(--muted)' }}>{regime.meaning}</p>
      </div>
    </div>
  )
}
