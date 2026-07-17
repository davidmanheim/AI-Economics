// S3 — "What a price is made of" — hosts module M2 (plan §4.3).
//
// Renders the S3 narrative body and derivation from content/copy.tsx (not
// duplicated here) alongside the interactive M2 charts: the stacked price bar
// with a quality-adjusted twin, the shares-of-surplus bar, and the K–n binding
// phase plot. Two scripted presets ("Add more labs", "Build more GPUs") animate
// the capacity-binding neutrality proposition and the scarcity-collapse result.
//
// All math is imported from src/model; this component only wires parameters to
// the pure functions and to the presentational charts.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { Katex } from '../components/Katex'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Term } from '../components/Term'
import { PriceStackBar } from '../components/charts/PriceStackBar'
import { RentShareBar } from '../components/charts/RentShareBar'
import { BindingRegionPlot } from '../components/charts/BindingRegionPlot'
import { sections } from '../content/copy'
import { bindingThreshold, cournotEquilibrium, linearDemandFromVertical } from '../model/cournot'
import { nashBargain } from '../model/bargaining'
import { NORMALIZED } from '../model/presets'

const s3 = sections.find((s) => s.id === 's3')!

// Representative homogeneous good for the symmetric Cournot mapping: the leader's
// quality from the normalized preset, with the global demand params. Q, N and
// thetaMax are the DEFAULTS for the demand-curve shape — they are exposed as live
// sliders in the "advanced" panel below and derived reactively inside the
// component (see the useMemo), so A_INTERCEPT/B_SLOPE are no longer frozen here.
const REP = NORMALIZED.firms[0]
const Q_DEFAULT = REP.a * REP.q
const N_DEFAULT = NORMALIZED.N
const THETA_MAX_DEFAULT = NORMALIZED.thetaMax
// a (FLOPs/output) and b (non-compute cost) are the cost/technology inputs to the
// Cournot equilibrium, not the demand curve, so they stay fixed at the preset values.
const a = REP.a
const b = REP.b

// Inline definition for the Q slider. The existing sliderDefs.quality entry is the
// per-compute productivity q = Q/a; here we expose total quality Q — the demand
// anchor — so it gets its own concrete-referent note.
const Q_DEF =
  'Representative quality: the quality of the standard model that anchors the whole market’s demand curve — higher quality lifts how much every buyer will pay for one task.'

const btn: React.CSSProperties = {
  cursor: 'pointer',
  border: '1px solid var(--accent)',
  borderRadius: 8,
  padding: '8px 14px',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '.9rem',
}
const btnGhost: React.CSSProperties = {
  cursor: 'pointer',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '8px 14px',
  background: 'transparent',
  color: 'var(--ink)',
  fontWeight: 700,
  fontSize: '.9rem',
}
const fmt = (v: number) => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1))

