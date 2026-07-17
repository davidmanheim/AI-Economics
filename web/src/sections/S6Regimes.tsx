// S6 — Three possible technological futures (hosts M4).
//
// Runs the regime simulator (model/regimes.ts) for all three q(G) laws, reduces
// each run to chart-ready points, and hands them to <RegimePaths>. Sliders
// (plan §4.6b) drive the shared dynamics; the asymptote-gap slider is scoped to
// the firm-specific tab (the one regime where eta plays the asymptote-multiplier
// role). Narrative body and derivation come from copy.tsx (id `s6`) — not
// duplicated here. The three-way commoditization conjunction is a prominent
// callout, per plan §4.6c and design constraint (§7).

import { useMemo, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Term } from '../components/Term'
import { Katex } from '../components/Katex'
import { RegimePaths, type RegimeKey, type RegimePanel, type RegimePricePoint } from '../components/charts/RegimePaths'
import { simulateRegime, type RegimeConfig, type RegimeType } from '../model/regimes'
import { NORMALIZED, clonePreset } from '../model/presets'
import { sections } from '../content/copy'

// Content now lives under id 's7' after the S6/S7 display-order swap; this
// component (regime paths) itself is unrenamed since the file/registry
// mapping in App.tsx handles the reassignment.
const s6 = sections.find((s) => s.id === 's7')!

const PERIODS = 40

// Research-efficiency ψ_l and the training-stock origin G_0 stay fixed. ψ is an
// asymmetric per-firm array (leader 1.8, follower 1.0) whose asymmetry is what
// drives the common-regime convergence — collapsing it to one slider would erase
// that. G_0 = 1 keeps the decay term G^{-β} ≤ 1 at t=0, so quality never dips
// negative even at high curvature; exposing it safely would force a lopsided
// (≥1) range, so it stays fixed while the reactive knobs cover ceiling, gap, and
// per-period training growth.
const PSI_FIXED = [1.8, 1.0]
const G0_FIXED = 1

const SUMMARY: Record<RegimeKey, { label: string; summary: RegimePanel['summary']; leadership: RegimePanel['leadership'] }> = {
  common: {
    label: 'Common ceiling',
    summary: { edge: 'gone', markup: 'maybe persists', rent: 'depends on capacity' },
    leadership: 'temporary',
  },
  'firm-specific': {
    label: 'Firm-specific ceilings',
    summary: { edge: 'permanent', markup: 'persists', rent: 'depends on capacity' },
    leadership: 'durable',
  },
  continuing: {
    label: 'Continuing improvement',
    summary: { edge: 'recurring', markup: 'cycles', rent: 'cycles' },
    leadership: 'temporary',
  },
}

const REGIME_ORDER: RegimeKey[] = ['common', 'firm-specific', 'continuing']

const S6_CSS = `
.commodity-callout { margin: 26px 0; padding: 18px 22px; border: 1px solid #a9d7d0;
  border-left: 4px solid var(--accent); border-radius: 10px; background: var(--accent-pale); }
.commodity-callout p { margin: 6px 0 14px; max-width: 660px; line-height: 1.6; }
.commodity-chips { display: flex; flex-wrap: wrap; gap: 12px; }
.commodity-chips .chart-chip { display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; font-size: .8rem; background: var(--surface); border: 1px solid #a9d7d0; }
.commodity-chips em { font-style: normal; font-weight: 600; color: var(--ink); }
.regime-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px; margin: 24px 0 8px; padding: 18px; border: 1px solid var(--line);
  border-radius: 10px; background: var(--surface); }
@media (max-width: 640px) { .commodity-chips { flex-direction: column; align-items: stretch; } }
`

function toPoints(config: RegimeConfig, c: number, aB: number[], bB: number[]): RegimePricePoint[] {
  const { periods } = simulateRegime(config)
  return periods.map((p) => {
    // Leader / follower = two highest-q firms this period.
    const order = p.q.map((qq, i) => ({ qq, i })).sort((x, y) => y.qq - x.qq)
    const li = order[0].i
    const aL = aB[li]
    const bL = bB[li]
    return {
      t: p.t,
      qLeader: p.q[order[0].i],
      qFollower: p.q[order[1].i],
      ratio: Number.isFinite(p.qualityGap) ? p.qualityGap : 1,
      physicalCost: bL + aL * c,
      scarcityRent: aL * p.scarcityRent,
      markup: p.markupLeader,
      qualityAdjustedPrice: p.qualityAdjustedPrice,
    }
  })
}

// Control defaults, named so the reset button restores the opening state.
// qBar / dGap / gGPct are the advanced shape parameters (formerly the frozen
// STATIC object) now surfaced through the advanced panel.
const DEFAULTS = {
  active: 'common' as RegimeKey,
  etaGap: 1.27,
  curvature: 0.4,
  capPct: 10,
  demPct: 8,
  qBar: 1.6,
  dGap: 0.55,
  gGPct: 25,
}

