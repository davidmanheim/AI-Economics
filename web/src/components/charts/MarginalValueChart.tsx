// M1 flagship chart (plan Section 4.1a): each firm's downward-sloping
// marginal-value-per-FLOP schedule v_m(x) drawn side by side over one shared
// compute axis of total width K, with a horizontal water line at c + lambda and
// shaded blocks whose WIDTH is the compute each firm wins.
//
// Pure function of props: data in, SVG out. No model/store imports here, so the
// S8 explorer can reuse the component with its own precomputed inputs. The
// hosting section computes the schedules (which are linear in x, so each block's
// top edge is a straight line from v_m(0) down to the water line) and hands them
// over as `firms`.

import type { Ref } from 'react'
import { scaleLinear } from 'd3-scale'
import { BottomAxis, LeftAxis } from './Axes'
import { useChartDims } from './useChartDims'
import { firmDisplayName } from '../../lib/displayName'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

/** One firm's already-computed schedule for the side-by-side layout. */
export interface MVFirm {
  name: string
  /** CSS colour string for this firm's identity (fill + stroke). */
  color: string
  /** Compute won, x_m (FLOPs) — the width of the firm's block. */
  x: number
  /** Marginal value of the first FLOP, v_m(0). */
  vAt0: number
  /** Compute at which the schedule hits zero, so the linear slope is v_m(0)/chokeX. */
  chokeX: number
  active: boolean
}

/** Optional winner-take-all comparison overlay used by S2. */
export interface MVComparison {
  isWta: boolean
  leaderName: string
  /** Leader's marginal value if it were handed the whole capacity, v_L(K). */
  vLeaderAtK: number
  /** Each follower's best use, v_j(0), the height it would reach on its first FLOP. */
  followerBestUse: { name: string; color: string; v: number }[]
}

export interface MarginalValueChartProps {
  firms: MVFirm[]
  /** Aggregate capacity, the total width of the compute axis. */
  K: number
  /** Physical cost per FLOP, c. */
  c: number
  /** Shadow price lambda; water line sits at c + lambda. */
  lambda: number
  comparison?: MVComparison
}

const fmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))

