// S8 — Explore the full model (plan §4.8). The final interactive piece: one
// grouped parameter panel driving the GLOBAL parameter store (state/store.ts),
// with every module chart on the page re-rendered live off that shared state as
// a dashboard grid, a preset manager (Normalized / Illustrative plus the two
// scripted S3 presets), JSON export, and a shareable-URL hash.
//
// Single source of truth for math (plan §7.6): every number here comes from
// src/model — this file only assembles the pure functions' output into the prop
// shapes each presentational chart already expects (the same shapes the seven
// sections build locally). Where a section's mapping isn't cleanly exported for
// an arbitrary Params object (S1/S3/S5/S6 tie theirs to bespoke local state),
// small glue lives here; no equation is reimplemented.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Term } from '../components/Term'
import { MarginalValueChart, type MVFirm } from '../components/charts/MarginalValueChart'
import { ThetaStrip, type ThetaSegment } from '../components/charts/ThetaStrip'
import { PriceStackBar } from '../components/charts/PriceStackBar'
import { RentShareBar } from '../components/charts/RentShareBar'
import { BindingRegionPlot } from '../components/charts/BindingRegionPlot'
import { RaceTimeline } from '../components/charts/RaceTimeline'
import { RegimePaths, type RegimeKey, type RegimePanel, type RegimePricePoint } from '../components/charts/RegimePaths'
import { firmDisplayName } from '../lib/displayName'
import { sections } from '../content/copy'
import { allocate, surplusSplit, vIntercept, vSchedule } from '../model/allocation'
import { cournotEquilibrium, linearDemandFromVertical } from '../model/cournot'
import { simulateReleases, vLead } from '../model/dynamics'
import { simulateRegime, type RegimeConfig, type RegimeType } from '../model/regimes'
import { NORMALIZED, clonePreset } from '../model/presets'
import type { Params } from '../model/types'
import { useAppStore } from '../state/store'
import { FIRM_COLORS } from './S1Allocation'

const s8 = sections.find((s) => s.id === 's8')!

// Firm identity palette: reuse S1's three tokens, extend for any extras.
const PALETTE = [...FIRM_COLORS, '#8a8f98', '#b8873a', '#7a5cc0']
const color = (i: number) => PALETTE[i % PALETTE.length]

const fmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))
const pct = (n: number) => `${Math.round(100 * n)}%`

// Opening values for the explorer's local (chart-only) knobs; the reset button
// restores exactly these alongside the store's Normalized preset.
const KNOB_DEFAULTS = {
  regimeTab: 'common' as RegimeKey,
  curvature: 0.4,
  capPct: 10,
  demPct: 8,
  etaGap: 1.27,
  simHazard: 0.2,
  simShock: 0.2,
  simSpeed: 0.4,
}

// ---------------------------------------------------------------------------
// Glue 1 — allocation view (M1 charts) from an arbitrary Params.
// vAt0 and the schedule slope come straight from the model's vIntercept /
// vSchedule; chokeX is read off two schedule evaluations, so no formula is
// re-implemented here.
// ---------------------------------------------------------------------------
function buildAllocationView(params: Params) {
  const { N, thetaMax, K, c } = params
  const alloc = allocate(params)

  const firms: MVFirm[] = params.firms.map((f, i) => {
    const vAt0 = vIntercept(f.q, f.a, f.b, thetaMax)
    const slope = vAt0 - vSchedule(1, f.q, f.a, f.b, thetaMax, N) // = v(0) - v(1)
    const chokeX = slope > 1e-12 ? vAt0 / slope : 0
    return {
      name: f.name,
      color: color(i),
      x: alloc.allocations[i].x,
      vAt0,
      chokeX,
      active: alloc.allocations[i].active,
    }
  })

  const totalY = alloc.allocations.reduce((s, a) => s + a.y, 0)
  const marginalTheta = Math.max(0, thetaMax * (1 - totalY / N))

  const thetaSegments: ThetaSegment[] = params.firms
    .map((f, i) => ({ name: f.name, mass: alloc.allocations[i].y, q: f.q }))
    .filter((s) => s.mass > 1e-9)
    .sort((a, b) => b.q - a.q)
    .map((s, idx) => ({ name: s.name, mass: s.mass, frontier: idx === 0 }))

  const readouts = params.firms.map((f, i) => ({
    name: f.name,
    color: color(i),
    share: K > 0 ? alloc.allocations[i].x / K : 0,
    output: alloc.allocations[i].y,
    active: alloc.allocations[i].active,
  }))

  return {
    firms,
    lambda: alloc.lambda,
    capacityBinds: alloc.capacityBinds,
    marginalTheta,
    thetaSegments,
    readouts,
    N,
    thetaMax,
    K,
    c,
  }
}

