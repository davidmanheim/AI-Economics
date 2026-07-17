// Static hero diagram (S0): purchasers -> three model firms -> GPU capacity block.
// Hand-authored SVG, no interactivity. Dot sizes/shades suggest willingness-to-pay
// heterogeneity across purchasers; the capacity block of width K is owned by hyperscalers.

import { firmDisplayName } from '../lib/displayName'
import { VarLabel } from './charts/VarLabel'
import { varDefs } from './charts/varDefs'

// Deterministic purchaser dots: [x, y, theta] with theta in [0,1] driving size + shade.
const dots: [number, number, number][] = [
  [26, 40, 0.95], [70, 30, 0.82], [46, 76, 0.7], [96, 66, 0.55], [30, 116, 0.6],
  [78, 108, 0.4], [116, 34, 0.5], [120, 104, 0.33], [54, 150, 0.28], [98, 150, 0.22],
  [24, 190, 0.44], [72, 186, 0.16], [116, 176, 0.12], [40, 226, 0.2], [92, 224, 0.09],
  [130, 208, 0.06], [58, 262, 0.14], [104, 266, 0.05],
]

// Purchaser dot colour: high willingness-to-pay skews toward the frontier accent.
function dotFill(theta: number) {
  return theta > 0.5 ? 'var(--frontier)' : 'var(--accent)'
}

const firms = [
  { label: 'Leader', y: 60, fill: 'var(--leader)' },
  { label: 'Follower A', y: 132, fill: 'var(--accent)' },
  { label: 'Follower B', y: 204, fill: 'var(--muted)' },
]

export function HeroDiagram() {
  return (
    <svg
      className="hero-svg"
      viewBox="0 0 720 300"
      role="img"
      aria-labelledby="hero-diagram-title hero-diagram-desc"
      width="100%"
    >
      <title id="hero-diagram-title">How value flows through the LLM market</title>
      <desc id="hero-diagram-desc">
        Many purchasers, drawn as dots sized by willingness to pay, buy AI outputs from three
        model firms — Lab 1, Lab 2, and Lab 3 — which in turn rent a fixed block of
        GPU capacity of width K owned by hyperscalers.
      </desc>

      {/* Column labels */}
      <text x="80" y="18" className="hero-svg-label" textAnchor="middle">Purchasers</text>
      <text x="330" y="18" className="hero-svg-label" textAnchor="middle">Model laboratories</text>
      <text x="620" y="18" className="hero-svg-label" textAnchor="middle">GPU capacity</text>

      {/* Flow arrows behind everything */}
      <g stroke="var(--line)" strokeWidth="1.5" fill="none">
        {firms.map((f) => (
          <line key={`p-${f.label}`} x1="150" y1={f.y + 20} x2="236" y2={f.y + 20} markerEnd="url(#arrow)" />
        ))}
        {firms.map((f) => (
          <line key={`k-${f.label}`} x1="430" y1={f.y + 20} x2="536" y2={140} markerEnd="url(#arrow)" />
        ))}
      </g>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
        </marker>
      </defs>

      {/* Purchaser dots */}
      <g>
        {dots.map(([x, y, theta], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3 + theta * 7}
            fill={dotFill(theta)}
            opacity={0.35 + theta * 0.55}
          />
        ))}
      </g>

      {/* Model firms */}
      <g>
        {firms.map((f) => (
          <g key={f.label}>
            <rect x="236" y={f.y} width="194" height="40" rx="8" fill="var(--surface)" stroke={f.fill} strokeWidth="2" />
            <circle cx="258" cy={f.y + 20} r="6" fill={f.fill} />
            <text x="276" y={f.y + 25} className="hero-svg-firm">{firmDisplayName(f.label)}</text>
          </g>
        ))}
      </g>

      {/* GPU capacity block of width K, owned by hyperscalers */}
      <g>
        <rect x="540" y="52" width="150" height="176" rx="8" fill="var(--accent-pale)" stroke="#a9d7d0" strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}-${c}`} x={556 + c * 30} y={70 + r * 30} width="20" height="20" rx="3" fill="#bfe4dd" />
          )),
        )}
        {/* Width-K bracket */}
        <line x1="540" y1="240" x2="690" y2="240" stroke="var(--muted)" strokeWidth="1" />
        <VarLabel def={varDefs.K} label="K (capacity)" x={615} y={256} className="hero-svg-firm" textAnchor="middle">capacity K</VarLabel>
        <text x="615" y="286" className="hero-svg-note" textAnchor="middle">owned by hyperscalers</text>
      </g>
    </svg>
  )
}