export function MarginalValueChart({
  firms,
  K,
  c,
  lambda,
  comparison,
}: MarginalValueChartProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 640, height: 360 })
  const width = dims.width
  const height = Math.round(Math.max(300, Math.min(400, width * 0.6)))

  const waterLevel = c + lambda
  const margin = {
    top: 26,
    right: comparison ? 168 : 24,
    bottom: 50,
    left: 58,
  }

  // Leftmost block is the highest-value firm (the leader), so the picture reads
  // left-to-right in the same order the water-filling fills.
  const ordered = [...firms].sort((a, b) => b.vAt0 - a.vAt0)
  const active = ordered.filter((f) => f.active && f.x > 1e-9)

  let cursor = 0
  const blocks = active.map((f) => {
    const start = cursor
    cursor += f.x
    const vAtEnd = f.chokeX > 0 ? f.vAt0 * (1 - f.x / f.chokeX) : waterLevel
    return { firm: f, start, end: cursor, vAtEnd }
  })
  const totalX = cursor

  const maxV = Math.max(
    waterLevel,
    ...firms.map((f) => f.vAt0),
    comparison ? comparison.vLeaderAtK : 0,
    ...(comparison ? comparison.followerBestUse.map((f) => f.v) : []),
  )

  const x = scaleLinear()
    .domain([0, Math.max(K, totalX)])
    .range([margin.left, width - margin.right])
  const y = scaleLinear()
    .domain([0, maxV * 1.08])
    .range([height - margin.bottom, margin.top])

  const baseline = y(0)
  const waterY = y(waterLevel)
  const cY = y(c)
  const plotRight = width - margin.right

  const summary =
    `Marginal value per FLOP for ${active.length} active firm(s), drawn side by side over a ` +
    `capacity of ${fmt(K)}. Water line at c plus lambda equals ${fmt(waterLevel)}.` +
    (comparison
      ? ` Winner-take-all condition currently ${comparison.isWta ? 'holds' : 'fails'}.`
      : '')

  return (
    <div className="chart-frame" ref={ref as Ref<HTMLDivElement>}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
      >
        {/* Scarcity-premium band: the vertical gap between c and c + lambda. */}
        {lambda > 1e-9 && (
          <rect
            x={margin.left}
            y={waterY}
            width={plotRight - margin.left}
            height={cY - waterY}
            fill="var(--accent)"
            opacity={0.1}
          />
        )}

        {/* Per-firm compute blocks: width = compute won, top edge = the linear schedule. */}
        {blocks.map(({ firm, start, end, vAtEnd }) => {
          const x0 = x(start)
          const x1 = x(end)
          const yTop0 = y(firm.vAt0)
          const yTop1 = y(vAtEnd)
          return (
            <g key={firm.name}>
              <polygon
                points={`${x0},${baseline} ${x0},${yTop0} ${x1},${yTop1} ${x1},${baseline}`}
                fill={firm.color}
                opacity={0.18}
              />
              <line
                x1={x0}
                y1={yTop0}
                x2={x1}
                y2={yTop1}
                stroke={firm.color}
                strokeWidth={2.4}
              />
              <line
                x1={x1}
                y1={baseline}
                x2={x1}
                y2={Math.min(yTop1, waterY)}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={(x0 + x1) / 2}
                y={yTop0 - 8}
                textAnchor="middle"
                fill={firm.color}
                fontSize={11}
                fontWeight={700}
              >
                {firmDisplayName(firm.name)}
              </text>
              <text
                x={(x0 + x1) / 2}
                y={baseline + 16}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={10}
              >
                x = {fmt(firm.x)}
              </text>
            </g>
          )
        })}

        {/* Unused capacity when the constraint is slack. */}
        {totalX < K - 1e-6 && (
          <g>
            <rect
              x={x(totalX)}
              y={baseline - 10}
              width={x(K) - x(totalX)}
              height={10}
              fill="var(--muted)"
              opacity={0.22}
            />
            <text
              x={(x(totalX) + x(K)) / 2}
              y={baseline - 16}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize={10}
            >
              unused capacity
            </text>
          </g>
        )}

        {/* Physical-cost reference line c. */}
        <line
          x1={margin.left}
          y1={cY}
          x2={plotRight}
          y2={cY}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <VarLabel def={varDefs.c} label="c (physical cost)" x={plotRight + 4} y={cY + 3} fill="var(--muted)" fontSize={10}>
          c = {fmt(c)}
        </VarLabel>

        {/* Water line at c + lambda. */}
        <line
          x1={margin.left}
          y1={waterY}
          x2={plotRight}
          y2={waterY}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <VarLabel
          def={varDefs.lambda}
          label="λ (scarcity premium)"
          x={margin.left + 4}
          y={waterY - 6}
          fill="var(--accent)"
          fontSize={10}
          fontWeight={700}
        >
          water line c + λ = {fmt(waterLevel)}
        </VarLabel>

        {/* WTA comparison overlay (S2): leader-at-K line vs follower best-use dots. */}
        {comparison && (
          <g>
            <line
              x1={margin.left}
              y1={y(comparison.vLeaderAtK)}
              x2={plotRight}
              y2={y(comparison.vLeaderAtK)}
              stroke="var(--leader)"
              strokeWidth={1.6}
              strokeDasharray="6 4"
            />
            <text
              x={plotRight + 4}
              y={y(comparison.vLeaderAtK) - 5}
              fill="var(--leader)"
              fontSize={10}
              fontWeight={700}
            >
              {firmDisplayName(comparison.leaderName)} v_L(K) = {fmt(comparison.vLeaderAtK)}
            </text>
            {comparison.followerBestUse.map((f, i) => {
              const cx = plotRight + 10 + i * 14
              return (
                <g key={f.name}>
                  <circle cx={cx} cy={y(f.v)} r={4} fill={f.color} />
                  <text
                    x={cx + 8}
                    y={y(f.v) + 3}
                    fill={f.color}
                    fontSize={10}
                    fontWeight={700}
                  >
                    {firmDisplayName(f.name)} v(0) = {fmt(f.v)}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        <BottomAxis scale={x} y={height - margin.bottom} label="compute won (FLOPs), total width K" labelDef={varDefs.K} />
        <LeftAxis scale={y} x={margin.left} label="marginal value / FLOP" labelDef={varDefs.marginalValue} />
      </svg>

      <div className="chart-legend">
        {firms.map((f) => (
          <span key={f.name}>
            <span
              className="chart-legend-swatch"
              style={{ background: f.color, opacity: f.active ? 1 : 0.4 }}
            />
            {firmDisplayName(f.name)}
            {!f.active && ' (unfunded)'}
          </span>
        ))}
        <span>
          <span
            className="chart-legend-swatch"
            style={{ background: 'var(--accent)' }}
          />
          water line c + λ
        </span>
        {lambda > 1e-9 && (
          <span>
            <span
              className="chart-legend-swatch"
              style={{ background: 'var(--accent)', opacity: 0.25 }}
            />
            scarcity premium λ
          </span>
        )}
      </div>
    </div>
  )
}
