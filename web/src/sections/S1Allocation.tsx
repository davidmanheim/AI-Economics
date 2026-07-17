// S1 — How scarce GPUs are allocated (plan Section 4.1). Hosts M1: the
// marginal-value water-filling chart plus the theta-segmentation strip, driven
// by five sliders, with live readouts of lambda, per-firm shares/output, and the
// marginal purchaser's theta.
//
// This file also owns the small allocation-controls hook and the props-builders
// that turn model output into chart inputs; S2 imports them so both sections run
// the same exploration on independent local state (plan Section 4.2b lets each
// section keep its own state).
//
// The narrative body/derivation is rendered from content/copy.tsx unchanged —
// this component only adds the interactive layer around it.

import { type CSSProperties, useMemo, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { MarginalValueChart, type MVComparison, type MVFirm } from '../components/charts/MarginalValueChart'
import { ThetaStrip, type ThetaSegment } from '../components/charts/ThetaStrip'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { firmDisplayName } from '../lib/displayName'
import { sections } from '../content/copy'
import { allocate, vIntercept, wtaTest } from '../model/allocation'
import { clonePreset, NORMALIZED } from '../model/presets'
import type { Params } from '../model/types'

// --- Slider configuration (plan Section 4.1b) --------------------------------

export const SLIDER_RANGES = {
  K: { min: 20, max: 300, step: 1, default: 100 },
  qL: { min: 1.0, max: 2.5, step: 0.05, default: 1.4 },
  qA: { min: 0.8, max: 1.4, step: 0.05, default: 1.1 },
  qB: { min: 0.5, max: 1.2, step: 0.05, default: 0.9 },
  c: { min: 0.5, max: 5, step: 0.05, default: 1 },
  // Advanced (held fixed by default; revealed via AllocationSliders' toggle).
  // Defaults match the NORMALIZED preset / the previously-hardcoded firm values,
  // so a reader who never opens the panel sees exactly the same model as before.
  N: { min: 50, max: 600, step: 10, default: NORMALIZED.N },
  thetaMax: { min: 2, max: 20, step: 0.5, default: NORMALIZED.thetaMax },
  a: { min: 0.5, max: 3, step: 0.05, default: 1 },
  b: { min: 0, max: 1, step: 0.05, default: 0 },
} as const

export interface AllocationState {
  K: number
  qL: number
  qA: number
  qB: number
  c: number
  // Advanced fields — optional so external callers can omit them; buildParams
  // falls back to the same defaults DEFAULT_ALLOCATION_STATE carries. A single
  // shared `a`/`b` is applied to all three firms (the quality sliders already
  // differentiate them), keeping the secondary panel to four sliders.
  N?: number
  thetaMax?: number
  a?: number
  b?: number
}

export const DEFAULT_ALLOCATION_STATE: AllocationState = {
  K: SLIDER_RANGES.K.default,
  qL: SLIDER_RANGES.qL.default,
  qA: SLIDER_RANGES.qA.default,
  qB: SLIDER_RANGES.qB.default,
  c: SLIDER_RANGES.c.default,
  N: SLIDER_RANGES.N.default,
  thetaMax: SLIDER_RANGES.thetaMax.default,
  a: SLIDER_RANGES.a.default,
  b: SLIDER_RANGES.b.default,
}

/** Firm identity colours. Leader and Follower A reuse design tokens; Follower B
 *  takes a steel blue kept clear of the frontier-segment orange. */
export const FIRM_COLORS = ['var(--leader)', 'var(--accent)', '#2f6fb0']

/** Build the canonical Params object from slider state (normalized calibration). */
export function buildParams(state: AllocationState): Params {
  const base = clonePreset(NORMALIZED)
  base.K = state.K
  base.c = state.c
  base.N = state.N ?? base.N
  base.thetaMax = state.thetaMax ?? base.thetaMax
  const a = state.a ?? SLIDER_RANGES.a.default
  const b = state.b ?? SLIDER_RANGES.b.default
  base.firms = [
    { name: 'Leader', q: state.qL, a, b },
    { name: 'Follower A', q: state.qA, a, b },
    { name: 'Follower B', q: state.qB, a, b },
  ]
  return base
}

/** Compute at which a firm's linear schedule reaches zero, x where v_m(x)=0. */
function chokeX(q: number, a: number, b: number, thetaMax: number, N: number): number {
  const slope = (2 * q * thetaMax) / (a * N)
  const v0 = vIntercept(q, a, b, thetaMax)
  return slope > 0 ? v0 / slope : 0
}

export interface AllocationModel {
  params: Params
  firms: MVFirm[]
  lambda: number
  capacityBinds: boolean
  /** Per-firm readouts aligned with params.firms order. */
  readouts: { name: string; color: string; share: number; output: number; active: boolean }[]
  marginalTheta: number
  thetaSegments: ThetaSegment[]
  N: number
  thetaMax: number
}

/** Turn slider state into everything both charts and readouts need. */
export function useAllocationModel(state: AllocationState): AllocationModel {
  return useMemo(() => {
    const params = buildParams(state)
    const { N, thetaMax, K } = params
    const alloc = allocate(params)

    const firms: MVFirm[] = params.firms.map((f, i) => ({
      name: f.name,
      color: FIRM_COLORS[i % FIRM_COLORS.length],
      x: alloc.allocations[i].x,
      vAt0: vIntercept(f.q, f.a, f.b, thetaMax),
      chokeX: chokeX(f.q, f.a, f.b, thetaMax, N),
      active: alloc.allocations[i].active,
    }))

    const readouts = params.firms.map((f, i) => ({
      name: f.name,
      color: FIRM_COLORS[i % FIRM_COLORS.length],
      share: K > 0 ? alloc.allocations[i].x / K : 0,
      output: alloc.allocations[i].y,
      active: alloc.allocations[i].active,
    }))

    const totalY = alloc.allocations.reduce((s, a) => s + a.y, 0)
    const marginalTheta = Math.max(0, thetaMax * (1 - totalY / N))

    // Segment the theta line top-down by quality: highest-quality firm serves
    // the highest-WTP purchasers. Mass served by firm m is its output y_m.
    const thetaSegments: ThetaSegment[] = params.firms
      .map((f, i) => ({
        name: f.name,
        mass: alloc.allocations[i].y,
        q: f.q,
        frontier: false,
      }))
      .filter((s) => s.mass > 1e-9)
      .sort((a, b) => b.q - a.q)
      .map((s, idx) => ({ name: s.name, mass: s.mass, frontier: idx === 0 }))

    return {
      params,
      firms,
      lambda: alloc.lambda,
      capacityBinds: alloc.capacityBinds,
      readouts,
      marginalTheta,
      thetaSegments,
      N,
      thetaMax,
    }
  }, [state])
}

/** WTA comparison overlay for the M1 chart, used by S2. */
export function buildComparison(model: AllocationModel): MVComparison {
  const wta = wtaTest(model.params)
  const followerBestUse = model.firms
    .filter((f) => f.name !== wta.leader)
    .map((f) => ({ name: f.name, color: f.color, v: f.vAt0 }))
  return {
    isWta: wta.isWTA,
    leaderName: wta.leader,
    vLeaderAtK: wta.vLeaderAtK,
    followerBestUse,
  }
}

// --- Shared controls hook ----------------------------------------------------

export function useAllocationControls(initial: AllocationState = DEFAULT_ALLOCATION_STATE) {
  const [state, setState] = useState<AllocationState>(initial)
  const set = <K extends keyof AllocationState>(key: K, value: AllocationState[K]) =>
    setState((s) => ({ ...s, [key]: value }))
  return { state, set, setState }
}

/** The five-slider panel shared by S1 and S2. `kRange` lets a host override just the
 * capacity slider's bounds (S2 needs a narrower range — see its own comment). */
export function AllocationSliders({
  state,
  set,
  kRange = SLIDER_RANGES.K,
}: {
  state: AllocationState
  set: <K extends keyof AllocationState>(key: K, value: AllocationState[K]) => void
  kRange?: { min: number; max: number; step: number }
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  return (
    <>
      <div
        className="allocation-sliders"
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          padding: '18px 0',
        }}
      >
        <Slider label="Capacity K" def={sliderDefs.K} value={state.K} min={kRange.min} max={kRange.max} step={kRange.step} onChange={(v) => set('K', v)} />
        <Slider label="Lab 1 quality q_L" def={sliderDefs.quality} value={state.qL} min={SLIDER_RANGES.qL.min} max={SLIDER_RANGES.qL.max} step={SLIDER_RANGES.qL.step} onChange={(v) => set('qL', v)} />
        <Slider label="Lab 2 quality q" def={sliderDefs.quality} value={state.qA} min={SLIDER_RANGES.qA.min} max={SLIDER_RANGES.qA.max} step={SLIDER_RANGES.qA.step} onChange={(v) => set('qA', v)} />
        <Slider label="Lab 3 quality q" def={sliderDefs.quality} value={state.qB} min={SLIDER_RANGES.qB.min} max={SLIDER_RANGES.qB.max} step={SLIDER_RANGES.qB.step} onChange={(v) => set('qB', v)} />
        <Slider label="Physical cost c" def={sliderDefs.c} value={state.c} min={SLIDER_RANGES.c.min} max={SLIDER_RANGES.c.max} step={SLIDER_RANGES.c.step} onChange={(v) => set('c', v)} />
      </div>

      <button
        type="button"
        className="advanced-toggle"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((o) => !o)}
      >
        <span className="chevron" aria-hidden="true">▸</span>
        Advanced variables
      </button>

      {advancedOpen && (
        <div className="advanced-panel">
          <p className="advanced-panel-note">
            These are held fixed above so the sliders stay focused on capacity, quality, and
            cost — adjust them here to explore the full parameter space. A single FLOPs/output
            and non-compute cost is applied to all three labs.
          </p>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <Slider label="Purchaser mass N" def={sliderDefs.N} value={state.N ?? SLIDER_RANGES.N.default} min={SLIDER_RANGES.N.min} max={SLIDER_RANGES.N.max} step={SLIDER_RANGES.N.step} onChange={(v) => set('N', v)} />
            <Slider label="Willingness-to-pay θ_max" def={sliderDefs.thetaMax} value={state.thetaMax ?? SLIDER_RANGES.thetaMax.default} min={SLIDER_RANGES.thetaMax.min} max={SLIDER_RANGES.thetaMax.max} step={SLIDER_RANGES.thetaMax.step} onChange={(v) => set('thetaMax', v)} />
            <Slider label="FLOPs / output a" def={sliderDefs.a} value={state.a ?? SLIDER_RANGES.a.default} min={SLIDER_RANGES.a.min} max={SLIDER_RANGES.a.max} step={SLIDER_RANGES.a.step} onChange={(v) => set('a', v)} />
            <Slider label="Non-compute cost b" def={sliderDefs.b} value={state.b ?? SLIDER_RANGES.b.default} min={SLIDER_RANGES.b.min} max={SLIDER_RANGES.b.max} step={SLIDER_RANGES.b.step} onChange={(v) => set('b', v)} />
          </div>
        </div>
      )}
    </>
  )
}

