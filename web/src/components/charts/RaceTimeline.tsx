// M3 race-timeline chart (plan §4.5(a)). Three stacked panels sharing a time
// axis:
//   (1) each firm's deployed quality q_l,t as a step function jumping at
//       releases, with the current leadership spell shaded. Whether the lead has
//       (so far in this run) proven DURABLE or merely TEMPORARY is encoded with
//       the shared `.leadership-durable` / `.leadership-temporary` stroke tokens
//       (plan §7.3 distinction 4).
//   (2) a stacked-area chart of each firm's compute share over time.
//   (3) a two-band strip of the per-period rent split (aggregate laboratory
//       differential rent vs. hyperscaler scarcity rent), normalized to 100%
//       each period — a SHARES strip, not levels (plan §7.3 distinction 1).
//
// Pure function of props: data in, SVG out. No model imports (the datum shape is
// declared locally so this file never depends on src/model), no DOM measurement
// beyond the responsive width hook.

import { scaleLinear } from 'd3-scale'
import { area, curveLinear, curveStepAfter, line } from 'd3-shape'
import { max as d3max } from 'd3-array'
import { BottomAxis, LeftAxis } from './Axes'
import { useChartDims } from './useChartDims'
import { firmDisplayName } from '../../lib/displayName'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

/** One simulated period. Structurally satisfied by model `ReleasePeriod`. */
export interface RaceTimelineDatum {
  t: number
  /** Deployed quality per firm (aligned with `firmNames`). */
  q: number[]
  /** Whether each firm shipped a release this period. */
  released: boolean[]
  /** Actual compute share per firm (sums to ~1). */
  actualShares: number[]
  /** Aggregate laboratory differential rent this period. */
  labRent: number
  /** Hyperscaler scarcity rent this period. */
  hyperscalerRent: number
  /** Name of the current leader this period. */
  leader: string
}

export interface RaceTimelineProps {
  periods: RaceTimelineDatum[]
  firmNames: string[]
  /** Per-firm hex colors (aligned with `firmNames`). Defaults match tokens. */
  colors?: string[]
  /**
   * How many leading periods to actually DRAW (playback reveal cursor). The
   * axis domains stay pinned to the full `periods` range so nothing rescales as
   * the reveal grows — only the plotted data does. Omitted (or ≥ length) draws
   * the whole run, which is the default static behaviour.
   */
  revealCount?: number
}

// Palette drawn from the app's design tokens (styles.css :root) via CSS custom
// properties, so the chart reskins automatically in dark mode with no per-chart
// CSS (these resolve inside SVG fill/stroke presentation attributes).
const FIRM_COLORS = ['var(--leader)', 'var(--frontier)', 'var(--accent)', 'var(--muted)']
// The rent-split panel is an AGGREGATE (all labs vs. the hyperscaler), not a
// per-firm readout, so it must not reuse any FIRM_COLORS entry — with three
// firms in play those are leader/frontier/accent, which is exactly what a
// reader's eye has just been trained on in the two panels above. --ink and
// --muted are never assigned to an actual firm here (FIRM_COLORS[3] is a
// spare for a 4th firm that doesn't exist in this model), so they read as
// clearly "structural" rather than "this is secretly about one specific lab."
const LAB_RENT_COLOR = 'var(--ink)' // dark ink — laboratories' aggregate share
const HYPER_RENT_COLOR = 'var(--muted)' // grey — hyperscaler's share

const pct = (v: number) => `${Math.round(v * 100)}%`

interface Spell {
  leader: string
  firmIndex: number
  t0: number
  t1: number
}

/** Contiguous runs of a single leader across the timeline. */
function leadershipSpells(
  periods: RaceTimelineDatum[],
  firmNames: string[],
): Spell[] {
  const spells: Spell[] = []
  for (const p of periods) {
    const prev = spells[spells.length - 1]
    if (prev && prev.leader === p.leader) {
      prev.t1 = p.t
    } else {
      spells.push({
        leader: p.leader,
        firmIndex: Math.max(0, firmNames.indexOf(p.leader)),
        t0: p.t,
        t1: p.t,
      })
    }
  }
  return spells
}

