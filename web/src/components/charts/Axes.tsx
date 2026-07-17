import type { ScaleLinear } from 'd3-scale'
import { VarLabel } from './VarLabel'

interface AxisProps {
  scale: ScaleLinear<number, number>
  ticks?: number
  format?: (value: number) => string
  label?: string
  /** If given, the axis label becomes a hover/focus tooltip with this definition. */
  labelDef?: string
}

interface BottomAxisProps extends AxisProps {
  y: number
}

interface LeftAxisProps extends AxisProps {
  x: number
}

const defaultFormat = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

/** Horizontal axis rendered along y, ticks pointing down. Pure SVG, no DOM measurement. */
export function BottomAxis({ scale, y, ticks = 5, format = defaultFormat, label, labelDef }: BottomAxisProps) {
  const [x0, x1] = scale.range()
  return (
    <g className="chart-axis chart-axis-bottom">
      <line x1={x0} x2={x1} y1={y} y2={y} />
      {scale.ticks(ticks).map((t) => (
        <g key={t} transform={`translate(${scale(t)},${y})`}>
          <line y2={6} />
          <text y={18} textAnchor="middle">{format(t)}</text>
        </g>
      ))}
      {label &&
        (labelDef ? (
          <VarLabel def={labelDef} label={label} x={(x0 + x1) / 2} y={y + 38} textAnchor="middle" className="chart-axis-label">
            {label}
          </VarLabel>
        ) : (
          <text x={(x0 + x1) / 2} y={y + 38} textAnchor="middle" className="chart-axis-label">
            {label}
          </text>
        ))}
    </g>
  )
}

/** Vertical axis rendered along x, ticks pointing left. */
export function LeftAxis({ scale, x, ticks = 5, format = defaultFormat, label, labelDef }: LeftAxisProps) {
  const [y1, y0] = scale.range()
  const midY = (y0 + y1) / 2
  return (
    <g className="chart-axis chart-axis-left">
      <line x1={x} x2={x} y1={y0} y2={y1} />
      {scale.ticks(ticks).map((t) => (
        <g key={t} transform={`translate(${x},${scale(t)})`}>
          <line x2={-6} />
          <text x={-10} dy="0.32em" textAnchor="end">{format(t)}</text>
        </g>
      ))}
      {label &&
        (labelDef ? (
          <VarLabel
            def={labelDef}
            label={label}
            popX={x - 42}
            popY={midY}
            transform={`translate(${x - 42},${midY}) rotate(-90)`}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {label}
          </VarLabel>
        ) : (
          <text
            transform={`translate(${x - 42},${midY}) rotate(-90)`}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {label}
          </text>
        ))}
    </g>
  )
}