// ---------------------------------------------------------------------------
// Glue 2 — price anatomy (M2 charts). Mirrors S3 but reads the representative
// homogeneous good from the CURRENT store: leader = highest-q firm, n = number
// of firms, K/c/N/thetaMax from the store. All math via cournotEquilibrium.
// ---------------------------------------------------------------------------
function buildPriceView(params: Params) {
  const leader = [...params.firms].sort((a, b) => b.q - a.q)[0]
  const Q = leader.a * leader.q
  const { A, B } = linearDemandFromVertical(Q, params.N, params.thetaMax)
  const n = params.firms.length
  const eq = cournotEquilibrium(A, B, leader.a, leader.b, params.c, n, params.K)

  const decomposition = {
    physicalCost: eq.physicalCost,
    scarcityRent: eq.scarcityRent,
    markup: eq.markup,
    total: eq.P,
  }

  const outputs = params.K / leader.a
  const scarcityPie = eq.scarcityRent * outputs // (r* - c) * K
  const labTotal = eq.labProfitAggregate
  const hyperTotal = scarcityPie
  const surplus = labTotal + hyperTotal
  const labShare = surplus > 0 ? labTotal / surplus : 1
  const hyperShare = surplus > 0 ? hyperTotal / surplus : 0

  return { eq, decomposition, Q, A, B, a: leader.a, b: leader.b, n, labShare, hyperShare, scarcityPie }
}

// ---------------------------------------------------------------------------
// Glue 3 — leadership value (M3 calculator). Delta-pi is DERIVED from the
// current market (the leader's differential laboratory rent via surplusSplit),
// never dialed; r and Lambda come from the store's dynamics.
// ---------------------------------------------------------------------------
function buildLeadershipView(params: Params) {
  const split = surplusSplit(params)
  let li = 0
  let best = -Infinity
  params.firms.forEach((f, i) => {
    const v0 = vIntercept(f.q, f.a, f.b, params.thetaMax)
    if (v0 > best) {
      best = v0
      li = i
    }
  })
  const deltaPi = Math.max(0, split.perFirmLabRent[li] ?? 0)
  const { r, Lambda } = params.dynamics
  return {
    deltaPi,
    r,
    Lambda,
    leaderName: params.firms[li]?.name ?? 'Leader',
    value: vLead(deltaPi, r, Lambda),
    expectedLife: Lambda > 0 ? 1 / Lambda : Infinity,
  }
}

// ---------------------------------------------------------------------------
// Glue 4 — technological regimes (M4). Fixed structural constants (same choices
// S6 makes) plus the store's market/firms and the explorer's regime knobs.
// ---------------------------------------------------------------------------
const REGIME_STATIC = { qBar: 1.6, d: [0.55, 0.55], psi: [1.8, 1.0], G0: 1, gG: 0.25 }
const REGIME_PERIODS = 40

