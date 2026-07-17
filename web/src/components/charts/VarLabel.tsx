// One reusable tooltip primitive for chart variable symbols and axis labels,
// in two flavours that share the same behaviour and definitions:
//
//   <VarLabel>  — an SVG <text> element (drop-in for the plain <text> labels
//                 inside chart <svg>s). On hover OR keyboard focus it shows a
//                 small popover via <foreignObject>, styled with .chart-var-popover
//                 (same dark surface / light text as the prose .term-popover, and
//                 theme-aware in dark mode through the CSS custom properties).
//
//   <VarTerm>   — an inline HTML <span> for the chart components that render in
//                 HTML rather than SVG (ThetaStrip, RoutingTable, PriceStackBar's
//                 legend). It reuses the existing .term-popover look directly.
//
// Both are keyboard-accessible: the trigger is focusable (tabIndex 0), carries an
// aria-label of "symbol: definition" so screen readers announce it on focus, and
// shows the visible popover on focus as well as hover. Definitions come from
// varDefs.ts (which reuses glossary entries where they exist).

import { type ReactNode, type SVGProps, useState } from 'react'

interface VarLabelProps extends SVGProps<SVGTextElement> {
  /** Plain-language definition shown in the popover. */
  def: string
  /** Short accessible name for the symbol (defaults to nothing, so aria = def). */
  label?: string
  /** Popover anchor overrides, for labels whose <text> carries its own transform
   *  (e.g. a rotated axis label) so x/y can't be read for placement. */
  popX?: number
  popY?: number
  children: ReactNode
}

// Popover box drawn in SVG user units. Charts use viewBox width == rendered
// width, so one unit ≈ one CSS pixel; this box holds ~5 short lines.
const BOX_W = 240
const BOX_H = 132

export function VarLabel({ def, label, popX, popY, children, ...textProps }: VarLabelProps) {
  const [open, setOpen] = useState(false)
  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  const nx = popX ?? toNum(textProps.x)
  const ny = popY ?? toNum(textProps.y)
  const anchor = popX != null ? 'middle' : textProps.textAnchor
  const rawFx = anchor === 'end' ? nx - BOX_W : anchor === 'middle' ? nx - BOX_W / 2 : nx
  // Rotated left-axis labels anchor near x=0, which would push a centered box off
  // the left edge (clipped in any ancestor that doesn't allow overflow). Clamp so
  // the popover always starts on the canvas.
  const fx = Math.max(4, rawFx)
  const above = ny - BOX_H - 8
  const fy = above < 0 ? ny + 14 : above

  return (
    <g>
      <text
        {...textProps}
        tabIndex={0}
        role="img"
        aria-label={label ? `${label}: ${def}` : def}
        className={['var-label', textProps.className].filter(Boolean).join(' ')}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </text>
      {open && (
        <foreignObject x={fx} y={fy} width={BOX_W} height={BOX_H} style={{ pointerEvents: 'none' }}>
          <div className="chart-var-popover">{def}</div>
        </foreignObject>
      )}
    </g>
  )
}

interface VarTermProps {
  def: string
  label?: string
  children: ReactNode
}

/** Inline HTML sibling of VarLabel for chart components rendered in HTML. */
export function VarTerm({ def, label, children }: VarTermProps) {
  const [open, setOpen] = useState(false)
  const show = () => setOpen(true)
  const hide = () => setOpen(false)
  return (
    <span className="term-wrap">
      <span
        className="var-term"
        tabIndex={0}
        role="img"
        aria-label={label ? `${label}: ${def}` : def}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open && (
        <span className="term-popover" role="tooltip">
          {def}
        </span>
      )}
    </span>
  )
}

function toNum(v: SVGProps<SVGTextElement>['x']): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? 0))
  return Number.isFinite(n) ? n : 0
}