export function S3PriceAnatomy() {
  const [n, setN] = useState(3)
  const [K, setK] = useState(100)
  const [c, setC] = useState(1)
  const [zeta, setZeta] = useState(0)
  const [showBargaining, setShowBargaining] = useState(false)
  // Advanced (collapsed by default): the demand-curve shape parameters that were
  // previously fixed module-level constants, now reactive state.
  const [Q, setQ] = useState(Q_DEFAULT)
  const [demandN, setDemandN] = useState(N_DEFAULT)
  const [thetaMax, setThetaMax] = useState(THETA_MAX_DEFAULT)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  function animate(setter: (v: number) => void, from: number, to: number, ms: number, round = false) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    // Respect the OS/browser "reduce motion" preference: skip the tween and jump
    // straight to the target in a single state update.
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setter(round ? Math.round(to) : to)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = t * t * (3 - 2 * t) // smoothstep
      const v = from + (to - from) * eased
      setter(round ? Math.round(v) : v)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // Preset 1: capacity binding, animate n from 2 -> 6. Total price stays fixed;
  // colour split slides from markup toward scarcity rent (prop:capacity-neutrality).
  function addMoreLabs() {
    setC(1)
    setK(100)
    setN(2)
    animate(setN, 2, 6, 2600, true)
  }
  // Preset 2: fix n, animate K past the binding threshold. Scarcity segment
  // collapses to zero while the markup segment persists (slack case).
  function buildMoreGPUs() {
    setC(1)
    setN(3)
    setK(100)
    animate(setK, 100, 260, 2600)
  }
  // Restore every control — the primary sliders, the bargaining sub-view, and the
  // advanced demand-curve parameters — to its initial default.
  function resetDefaults() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setN(3)
    setK(100)
    setC(1)
    setZeta(0)
    setShowBargaining(false)
    setQ(Q_DEFAULT)
    setDemandN(N_DEFAULT)
    setThetaMax(THETA_MAX_DEFAULT)
    setShowAdvanced(false)
  }

  // Demand-curve shape, recomputed from the (now reactive) advanced parameters
  // instead of once at module load. Everything downstream reads these.
  const { A: A_INTERCEPT, B: B_SLOPE } = useMemo(
    () => linearDemandFromVertical(Q, demandN, thetaMax),
    [Q, demandN, thetaMax],
  )

  const eq = cournotEquilibrium(A_INTERCEPT, B_SLOPE, a, b, c, n, K)
  // Capacity K at which the current market (this n, c) flips binding <-> slack.
  // Same tested formula the phase plot uses — reused, not recomputed.
  const kThreshold = bindingThreshold(A_INTERCEPT, B_SLOPE, a, b, c, n)
  const K_MIN = 20
  const K_MAX = 300
  const thresholdInRange = kThreshold >= K_MIN && kThreshold <= K_MAX
  const pct = (v: number) => ((Math.min(K_MAX, Math.max(K_MIN, v)) - K_MIN) / (K_MAX - K_MIN)) * 100
  const decomposition = {
    physicalCost: eq.physicalCost,
    scarcityRent: eq.scarcityRent,
    markup: eq.markup,
    total: eq.P,
  }

  // Producer-surplus shares (above physical cost). Base case = competitive
  // auction: hyperscaler keeps the scarcity rent. In the bargaining sub-view,
  // laboratory Nash weight zeta lets labs claw back a share of that rent.
  const outputs = K / a
  const scarcityPie = eq.scarcityRent * outputs // = (r* - c) * K
  let labTotal = eq.labProfitAggregate
  let hyperTotal = scarcityPie
  if (showBargaining) {
    const split = nashBargain(eq.r, c, c, zeta) // barVH = max(c,c) = c
    labTotal = eq.labProfitAggregate + split.labRent * outputs
    hyperTotal = split.hyperscalerIncremental * outputs
  }
  const surplus = labTotal + hyperTotal
  const labShare = surplus > 0 ? labTotal / surplus : 1
  const hyperShare = surplus > 0 ? hyperTotal / surplus : 0

  return (
    <section className="content-section" id={s3.anchor}>
      <p className="eyebrow">{s3.number}</p>
      <h2>{s3.title}</h2>
      <div className="section-body">{s3.body}</div>

      {/* Controls + scripted presets. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '24px 0 8px' }}>
        <button style={btn} onClick={addMoreLabs}>▸ Add more labs (n: 2→6)</button>
        <button style={{ ...btn, background: 'var(--leader)', borderColor: 'var(--leader)' }} onClick={buildMoreGPUs}>
          ▸ Build more GPUs (K past threshold)
        </button>
        <button style={btnGhost} onClick={resetDefaults}>↺ Reset to defaults</button>
      </div>
      <p style={{ fontSize: '.9rem', color: 'var(--muted)', maxWidth: 640, marginTop: 0 }}>
        With capacity <Term term="bindingVsSlack">binding</Term>, adding labs leaves the price bar's
        height fixed and only slides the colour split from <Term term="markup">markup</Term> toward{' '}
        <Term term="scarcityRent">scarcity rent</Term>. Building GPUs past the threshold collapses the
        scarcity segment while the markup persists.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 24px', margin: '12px 0 20px' }}>
        <Slider label="Number of labs, n" def={sliderDefs.n} value={n} min={1} max={8} step={1} onChange={setN} />
        <Slider label="Capacity, K" def={sliderDefs.K} value={K} min={20} max={300} step={1} onChange={setK} />
        <Slider label="Physical cost, c" def={sliderDefs.c} value={c} min={0.5} max={3} step={0.1} onChange={setC} />
      </div>

      {/* Advanced: the demand-curve parameters that are held fixed above so the
          primary sliders stay focused on market structure. Collapsed by default. */}
      <button
        type="button"
        className="advanced-toggle"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced((v) => !v)}
      >
        <span className="chevron" aria-hidden="true">▸</span>
        Advanced: reshape the demand curve
      </button>
      {showAdvanced && (
        <div className="advanced-panel">
          <p className="advanced-panel-note">
            These three parameters set the shape of the underlying demand curve
            (<Katex math="P = A - BY" />). They are held fixed above so the sliders stay focused on
            market structure — adjust them here to reshape demand itself.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px 24px' }}>
            <Slider label="Representative quality, Q" def={Q_DEF} value={Q} min={0.7} max={2.8} step={0.1} onChange={setQ} />
            <Slider label="Purchaser mass, N" def={sliderDefs.N} value={demandN} min={150} max={600} step={10} onChange={setDemandN} />
            <Slider label="Top willingness to pay, θ_max" def={sliderDefs.thetaMax} value={thetaMax} min={6} max={16} step={0.5} onChange={setThetaMax} />
          </div>
        </div>
      )}

      {/* Binding-threshold readout + a crossing ruler along the K range, so the
          exact K where capacity flips is a visible number you can watch cross. */}
      <div style={{ margin: '4px 0 20px', maxWidth: 640 }}>
        <p style={{ fontSize: '.9rem', color: 'var(--ink)', margin: '0 0 8px' }}>
          {thresholdInRange ? (
            <>
              Capacity <strong>binds until K ≈ {Math.round(kThreshold)}</strong> (for n = {n}) — you're at
              K = {Math.round(K)}, so compute is{' '}
              <strong style={{ color: eq.binding ? 'var(--accent)' : 'var(--muted)' }}>
                {eq.binding ? 'scarce (binding)' : 'abundant (slack)'}
              </strong>.
            </>
          ) : (
            <>
              At n = {n} the flip point sits at K ≈ {Math.round(kThreshold)}, outside the slider's range, so
              capacity stays{' '}
              <strong style={{ color: eq.binding ? 'var(--accent)' : 'var(--muted)' }}>
                {eq.binding ? 'binding across the whole range' : 'slack across the whole range'}
              </strong>.
            </>
          )}
        </p>
        {/* Ruler: the K axis from 20→300 with a labelled threshold tick and the
            current-K dot. Drag K and the dot crosses the tick at the flip. */}
        <div style={{ position: 'relative', height: 30 }} aria-hidden="true">
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 3, borderRadius: 2, background: 'var(--line)' }} />
          {/* Filled portion = the binding stretch, up to the threshold. */}
          {thresholdInRange && (
            <div style={{ position: 'absolute', top: 20, left: 0, width: `${pct(kThreshold)}%`, height: 3, borderRadius: 2, background: 'var(--accent-pale)' }} />
          )}
          {thresholdInRange && (
            <>
              <div style={{ position: 'absolute', top: 12, left: `${pct(kThreshold)}%`, width: 2, height: 18, marginLeft: -1, background: 'var(--accent)' }} />
              <span style={{ position: 'absolute', top: -2, left: `${pct(kThreshold)}%`, transform: 'translateX(-50%)', fontSize: '.72rem', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                K* ≈ {Math.round(kThreshold)}
              </span>
            </>
          )}
          {/* Current-K marker. */}
          <div
            style={{
              position: 'absolute',
              top: 15,
              left: `${pct(K)}%`,
              width: 12,
              height: 12,
              marginLeft: -6,
              borderRadius: '50%',
              background: 'var(--ink)',
              border: '2px solid var(--surface)',
            }}
          />
        </div>
      </div>

      {/* Charts. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>What the purchaser pays</h3>
          <PriceStackBar decomposition={decomposition} quality={Q} binding={eq.binding} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>Who gets the surplus</h3>
          <RentShareBar labShare={labShare} hyperShare={hyperShare} />

          {/* Levels row — kept strictly separate from the SHARES chart above. */}
          <p className="chart-caption" style={{ color: 'var(--muted)' }}>Levels (not shares)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: '.85rem', color: 'var(--ink)' }}>
            <span>Consumer price P* = <strong>{fmt(eq.P)}</strong></span>
            <span>Wholesale r* = <strong>{fmt(eq.r)}</strong></span>
            <span>Per-lab markup = <strong>{fmt(eq.perFirmMarkup)}</strong></span>
            <span>Lab profit = <strong>{fmt(eq.labProfitAggregate)}</strong></span>
            <span>Hyperscaler rent = <strong>{fmt(scarcityPie)}</strong></span>
          </div>

          {/* Bargaining sub-view (zeta only appears here). */}
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.9rem', fontWeight: 700 }}>
              <input type="checkbox" checked={showBargaining} onChange={(e) => setShowBargaining(e.target.checked)} />
              Show the bargaining split
            </label>
            {showBargaining && (
              <div style={{ marginTop: 8 }}>
                <Slider label="Lab bargaining weight, ζ" def={sliderDefs.zeta} value={zeta} min={0} max={1} step={0.05} onChange={setZeta} />
                <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: '4px 0 0' }}>
                  ζ is the laboratory's <Term term="nashBargaining">Nash bargaining</Term> weight. At{' '}
                  <strong>ζ = 0</strong> compute is sold by open competition and the hyperscaler keeps
                  the whole scarcity rent; as ζ rises toward 1, labs — or a few large buyers exercising{' '}
                  <Term term="oligopsony">oligopsony</Term> — negotiate back a larger share of the pie.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>Where is capacity the bottleneck?</h3>
        <BindingRegionPlot A={A_INTERCEPT} B={B_SLOPE} a={a} b={b} c={c} n={n} K={K} />
      </div>

      <Derivation id={`${s3.anchor}-derivation`}>
        {s3.derivation}
        <p style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12 }}>
          <strong>A welfare reading of the three pieces.</strong> The physical cost is a real resource
          cost. The <Term term="scarcityRent">scarcity rent</Term> is, with capacity fixed, a pure
          transfer to hardware owners: it moves <Term term="producerSurplus">producer surplus</Term>{' '}
          around without destroying any, and its defence is dynamic — it is exactly the signal that
          pays for the next round of GPUs. The <Term term="markup">markup</Term> is the piece that
          causes <Term term="deadweightLoss">deadweight loss</Term>. When capacity is{' '}
          <Term term="bindingVsSlack">slack</Term> the markup suppresses trades that should happen.
          When capacity binds it cannot cut total output — that is pinned by <Katex math="K" /> — so
          the loss changes form into a cross-laboratory misallocation: compute is drawn toward the
          labs with the smaller markups and away from its highest-value uses, so the wrong models are
          served rather than too few outputs in total.
        </p>
        <p className="drawer-fine" style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          The capacity-binding neutrality of <Katex math="n" /> is a proven proposition under its
          stated hypotheses — <Katex math="n" /> symmetric labs, a homogeneous good, and linear
          inverse demand <Katex math="P = A - BY" /> with binding capacity — not an unconditional law.
          Heterogeneity or product differentiation reintroduces a role for the number and composition
          of labs even under binding capacity.
        </p>
      </Derivation>
    </section>
  )
}