const REGIME_SUMMARY: Record<RegimeKey, { label: string; summary: RegimePanel['summary']; leadership: RegimePanel['leadership'] }> = {
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

function toRegimePoints(config: RegimeConfig, c: number, aB: number[], bB: number[]): RegimePricePoint[] {
  const { periods } = simulateRegime(config)
  return periods.map((p) => {
    const order = p.q.map((qq, i) => ({ qq, i })).sort((x, y) => y.qq - x.qq)
    const li = order[0].i
    const aL = aB[li]
    const bL = bB[li]
    return {
      t: p.t,
      qLeader: p.q[order[0].i],
      qFollower: p.q[order[1].i],
      ratio: Number.isFinite(p.qualityGap) ? p.qualityGap : 1,
      physicalCost: bL + aL * c, // input cost, same one-liner S6 uses
      scarcityRent: aL * p.scarcityRent,
      markup: p.markupLeader,
      qualityAdjustedPrice: p.qualityAdjustedPrice,
    }
  })
}

function buildRegimePanels(
  params: Params,
  knobs: { curvature: number; capPct: number; demPct: number; etaGap: number },
): RegimePanel[] {
  const base: Params = { ...params, firms: params.firms.slice(0, 2) }
  if (base.firms.length < 2) return [] // regimes need a leader and a follower
  const aB = base.firms.map((f) => f.a)
  const bB = base.firms.map((f) => f.b)

  const build = (regime: RegimeType): RegimeConfig => ({
    regime,
    base,
    qBar: REGIME_STATIC.qBar,
    eta: [knobs.etaGap, 1.0],
    d: REGIME_STATIC.d,
    psi: REGIME_STATIC.psi,
    beta: knobs.curvature,
    G0: REGIME_STATIC.G0,
    gG: REGIME_STATIC.gG,
    capacityGrowth: knobs.capPct / 100,
    demandGrowth: knobs.demPct / 100,
    periods: REGIME_PERIODS,
  })

  return REGIME_ORDER.map((key) => ({
    key,
    label: REGIME_SUMMARY[key].label,
    points: toRegimePoints(build(key), base.c, aB, bB),
    summary: REGIME_SUMMARY[key].summary,
    leadership: REGIME_SUMMARY[key].leadership,
  }))
}

// ---------------------------------------------------------------------------
// URL-hash sharing. The whole Params object is JSON-encoded into the fragment
// under a `params=` key, so a copied link reproduces the view. Kept deliberately
// simple: encodeURIComponent(JSON.stringify(...)) out, JSON.parse in a try/catch
// that falls back to the store default on any error.
// ---------------------------------------------------------------------------
const HASH_KEY = 'params='

function encodeParams(p: Params): string {
  return `${HASH_KEY}${encodeURIComponent(JSON.stringify(p))}`
}

/** Parse a hash fragment; returns a Params only if it round-trips a plausible shape. */
function decodeHash(hash: string): Params | null {
  const raw = hash.replace(/^#/, '')
  if (!raw.startsWith(HASH_KEY)) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(HASH_KEY.length)))
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.firms) &&
      parsed.dynamics &&
      typeof parsed.c === 'number' &&
      typeof parsed.K === 'number'
    ) {
      return parsed as Params
    }
  } catch {
    /* fall through to null -> caller keeps the NORMALIZED default */
  }
  return null
}

// ---------------------------------------------------------------------------
// Small presentational helpers.
// ---------------------------------------------------------------------------
const S8_CSS = `
.explorer-banner { margin: 8px 0 22px; padding: 14px 18px; border-radius: 10px;
  border: 1px solid #a9d7d0; border-left: 4px solid var(--accent); background: var(--accent-pale);
  font-size: 1rem; line-height: 1.55; }
.explorer-badge { display: inline-block; margin-left: 8px; padding: 2px 9px; border-radius: 999px;
  font-size: .68rem; font-weight: 800; letter-spacing: .03em; text-transform: uppercase;
  background: var(--frontier); color: #fff; }
.explorer-layout { display: grid; grid-template-columns: minmax(240px, 300px) 1fr; gap: 28px;
  align-items: start; }
.param-panel { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 16px;
  max-height: calc(100vh - 104px); overflow-y: auto; padding-right: 6px; }
.param-group { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px 14px;
  background: var(--surface); }
.param-group > legend, .param-group-title { font-size: .74rem; font-weight: 800; letter-spacing: .06em;
  text-transform: uppercase; color: var(--muted); padding: 0 4px; }
.param-firm { margin-top: 10px; padding-top: 10px; border-top: 1px dotted var(--line); }
.param-firm-name { font-weight: 800; font-size: .9rem; display: flex; align-items: center; gap: 7px; }
.param-firm-swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.preset-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0 4px; }
.preset-btn { cursor: pointer; border: 1px solid var(--accent); border-radius: 8px; padding: 8px 14px;
  background: var(--surface); color: var(--accent); font-weight: 700; font-size: .88rem; }
.preset-btn.filled { background: var(--accent); color: #fff; }
.preset-btn.leader { border-color: var(--leader); color: var(--leader); }
.preset-btn.leader.filled { background: var(--leader); color: #fff; }
.dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 26px; }
.dash-card { min-width: 0; }
.dash-card h3 { margin: 0 0 6px; font-size: 1rem; }
.dash-readouts { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: .85rem; color: var(--ink);
  margin: 4px 0 10px; }
.value-tile { margin-top: 4px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 10px;
  background: var(--surface); box-shadow: var(--shadow); }
.value-tile .big { font-size: 2.2rem; font-weight: 800; letter-spacing: -.03em; }
.explorer-caveat { margin: 12px 0 0; padding: 10px 14px; border-left: 3px solid var(--frontier);
  background: rgba(220,108,47,.08); font-size: .9rem; line-height: 1.5; }
@media (max-width: 860px) { .explorer-layout { grid-template-columns: 1fr; }
  .param-panel { position: static; max-height: none; } }
`

