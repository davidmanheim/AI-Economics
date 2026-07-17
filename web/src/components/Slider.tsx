import { useState } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  /** Optional plain-language definition; when set, the label text becomes a
   *  hover/keyboard-focus tooltip (same .term-popover look as the prose glossary
   *  and chart variable labels). Omit it and the slider renders exactly as before. */
  def?: string
}

export function Slider({ label, value, min, max, step = 1, onChange, format, def }: SliderProps) {
  // Human-readable current value: the same string the visible <output> shows, so
  // a screen reader (via aria-valuetext) is never told less than a sighted user
  // sees. Falls back to the plain number when no formatter is supplied.
  const valueText = format ? format(value) : String(value)
  return (
    <label className="slider">
      <span>
        {def ? <SliderLabel label={label} def={def} /> : label}
        <output>{valueText}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {/* Visible domain: shows the range you're working in without dragging to
          the ends. Formatted with the same `format` prop as the current value so
          the three read consistently (e.g. "$0/mo … $20/mo … $50/mo"). */}
      <span className="slider-domain" aria-hidden="true">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </span>
    </label>
  )
}

// The label-only trigger: a focusable span carrying the dotted-underline "there's
// a definition here" affordance. It wraps ONLY the label text, so the range
// input's own drag/keyboard interaction is untouched. Shows on hover and on
// keyboard focus, matching the site's existing Term / VarTerm popovers.
function SliderLabel({ label, def }: { label: string; def: string }) {
  const [open, setOpen] = useState(false)
  const show = () => setOpen(true)
  const hide = () => setOpen(false)
  return (
    <span className="term-wrap">
      <span
        className="slider-term"
        tabIndex={0}
        role="img"
        aria-label={`${label}: ${def}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {label}
      </span>
      {open && (
        <span className="term-popover" role="tooltip">
          {def}
        </span>
      )}
    </span>
  )
}