export function S6Regimes() {
  const [active, setActive] = useState<RegimeKey>(DEFAULTS.active)
  const [etaGap, setEtaGap] = useState(DEFAULTS.etaGap)
  const [curvature, setCurvature] = useState(DEFAULTS.curvature)
  const [capPct, setCapPct] = useState(DEFAULTS.capPct)
  const [demPct, setDemPct] = useState(DEFAULTS.demPct)
  // Advanced shape parameters — collapsed by default.
  const [qBar, setQBar] = useState(DEFAULTS.qBar)
  const [dGap, setDGap] = useState(DEFAULTS.dGap)
  const [gGPct, setGGPct] = useState(DEFAULTS.gGPct)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function resetDefaults() {
    setActive(DEFAULTS.active)
    setEtaGap(DEFAULTS.etaGap)
    setCurvature(DEFAULTS.curvature)
    setCapPct(DEFAULTS.capPct)
    setDemPct(DEFAULTS.demPct)
    setQBar(DEFAULTS.qBar)
    setDGap(DEFAULTS.dGap)
    setGGPct(DEFAULTS.gGPct)
  }

  const panels = useMemo<RegimePanel[]>(() => {
    const base = clonePreset(NORMALIZED)
    base.firms = base.firms.slice(0, 2) // Leader, Follower A
    const aB = base.firms.map((f) => f.a)
    const bB = base.firms.map((f) => f.b)

    const build = (regime: RegimeType): RegimeConfig => ({
      regime,
      base,
      qBar,
      eta: [etaGap, 1.0],
      d: [dGap, dGap],
      psi: PSI_FIXED,
      beta: curvature,
      G0: G0_FIXED,
      gG: gGPct / 100,
      capacityGrowth: capPct / 100,
      demandGrowth: demPct / 100,
      periods: PERIODS,
    })

    return REGIME_ORDER.map((key) => ({
      key,
      label: SUMMARY[key].label,
      points: toPoints(build(key), base.c, aB, bB),
      summary: SUMMARY[key].summary,
      leadership: SUMMARY[key].leadership,
    }))
  }, [etaGap, curvature, capPct, demPct, qBar, dGap, gGPct])

  return (
    <section id={s6.anchor} className="content-section">
      <style>{S6_CSS}</style>
      <p className="eyebrow">{s6.number}</p>
      <h2>{s6.title}</h2>
      <div className="section-body">{s6.body}</div>

      {/* Three-way commoditization conjunction — prominent callout (§4.6c). */}
      <div className="commodity-callout">
        <span className="chart-caption">The commoditization test — three conditions, not one</span>
        <p>
          <Term term="commoditization">Commoditization</Term> — a{' '}
          <Term term="qualityAdjustedPrice">quality-adjusted price</Term> falling to physical cost —
          needs <strong>all three</strong> of the following at once. Meet any two and a wedge remains.
        </p>
        <div className="commodity-chips">
          <span className="chart-chip">
            <Katex math="q_L - q_F \to 0" />
            <em>quality gap closes</em>
          </span>
          <span className="chart-chip">
            <Katex math="\mu_\ell \to 0" />
            <em><Term term="markup">markup</Term> competed away</em>
          </span>
          <span className="chart-chip">
            <Katex math="r - c \to 0" />
            <em><Term term="scarcityRent">scarcity rent</Term> gone</em>
          </span>
        </div>
      </div>

      <div className="regime-controls">
        <Slider label="Curvature" def={sliderDefs.beta} value={curvature} min={0.1} max={1.0} step={0.05} onChange={setCurvature} />
        <Slider label="Capacity growth (%/period)" def={sliderDefs.capacityGrowth} value={capPct} min={0} max={30} step={1} onChange={setCapPct} />
        <Slider label="Demand growth (%/period)" def={sliderDefs.demandGrowth} value={demPct} min={0} max={30} step={1} onChange={setDemPct} />
        {active === 'firm-specific' && (
          <Slider label="Asymptote gap η_L/η_F" def={sliderDefs.etaGap} value={etaGap} min={1.0} max={1.6} step={0.01} onChange={setEtaGap} />
        )}
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
            These shape parameters are held fixed above so the main sliders stay focused on
            convergence speed and growth — adjust them here to reshape the underlying quality
            curves themselves. The quality ceiling and starting gap apply to both capped regimes;
            training-compute growth drives how fast every regime climbs.
          </p>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <Slider label="Quality ceiling q̄" def={sliderDefs.qBar} value={qBar} min={1.3} max={2.4} step={0.05} onChange={setQBar} />
            <Slider label="Starting gap d" def={sliderDefs.gapCoefficient} value={dGap} min={0.2} max={1.0} step={0.05} onChange={setDGap} />
            <Slider label="Training growth (%/period)" def={sliderDefs.trainingGrowth} value={gGPct} min={5} max={50} step={1} onChange={setGGPct} />
          </div>
        </div>
      )}

      <div className="reset-row">
        <button type="button" className="reset-btn" onClick={resetDefaults}>
          Reset to defaults
        </button>
      </div>

      <RegimePaths panels={panels} active={active} onSelect={setActive} />

      {s6.derivation && <Derivation id="regimes">{s6.derivation}</Derivation>}
    </section>
  )
}