export function RaceTimeline({
  periods,
  firmNames,
  colors,
  revealCount,
}: RaceTimelineProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 720, height: 460 })
  const W = Math.max(320, dims.width)
  const palette = colors ?? FIRM_COLORS

  // Layout ---------------------------------------------------------------
  const marginL = 46
  const marginR = 18
  const top = 16
  const qH = 150
  const shH = 118
  const rentH = 60
  const gap = 40
  const p1y0 = top
  const p1y1 = p1y0 + qH
  const p2y0 = p1y1 + gap
  const p2y1 = p2y0 + shH
  const p3y0 = p2y1 + gap
  const p3y1 = p3y0 + rentH
  const axisY = p3y1
  const H = axisY + 36
  const plotX0 = marginL
  const plotX1 = W - marginR

  if (periods.length === 0) {
    return <div className="chart-frame" ref={ref} />
  }

  // Axis domains are always keyed off the FULL run so playback never rescales
  // the axes; only `shown` (the revealed prefix) is actually drawn.
  const shownCount =
    revealCount == null
      ? periods.length
      : Math.max(1, Math.min(revealCount, periods.length))
  const shown = shownCount >= periods.length ? periods : periods.slice(0, shownCount)
  const isComplete = shown.length >= periods.length

  const tMax = periods[periods.length - 1].t
  const x = scaleLinear().domain([0, tMax]).range([plotX0, plotX1])

  // Panel 1: quality step functions --------------------------------------
  const qMax =
    d3max(periods, (p) => d3max(p.q) ?? 0) ?? 1
  const yQ = scaleLinear().domain([0, qMax * 1.08]).range([p1y1, p1y0]).nice()

  const spells = leadershipSpells(shown, firmNames)
  const durableSoFar = spells.length === 1
  const spellBoundaryClass = durableSoFar
    ? 'leadership-durable'
    : 'leadership-temporary'

  const qualityLine = (i: number) =>
    line<RaceTimelineDatum>()
      .x((d) => x(d.t))
      .y((d) => yQ(d.q[i]))
      .curve(curveStepAfter)(shown) ?? ''

  // Panel 2: stacked compute-share areas ---------------------------------
  const yShare = scaleLinear().domain([0, 1]).range([p2y1, p2y0])
  const shareArea = (i: number) => {
    const pts = shown.map((p) => {
      const lo = p.actualShares.slice(0, i).reduce((s, v) => s + v, 0)
      const hi = lo + (p.actualShares[i] ?? 0)
      return { t: p.t, lo, hi }
    })
    return (
      area<{ t: number; lo: number; hi: number }>()
        .x((d) => x(d.t))
        .y0((d) => yShare(d.lo))
        .y1((d) => yShare(d.hi))
        .curve(curveLinear)(pts) ?? ''
    )
  }

  // Panel 3: rent-split strip (SHARES) -----------------------------------
  const yRent = scaleLinear().domain([0, 1]).range([p3y1, p3y0])
  const rentPts = shown.map((p) => {
    const total = p.labRent + p.hyperscalerRent
    const labFrac = total > 1e-12 ? p.labRent / total : 0.5
    return { t: p.t, labFrac }
  })
  const labBand =
    area<{ t: number; labFrac: number }>()
      .x((d) => x(d.t))
      .y0(() => yRent(0))
      .y1((d) => yRent(d.labFrac))
      .curve(curveLinear)(rentPts) ?? ''
  const hyperBand =
    area<{ t: number; labFrac: number }>()
      .x((d) => x(d.t))
      .y0((d) => yRent(d.labFrac))
      .y1(() => yRent(1))
      .curve(curveLinear)(rentPts) ?? ''

  const summary =
    `Release-race timeline over ${shown.length} of ${periods.length} periods for ${firmNames.length} firms. ` +
    `Current leader ${firmDisplayName(shown[shown.length - 1].leader)}; leadership has been ` +
    `${durableSoFar ? 'durable (has not changed hands)' : `temporary — it changed hands ${spells.length - 1} time(s)`}. ` +
    `Three stacked panels show model quality, compute share, and the laboratory-vs-hyperscaler rent split.`

  return (
    <div className="chart-frame" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {/* Panel 1 — quality + leadership shading */}
        <VarLabel def={varDefs.q} label="q (quality)" x={plotX0} y={p1y0 - 4} className="chart-axis-label">
          Model quality
        </VarLabel>
        {spells.map((s, k) => {
          const xa = x(s.t0)
          const xb =
            k === spells.length - 1
              ? isComplete
                ? plotX1
                : x(shown[shown.length - 1].t)
              : x(s.t1 + 1)
          return (
            <g key={`spell-${k}`}>
              <rect
                x={xa}
                y={p1y0}
                width={Math.max(0, xb - xa)}
                height={p1y1 - p1y0}
                fill={palette[s.firmIndex % palette.length]}
                opacity={0.08}
              />
              <rect
                x={xa}
                y={p1y0}
                width={Math.max(0, xb - xa)}
                height={p1y1 - p1y0}
                className={spellBoundaryClass}
                style={{ stroke: palette[s.firmIndex % palette.length] }}
              />
            </g>
          )
        })}
        {firmNames.map((_, i) => (
          <path
            key={`q-${i}`}
            d={qualityLine(i)}
            fill="none"
            stroke={palette[i % palette.length]}
            strokeWidth={2}
          />
        ))}
        {/* Release markers */}
        {shown.flatMap((p) =>
          p.released.map((r, i) =>
            r ? (
              <circle
                key={`rel-${p.t}-${i}`}
                cx={x(p.t)}
                cy={yQ(p.q[i])}
                r={3.2}
                fill={palette[i % palette.length]}
                stroke="#fffdf9"
                strokeWidth={1}
              />
            ) : null,
          ),
        )}
        <LeftAxis scale={yQ} x={plotX0} ticks={4} />

        {/* Panel 2 — compute shares */}
        <VarLabel def={varDefs.computeShare} label="compute share" x={plotX0} y={p2y0 - 4} className="chart-axis-label">
          Compute share
        </VarLabel>
        {firmNames.map((_, i) => (
          <path
            key={`sh-${i}`}
            d={shareArea(i)}
            fill={palette[i % palette.length]}
            opacity={0.82}
          />
        ))}
        <LeftAxis scale={yShare} x={plotX0} ticks={2} format={pct} />

        {/* Panel 3 — rent split (SHARES, not levels) */}
        <VarLabel def={varDefs.rentSplit} label="rent split" x={plotX0} y={p3y0 - 4} className="chart-axis-label">
          Rent split
        </VarLabel>
        <path d={labBand} fill={LAB_RENT_COLOR} opacity={0.85} />
        <path d={hyperBand} fill={HYPER_RENT_COLOR} opacity={0.85} />
        <LeftAxis scale={yRent} x={plotX0} ticks={2} format={pct} />

        <BottomAxis scale={x} y={axisY} ticks={8} label="Period (t)" labelDef={varDefs.period} />
      </svg>

      <p className="chart-caption">Rent split panel shows SHARES, not levels.</p>

      <div className="chart-legend">
        {firmNames.map((name, i) => (
          <span key={name}>
            <span
              className="chart-legend-swatch"
              style={{ background: palette[i % palette.length] }}
            />
            {firmDisplayName(name)}
          </span>
        ))}
        <span>
          <span
            className="chart-legend-swatch"
            style={{ background: LAB_RENT_COLOR }}
          />
          Laboratory rent
        </span>
        <span>
          <span
            className="chart-legend-swatch"
            style={{ background: HYPER_RENT_COLOR }}
          />
          Hyperscaler rent
        </span>
        <span className="chart-chip">
          Leadership so far: {durableSoFar ? 'durable' : 'temporary (changed hands)'}
        </span>
      </div>
    </div>
  )
}