function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="param-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

/** Slider that widens its range to hold an out-of-band value (e.g. Illustrative K). */
function AdaptiveSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  def,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  def?: string
  format?: (v: number) => string
}) {
  return (
    <Slider
      label={label}
      def={def}
      value={value}
      min={Math.min(min, value)}
      max={Math.max(max, value)}
      step={step}
      format={format}
      onChange={onChange}
    />
  )
}

// ---------------------------------------------------------------------------
// Section.
// ---------------------------------------------------------------------------
export function S8Explorer() {
  const params = useAppStore((s) => s.params)
  const calibration = useAppStore((s) => s.calibration)
  const setMarket = useAppStore((s) => s.setMarket)
  const setFirm = useAppStore((s) => s.setFirm)
  const setDynamics = useAppStore((s) => s.setDynamics)
  const setParams = useAppStore((s) => s.setParams)
  const applyPreset = useAppStore((s) => s.applyPreset)

  // Explorer-only knobs that are NOT part of the shared Params object (the
  // regime laws and the release simulator carry parameters the plan's Params
  // type does not model, so they live locally here).
  const [regimeTab, setRegimeTab] = useState<RegimeKey>(KNOB_DEFAULTS.regimeTab)
  const [curvature, setCurvature] = useState(KNOB_DEFAULTS.curvature)
  const [capPct, setCapPct] = useState(KNOB_DEFAULTS.capPct)
  const [demPct, setDemPct] = useState(KNOB_DEFAULTS.demPct)
  const [etaGap, setEtaGap] = useState(KNOB_DEFAULTS.etaGap)
  const [simHazard, setSimHazard] = useState(KNOB_DEFAULTS.simHazard)
  const [simShock, setSimShock] = useState(KNOB_DEFAULTS.simShock)
  const [simSpeed, setSimSpeed] = useState(KNOB_DEFAULTS.simSpeed)

  // Reset the whole section: the shared store back to the Normalized preset
  // (reusing the store's own applyPreset, so there's a single reset mechanism),
  // plus these local chart-only knobs, which the preset doesn't touch.
  function resetDefaults() {
    applyPreset('normalized')
    setRegimeTab(KNOB_DEFAULTS.regimeTab)
    setCurvature(KNOB_DEFAULTS.curvature)
    setCapPct(KNOB_DEFAULTS.capPct)
    setDemPct(KNOB_DEFAULTS.demPct)
    setEtaGap(KNOB_DEFAULTS.etaGap)
    setSimHazard(KNOB_DEFAULTS.simHazard)
    setSimShock(KNOB_DEFAULTS.simShock)
    setSimSpeed(KNOB_DEFAULTS.simSpeed)
  }

  const [copied, setCopied] = useState(false)

  // --- URL-hash sharing ------------------------------------------------------
  // On mount: restore Params from the hash if present (else keep the default).
  useEffect(() => {
    const restored = decodeHash(window.location.hash)
    if (restored) setParams(restored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On every Params change: mirror into the hash via replaceState (no scroll,
  // no history spam). Skip the very first run so we never clobber an incoming
  // navigation anchor before the mount-restore effect has run.
  const firstWrite = useRef(true)
  useEffect(() => {
    if (firstWrite.current) {
      firstWrite.current = false
      return
    }
    const url = `${window.location.pathname}${window.location.search}#${encodeParams(params)}`
    window.history.replaceState(null, '', url)
  }, [params])

  // --- Derived dashboard data (all pure model calls) -------------------------
  const alloc = useMemo(() => buildAllocationView(params), [params])
  const price = useMemo(() => buildPriceView(params), [params])
  const lead = useMemo(() => buildLeadershipView(params), [params])
  const regimePanels = useMemo(
    () => buildRegimePanels(params, { curvature, capPct, demPct, etaGap }),
    [params, curvature, capPct, demPct, etaGap],
  )
  const sim = useMemo(
    () =>
      simulateReleases({
        base: params,
        hazards: params.firms.map(() => simHazard),
        alpha: params.firms.map((f) => Math.log(Math.max(f.q, 1e-6))),
        A0: 0,
        g: 0.02,
        sigmaJump: simShock,
        adjustmentSpeed: simSpeed,
        periods: 40,
        seed: 0x9e3779b9, // fixed seed: the dashboard is a deterministic snapshot
      }),
    [params, simHazard, simShock, simSpeed],
  )

  // --- Preset manager --------------------------------------------------------
  // The two scripted S3 presets, adapted to write the GLOBAL store instead of
  // S3's local state. "Add more labs" — grow the firm list at binding capacity;
  // "Build more GPUs" — push K past the binding threshold with the firms fixed.
  function addMoreLabs() {
    const base = clonePreset(NORMALIZED)
    base.firms = [
      { name: 'Leader', q: 1.4, a: 1, b: 0 },
      { name: 'Follower A', q: 1.1, a: 1, b: 0 },
      { name: 'Follower B', q: 0.9, a: 1, b: 0 },
      { name: 'Follower C', q: 0.8, a: 1, b: 0 },
      { name: 'Follower D', q: 0.7, a: 1, b: 0 },
      { name: 'Follower E', q: 0.6, a: 1, b: 0 },
    ]
    base.K = 100
    setParams(base)
  }
  function buildMoreGPUs() {
    const base = clonePreset(NORMALIZED)
    base.K = 260 // past the binding threshold at the normalized firms
    setParams(base)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'llm-econ-params.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function copyShareableUrl() {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${encodeParams(params)}`
    const done = () => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done, done)
    } else {
      window.history.replaceState(null, '', `#${encodeParams(params)}`)
      done()
    }
  }

  const illustrative = calibration === 'illustrative'
  const badge = illustrative ? (
    <span className="explorer-badge" title="round numbers, not estimates">
      illustrative units
    </span>
  ) : null

  return (
    <section className="content-section" id={s8.anchor}>
      <style>{S8_CSS}</style>
      <p className="eyebrow">{s8.number}</p>
      <h2>{s8.title}</h2>

      <p className="explorer-banner">
        For readers comfortable with the full machinery — everything above is this page with training
        wheels.
      </p>

      <div className="section-body">{s8.body}</div>

      {/* Preset manager + export / share. */}
      <div className="preset-row">
        <button
          className={`preset-btn ${calibration === 'normalized' ? 'filled' : ''}`}
          onClick={() => applyPreset('normalized')}
        >
          Normalized
        </button>
        <button
          className={`preset-btn ${calibration === 'illustrative' ? 'filled' : ''}`}
          onClick={() => applyPreset('illustrative')}
        >
          Illustrative
        </button>
        <button className="preset-btn leader" onClick={addMoreLabs}>
          Add more labs
        </button>
        <button className="preset-btn leader" onClick={buildMoreGPUs}>
          Build more GPUs
        </button>
        <span style={{ flex: 1 }} />
        <button className="preset-btn" onClick={exportJson}>
          Export parameters (JSON)
        </button>
        <button className="preset-btn" onClick={copyShareableUrl}>
          {copied ? 'Link copied ✓' : 'Copy shareable link'}
        </button>
        <button type="button" className="reset-btn" onClick={resetDefaults}>
          Reset to defaults
        </button>
      </div>
      {illustrative && (
        <p className="chart-caption" style={{ color: 'var(--frontier)', fontWeight: 700 }}>
          Illustrative calibration — round numbers, not estimates. Displayed magnitudes are for
          intuition only.
        </p>
      )}

      <div className="explorer-layout" style={{ marginTop: 18 }}>
        {/* ---------------- Parameter panel ---------------- */}
        <div className="param-panel">
          <ParamGroup title="Market">
            <AdaptiveSlider label="Physical cost c" def={sliderDefs.c} value={params.c} min={0.1} max={3} step={0.05} onChange={(v) => setMarket({ c: v })} />
            <AdaptiveSlider label="Capacity K" def={sliderDefs.K} value={params.K} min={20} max={300} step={1} onChange={(v) => setMarket({ K: v })} />
            <AdaptiveSlider label="Purchaser mass N" def={sliderDefs.N} value={params.N} min={50} max={600} step={10} onChange={(v) => setMarket({ N: v })} />
            <AdaptiveSlider label="Willingness-to-pay θ_max" def={sliderDefs.thetaMax} value={params.thetaMax} min={2} max={20} step={0.5} onChange={(v) => setMarket({ thetaMax: v })} />
          </ParamGroup>

          <ParamGroup title="Firms">
            {params.firms.map((f, i) => (
              <div key={f.name} className={i === 0 ? undefined : 'param-firm'}>
                <div className="param-firm-name">
                  <span className="param-firm-swatch" style={{ background: color(i) }} />
                  {firmDisplayName(f.name)}
                </div>
                <AdaptiveSlider label="quality q" def={sliderDefs.quality} value={f.q} min={0.5} max={2.5} step={0.05} onChange={(v) => setFirm(i, { q: v })} />
                <AdaptiveSlider label="FLOPs / output a" def={sliderDefs.a} value={f.a} min={0.5} max={3} step={0.05} onChange={(v) => setFirm(i, { a: v })} />
                <AdaptiveSlider label="non-compute cost b" def={sliderDefs.b} value={f.b} min={0} max={1} step={0.05} onChange={(v) => setFirm(i, { b: v })} />
              </div>
            ))}
          </ParamGroup>

          <ParamGroup title="Dynamics">
            <AdaptiveSlider label="Interest rate r" def={sliderDefs.interestRate} value={params.dynamics.r} min={0.02} max={0.15} step={0.005} onChange={(v) => setDynamics({ r: v })} />
            <AdaptiveSlider label="Catch-up hazard Λ" def={sliderDefs.catchupHazard} value={params.dynamics.Lambda} min={0.1} max={1.5} step={0.05} onChange={(v) => setDynamics({ Lambda: v })} />
          </ParamGroup>

          <ParamGroup title="Regime (chart-only)">
            <AdaptiveSlider label="Curvature β" def={sliderDefs.beta} value={curvature} min={0.1} max={1} step={0.05} onChange={setCurvature} />
            <AdaptiveSlider label="Capacity growth (%/period)" def={sliderDefs.capacityGrowth} value={capPct} min={0} max={30} step={1} onChange={setCapPct} />
            <AdaptiveSlider label="Demand growth (%/period)" def={sliderDefs.demandGrowth} value={demPct} min={0} max={30} step={1} onChange={setDemPct} />
            <AdaptiveSlider label="Asymptote gap η_L/η_F" def={sliderDefs.etaGap} value={etaGap} min={1} max={1.6} step={0.01} onChange={setEtaGap} />
          </ParamGroup>

          <ParamGroup title="Release simulator (chart-only)">
            <AdaptiveSlider label="Release hazard / period" def={sliderDefs.releaseHazard} value={simHazard} min={0.05} max={0.6} step={0.01} onChange={setSimHazard} />
            <AdaptiveSlider label="Release-quality shock σ" def={sliderDefs.releaseShock} value={simShock} min={0.05} max={0.5} step={0.01} onChange={setSimShock} />
            <AdaptiveSlider label="Adjustment speed" def={sliderDefs.adjustmentSpeed} value={simSpeed} min={0.05} max={1} step={0.05} onChange={setSimSpeed} />
          </ParamGroup>
        </div>

        {/* ---------------- Dashboard ---------------- */}
        <div className="dash-grid">
          {/* Allocation. */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <h3>Allocation of scarce compute {badge}</h3>
            <div className="dash-readouts">
              <span>
                <Term term="shadowPrice">λ</Term> = <strong>{fmt(alloc.lambda)}</strong>{' '}
                ({alloc.capacityBinds ? 'capacity binds' : 'slack'})
              </span>
              <span>marginal purchaser θ = <strong>{fmt(alloc.marginalTheta)}</strong></span>
              {alloc.readouts.map((r) => (
                <span key={r.name} style={{ color: r.color }}>
                  {firmDisplayName(r.name)}: {pct(r.share)}{!r.active && ' (unfunded)'}
                </span>
              ))}
            </div>
            <MarginalValueChart firms={alloc.firms} K={alloc.K} c={alloc.c} lambda={alloc.lambda} />
            <ThetaStrip segments={alloc.thetaSegments} N={alloc.N} thetaMax={alloc.thetaMax} marginalTheta={alloc.marginalTheta} />
          </div>

          {/* Price anatomy. */}
          <div className="dash-card">
            <h3>What the purchaser pays</h3>
            <PriceStackBar decomposition={price.decomposition} quality={price.Q} binding={price.eq.binding} />
            <p className="chart-caption" style={{ color: 'var(--muted)' }}>
              Cournot view: leader as the representative good, {price.n}{' '}
              <Term term="cournot">competing</Term> labs.
            </p>
          </div>

          {/* Surplus shares. */}
          <div className="dash-card">
            <h3>Who gets the surplus</h3>
            <RentShareBar labShare={price.labShare} hyperShare={price.hyperShare} />
            <p className="chart-caption" style={{ color: 'var(--muted)' }}>Levels (not shares)</p>
            <div className="dash-readouts">
              <span>P* = <strong>{fmt(price.eq.P)}</strong></span>
              <span>r* = <strong>{fmt(price.eq.r)}</strong></span>
              <span>per-lab <Term term="markup">markup</Term> = <strong>{fmt(price.eq.perFirmMarkup)}</strong></span>
              <span>lab profit = <strong>{fmt(price.eq.labProfitAggregate)}</strong></span>
              <span>hyperscaler <Term term="scarcityRent">rent</Term> = <strong>{fmt(price.scarcityPie)}</strong></span>
            </div>
          </div>

          {/* Binding region. */}
          <div className="dash-card">
            <h3>Where is capacity the bottleneck?</h3>
            <BindingRegionPlot A={price.A} B={price.B} a={price.a} b={price.b} c={params.c} n={price.n} K={params.K} />
          </div>

          {/* Leadership value. */}
          <div className="dash-card">
            <h3>What a lead is worth</h3>
            <div className="value-tile">
              <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: '.9rem' }}>
                The <Term term="valueFormula">value formula</Term> V = Δπ / (r + Λ) turns a flow
                premium and a catch-up <Term term="hazard">hazard</Term> into a stock of value.
              </p>
              <div className="dash-readouts">
                <span>Δπ = <strong>{fmt(lead.deltaPi)}</strong> (derived)</span>
                <span>r = <strong>{fmt(lead.r)}</strong></span>
                <span>Λ = <strong>{fmt(lead.Lambda)}</strong></span>
              </div>
              <div>
                <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Value of the lead </span>
                <span className="big">{Number.isFinite(lead.value) ? fmt(lead.value) : '∞'}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '.9rem', lineHeight: 1.5 }}>
                {firmDisplayName(lead.leaderName)}'s lead earns about {fmt(lead.deltaPi)} per period; with leadership
                lasting roughly {Number.isFinite(lead.expectedLife) ? fmt(lead.expectedLife) : '∞'}{' '}
                periods on average it is worth about{' '}
                {Number.isFinite(lead.value) ? fmt(lead.value) : '∞'} today. Δπ is read from the
                current market, not dialed; r and Λ are the Dynamics knobs at left.
              </p>
              <p className="explorer-caveat">
                In reality the prize and the catch-up risk move together — a fatter prize attracts
                more challenger spending, shortening leads. Treat these as a snapshot, not independent
                levers.
              </p>
            </div>
          </div>

          {/* Release race. */}
          <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
            <h3>After a new model release</h3>
            <p className="chart-caption" style={{ color: 'var(--muted)' }}>
              Deterministic snapshot (fixed seed); the Release-simulator knobs at left reshape it.
            </p>
            <RaceTimeline periods={sim.periods} firmNames={params.firms.map((f) => f.name)} />
          </div>

          {/* Regimes. */}
          {regimePanels.length > 0 && (
            <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
              <h3>Three technological futures</h3>
              <RegimePaths panels={regimePanels} active={regimeTab} onSelect={setRegimeTab} />
            </div>
          )}
        </div>
      </div>

      {s8.derivation && <Derivation id={`${s8.anchor}-derivation`}>{s8.derivation}</Derivation>}
    </section>
  )
}
