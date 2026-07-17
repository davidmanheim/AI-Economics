// M2 (plan §4.3a-iii): a small K–n phase plot. The binding-capacity threshold
//   K = a * n (A - b - a c) / (B (n+1))
// (paper app:cournot / Proposition capacity-neutrality) separates the plane into
// a binding region (below the curve — compute is scarce, a scarcity rent exists)
// and a slack region (above the curve — r* = c, no scarcity rent). The current
// (n, K) parameter point is marked so the reader can see which side they are on.
//
// Pure presentational: the threshold formula lives in src/model (bindingThreshold).

import { bindingThreshold } from '../../model/cournot'
import { useChartDims } from './useChartDims'
import { BottomAxis, LeftAxis } from './Axes'
import { scaleLinear } from 'd3-scale'
import { VarLabel } from './VarLabel'
import { varDefs } from './varDefs'

interface BindingRegionPlotProps {
  A: number
  B: number
  a: number
  b: number
  c: number
  /** Current number of labs (marked point). */
  n: number
  /** Current capacity (marked point). */
  K: number
  nMax?: number
  kMin?: number
  kMax?: number
}

const HEIGHT = 300
const MARGIN = { top: 18, right: 18, bottom: 46, left: 52 }

export function BindingRegionPlot({ A, B, a, b, c, n, K, nMax = 8, kMin = 20, kMax = 300 }: BindingRegionPlotProps) {
  const [ref, dims] = useChartDims<HTMLDivElement>({ width: 520, height: HEIGHT })
  const width = dims.width

  const x = scaleLinear().domain([1, nMax]).range([MARGIN.left, width - MARGIN.right])
  const y = scaleLinear().domain([kMin, kMax]).range([HEIGHT - MARGIN.bottom, MARGIN.top])

  // Sample the threshold curve across a fine n grid.
  const steps = 60
  const curve: { nv: number; thr: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const nv = 1 + (nMax - 1) * (i / steps)
    curve.push({ nv, thr: bindingThreshold(A, B, a, b, c, nv) })
  }
  const clampK = (k: number) => Math.min(kMax, Math.max(kMin, k))

  // Binding region = area BELOW the curve (down to kMin).
  const bindingArea =
    `M ${x(1)},${y(kMin)} ` +
    curve.map((p) => `L ${x(p.nv)},${y(clampK(p.thr))}`).join(' ') +
    ` L ${x(nMax)},${y(kMin)} Z`
  // Slack region = area ABOVE the curve (up to kMax).
  const slackArea =
    `M ${x(1)},${y(kMax)} ` +
    curve.map((p) => `L ${x(p.nv)},${y(clampK(p.thr))}`).join(' ') +
    ` L ${x(nMax)},${y(kMax)} Z`
  const curveLine = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.nv)},${y(clampK(p.thr))}`).join(' ')

  const nClamped = Math.min(nMax, Math.max(1, n))
  const kClamped = clampK(K)
  // Exact capacity threshold at the CURRENT number of labs: capacity binds while
  // K < kThresholdAtN and goes slack at/above it. This is the K the reader can
  // "watch cross" — marked directly on the curve above/below the current point.
  const kThresholdAtN = bindingThreshold(A, B, a, b, c, n)
  const kThresholdPlot = clampK(kThresholdAtN)
  const thresholdInView = kThresholdAtN >= kMin && kThresholdAtN <= kMax
  const isBinding = K < kThresholdAtN
  const summary = `Phase plot of capacity K against number of labs n. Current point n=${n}, K=${Math.round(K)} is in the ${
    isBinding ? 'binding (scarce)' : 'slack (abundant)'
  } region; capacity flips at K* ≈ ${Math.round(kThresholdAtN)} for n=${n}.`
  // Label the threshold curve near its mid-span, clear of the region labels.
  const mid = curve[Math.round(steps * 0.5)]

  return (
    <div className="chart-frame" ref={ref}>
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={summary}>
        <path d={slackArea} fill="var(--muted)" opacity={0.16} />
        <path d={bindingArea} fill="var(--accent)" opacity={0.16} />
        <path d={curveLine} fill="none" stroke="var(--accent)" strokeWidth={2} />

        {/* Name the threshold curve itself, so the line reads as "the flip line". */}
        <text
          x={x(mid.nv)}
          y={y(clampK(mid.thr)) - 7}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={800}
          fill="var(--accent)"
          style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3 }}
        >
          K* binding threshold
        </text>

        {/* Dashed connector from the current point to the exact threshold at this
            n, plus a ring marker where the flip happens — the "watch it cross". */}
        <line
          x1={x(nClamped)}
          y1={y(kClamped)}
          x2={x(nClamped)}
          y2={y(kThresholdPlot)}
          stroke="var(--ink)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.55}
        />
        <circle cx={x(nClamped)} cy={y(kThresholdPlot)} r={5} fill="var(--paper)" stroke="var(--accent)" strokeWidth={2}>
          <title>{`Capacity flips here: K* ≈ ${Math.round(kThresholdAtN)} at n=${n}`}</title>
        </circle>
        <text
          x={x(nClamped) + 10}
          y={y(kThresholdPlot) + (thresholdInView ? 4 : isBinding ? 14 : -6)}
          fontSize={10.5}
          fontWeight={800}
          fill="var(--accent)"
          style={{ paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: 3 }}
        >
          K* ≈ {Math.round(kThresholdAtN)}
        </text>

        {/* Region labels. */}
        <VarLabel def={varDefs.scarcityRent} label="scarcity rent" x={x(nMax) - 6} y={y(kMin) - 10} textAnchor="end" fontSize={11} fontWeight={800} fill="var(--accent)">
          BINDING · scarcity rent &gt; 0
        </VarLabel>
        <VarLabel def={varDefs.rStar} label="r* (compute price)" x={x(1) + 6} y={y(kMax) + 14} textAnchor="start" fontSize={11} fontWeight={800} fill="var(--muted)">
          SLACK · r* = c
        </VarLabel>

        <BottomAxis scale={x} y={HEIGHT - MARGIN.bottom} ticks={nMax - 1} label="Number of labs, n" labelDef={varDefs.n} />
        <LeftAxis scale={y} x={MARGIN.left} ticks={5} label="Capacity, K" labelDef={varDefs.K} />

        {/* Current parameter point. */}
        <circle cx={x(nClamped)} cy={y(kClamped)} r={6} fill="var(--ink)" stroke="#fff" strokeWidth={2}>
          <title>{summary}</title>
        </circle>
        <text x={x(nClamped) + 10} y={y(kClamped) - 8} fontSize={11} fontWeight={700} fill="var(--ink)">
          n={n}, K={Math.round(K)}
        </text>
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--accent)', opacity: 0.4 }} />
          Binding (compute scarce)
        </span>
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--muted)', opacity: 0.4 }} />
          Slack (compute abundant)
        </span>
        <span>
          <span className="chart-legend-swatch" style={{ background: 'var(--ink)' }} />
          Current parameters
        </span>
        <span>
          <span
            className="chart-legend-swatch"
            style={{ background: 'var(--paper)', border: '2px solid var(--accent)' }}
          />
          Threshold K* at this n
        </span>
      </div>
    </div>
  )
}