const pctFmt = (n: number) => `${(100 * n).toFixed(0)}%`
const numFmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))

const cellStyle: CSSProperties = { padding: '6px 10px' }
const readoutStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '12px 16px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: 'var(--surface)',
  minWidth: 180,
}
const readoutHeroStyle: CSSProperties = { ...readoutStyle, borderColor: '#a9d7d0', background: 'var(--accent-pale)' }
const readoutLabelStyle: CSSProperties = { fontSize: '0.72rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }
const readoutValueStyle: CSSProperties = { fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink)' }
const readoutSubStyle: CSSProperties = { fontSize: '0.8rem', color: 'var(--muted)' }

// --- Section ----------------------------------------------------------------

export function S1Allocation() {
  const section = sections.find((s) => s.id === 's1')!
  const { state, set, setState } = useAllocationControls()
  const model = useAllocationModel(state)

  return (
    <section className="content-section" id={section.anchor}>
      <p className="eyebrow">{section.number}</p>
      <h2>{section.title}</h2>
      <div className="section-body">{section.body}</div>

      <div className="module">
        <AllocationSliders state={state} set={set} />
        <div className="reset-row">
          <button type="button" className="reset-btn" onClick={() => setState(DEFAULT_ALLOCATION_STATE)}>
            Reset to defaults
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '4px 0 18px' }}>
          <div style={readoutHeroStyle}>
            <span style={readoutLabelStyle}>λ · scarcity premium / unit of compute</span>
            <span style={{ ...readoutValueStyle, color: 'var(--accent)' }}>{numFmt(model.lambda)}</span>
            <span style={readoutSubStyle}>
              {model.capacityBinds ? 'capacity binds' : 'capacity is slack (λ = 0)'}
            </span>
          </div>
          <div style={readoutStyle}>
            <span style={readoutLabelStyle}>marginal purchaser θ</span>
            <span style={readoutValueStyle}>{numFmt(model.marginalTheta)}</span>
            <span style={readoutSubStyle}>lowest willingness-to-pay served</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', margin: '4px 0 18px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
              <th style={cellStyle}>Firm</th><th style={cellStyle}>Compute share</th><th style={cellStyle}>Output y</th><th style={cellStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {model.readouts.map((r) => (
              <tr key={r.name} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={cellStyle}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 8, background: r.color, verticalAlign: 'baseline' }} />
                  {firmDisplayName(r.name)}
                </td>
                <td style={cellStyle}>{pctFmt(r.share)}</td>
                <td style={cellStyle}>{numFmt(r.output)}</td>
                <td style={cellStyle}>{r.active ? 'active' : 'unfunded'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <MarginalValueChart firms={model.firms} K={model.params.K} c={model.params.c} lambda={model.lambda} />
        <ThetaStrip segments={model.thetaSegments} N={model.N} thetaMax={model.thetaMax} marginalTheta={model.marginalTheta} />

        <p className="chart-caption" style={{ textTransform: 'none', color: 'var(--muted)', fontWeight: 400 }}>
          The pictures use the simplest demand consistent with the paper's Section 3 (uniform
          willingness-to-pay, vertical differentiation) — the demo's concretization of its general
          revenue function.
        </p>
      </div>

      {section.derivation && <Derivation id={`${section.anchor}-derivation`}>{section.derivation}</Derivation>}
    </section>
  )
}
