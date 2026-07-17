// S7 — Why users subscribe to several providers (hosts the routing widget).
//
// Narrative body + derivation come from copy.tsx (id `s7`). The interactive
// piece is <RoutingTable>: five illustrative task types against three providers
// whose subscription fee phi_m and per-use price rho_m are adjustable here
// (plan §4.7b), plus a task-mix stepper per task type. An advanced panel also
// exposes the purchaser type theta and each provider's FLOPs/output a_m. Per-task
// qualities Q_{mk} stay fixed illustrative values chosen so multi-homing emerges
// (each provider wins at least one task).

import { useMemo, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { RoutingTable } from '../components/charts/RoutingTable'
import { firmDisplayName } from '../lib/displayName'
import type { Provider, TaskType } from '../model/subscriptions'
import { TASK_NAMES } from '../model/subscriptions'
import { sections } from '../content/copy'

// Content now lives under id 's6' after the S6/S7 display-order swap; this
// component (subscriptions) itself is unrenamed since the file/registry
// mapping in App.tsx handles the reassignment.
const s7 = sections.find((s) => s.id === 's6')!

const DEFAULT_THETA = 6 // representative purchaser willingness-to-pay

// Counts are per day, aligned with TASK_NAMES (imported from model/subscriptions,
// shared with S2's task-heterogeneity demo).
const DEFAULT_COUNTS = [12, 20, 5, 8, 4]

// Per-provider, per-task economically relevant quality Q_{mk} (aligned with
// TASK_NAMES: Research, Coding, Medical, Math/Engineering, Image/Video Gen).
// Chosen so each provider is clearly best at something (multi-homing emerges):
// the leader wins Research and Medical, one competitor wins Coding and
// Math/Engineering, the other wins Image/Video Gen.
const PROVIDER_DEFS: { name: string; a: number; quality: number[] }[] = [
  { name: 'Leader', a: 1.5, quality: [1.5, 1.3, 1.45, 1.2, 1.1] },
  { name: 'Follower A', a: 1.0, quality: [1.2, 1.5, 1.2, 1.45, 1.1] },
  { name: 'Follower B', a: 0.6, quality: [1.0, 0.95, 1.1, 1.15, 1.55] },
]

// Illustrative dollar prices — round numbers, not estimates. phi is a monthly
// subscription fee ($/mo), rho a per-use price ($/use).
const DEFAULT_PHI = [20, 12, 8]
const DEFAULT_RHO = [0.2, 0.12, 0.08]

// Per-provider FLOPs per output a_m — normally fixed, exposed in the advanced
// panel. Distinct per provider (the leader spends more compute per task), so
// each keeps its own slider rather than sharing one value.
const DEFAULT_A = PROVIDER_DEFS.map((p) => p.a)

const usd = (v: number) => `$${v.toFixed(2)}`
const usdMonth = (v: number) => `$${v.toFixed(0)}/mo`

const S7_CSS = `
.sub-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin: 24px 0;
  padding: 18px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.sub-provider { margin-top: 10px; padding-top: 10px; border-top: 1px dotted var(--line); display: grid; gap: 8px; }
.sub-provider-name { font-weight: 800; letter-spacing: -.01em; }
.sub-steppers { display: grid; gap: 8px; margin-top: 8px; }
.sub-stepper { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.sub-stepper-label { font-size: .88rem; display: flex; flex-direction: column; }
.sub-stepper-pct { font-size: .72rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.sub-stepper-controls { display: inline-flex; align-items: center; gap: 8px; }
.sub-stepper-controls button { width: 28px; height: 28px; border: 1px solid var(--line);
  background: var(--paper); border-radius: 6px; cursor: pointer; font-size: 1.1rem; line-height: 1; color: var(--accent); }
.sub-stepper-controls button:hover { border-color: var(--accent); }
.sub-stepper-controls output { min-width: 28px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; }
.sub-note { max-width: 660px; font-size: .88rem; color: var(--muted); margin-top: 14px; }
@media (max-width: 640px) { .sub-controls { grid-template-columns: 1fr; } }
`

export function S7Subscriptions() {
  const [phi, setPhi] = useState<number[]>(DEFAULT_PHI)
  const [rho, setRho] = useState<number[]>(DEFAULT_RHO)
  const [counts, setCounts] = useState<number[]>(DEFAULT_COUNTS)
  const [theta, setTheta] = useState<number>(DEFAULT_THETA)
  const [aVals, setAVals] = useState<number[]>(DEFAULT_A)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const providers = useMemo<Provider[]>(
    () =>
      PROVIDER_DEFS.map((p, m) => ({
        name: p.name,
        a: aVals[m],
        quality: p.quality,
        phi: phi[m],
        rho: rho[m],
      })),
    [phi, rho, aVals],
  )

  const tasks = useMemo<TaskType[]>(
    () => TASK_NAMES.map((name, k) => ({ name, count: counts[k] })),
    [counts],
  )

  const totalCount = counts.reduce((s, x) => s + x, 0)

  const setPhiAt = (m: number, v: number) => setPhi((p) => p.map((x, i) => (i === m ? v : x)))
  const setRhoAt = (m: number, v: number) => setRho((p) => p.map((x, i) => (i === m ? v : x)))
  const setAAt = (m: number, v: number) => setAVals((p) => p.map((x, i) => (i === m ? v : x)))
  const bumpCount = (k: number, delta: number) =>
    setCounts((c) => c.map((x, i) => (i === k ? Math.max(0, x + delta) : x)))
  const resetDefaults = () => {
    setPhi(DEFAULT_PHI)
    setRho(DEFAULT_RHO)
    setCounts(DEFAULT_COUNTS)
    setTheta(DEFAULT_THETA)
    setAVals(DEFAULT_A)
  }

  return (
    <section id={s7.anchor} className="content-section">
      <style>{S7_CSS}</style>
      <p className="eyebrow">{s7.number}</p>
      <h2>{s7.title}</h2>
      <div className="section-body">{s7.body}</div>

      <div className="sub-controls">
        <div className="sub-pricing">
          <span className="chart-caption">Provider pricing — monthly fee φ and per-use price ρ</span>
          {PROVIDER_DEFS.map((p, m) => (
            <div key={p.name} className="sub-provider">
              <span className="sub-provider-name">{firmDisplayName(p.name)}</span>
              <Slider label={`φ (monthly fee)`} def={sliderDefs.phi} value={phi[m]} min={0} max={50} step={1} format={usdMonth} onChange={(v) => setPhiAt(m, v)} />
              <Slider label={`ρ (per use)`} def={sliderDefs.rho} value={rho[m]} min={0} max={1} step={0.01} format={usd} onChange={(v) => setRhoAt(m, v)} />
            </div>
          ))}
          <p className="sub-note" style={{ marginTop: 8 }}>
            Illustrative calibration — round numbers, not estimates. Prices are for intuition only.
          </p>
        </div>

        <div className="sub-mix">
          <span className="chart-caption">Your task mix — daily count and share of volume</span>
          <div className="sub-steppers">
            {TASK_NAMES.map((name, k) => {
              const share = totalCount > 0 ? Math.round((100 * counts[k]) / totalCount) : 0
              return (
                <div key={name} className="sub-stepper">
                  <span className="sub-stepper-label">
                    {name}
                    <span className="sub-stepper-pct">{share}% of volume</span>
                  </span>
                  <div className="sub-stepper-controls">
                    <button aria-label={`fewer ${name}`} onClick={() => bumpCount(k, -1)}>
                      −
                    </button>
                    <output>{counts[k]}</output>
                    <button aria-label={`more ${name}`} onClick={() => bumpCount(k, 1)}>
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
            These stay fixed above so the main sliders focus on pricing and task mix. Here you can
            vary the representative purchaser's willingness-to-pay θ and each provider's FLOPs per
            output a (its compute cost per task). The per-task quality matrix Q is left fixed: it is
            an illustrative 3×5 grid chosen so multi-homing emerges, not values meant to be
            hand-tuned one by one.
          </p>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <Slider label="Willingness-to-pay θ" def={sliderDefs.thetaMax} value={theta} min={2} max={12} step={0.5} onChange={setTheta} />
            {PROVIDER_DEFS.map((p, m) => (
              <Slider
                key={p.name}
                label={`FLOPs / output a — ${firmDisplayName(p.name)}`}
                def={sliderDefs.a}
                value={aVals[m]}
                min={0.2}
                max={3}
                step={0.1}
                onChange={(v) => setAAt(m, v)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="reset-row">
        <button type="button" className="reset-btn" onClick={resetDefaults}>
          Reset to defaults
        </button>
      </div>

      <RoutingTable theta={theta} tasks={tasks} providers={providers} />
      <p className="sub-note">
        A single representative purchaser (willingness-to-pay θ = {theta}). Toggle each provider's
        subscription in the table header and watch where each task routes.
      </p>

      {s7.derivation && <Derivation id="subscriptions">{s7.derivation}</Derivation>}
    </section>
  )
}
