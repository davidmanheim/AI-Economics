// S4 — "Life behind the frontier" — hosts the price-ladder micro-widget
// (plan §4.4). Renders the S4 narrative body and derivation from content/copy.tsx
// alongside a LadderDiagram for a trailing laboratory. The market value of
// compute r* is computed from the same symmetric-Cournot mapping S3 uses (no
// cross-section state sharing yet — sensible local defaults matching S3).
//
// All math imported from src/model.

import { useMemo, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Term } from '../components/Term'
import { LadderDiagram, type LadderRungs } from '../components/charts/LadderDiagram'
import { sections } from '../content/copy'
import { cournotEquilibrium, linearDemandFromVertical } from '../model/cournot'
import { NORMALIZED } from '../model/presets'

const s4 = sections.find((s) => s.id === 's4')!

// Reference market → market value of compute r*. The demand curve (A, B) and the
// representative frontier firm (REP) come from the S3 symmetric-Cournot defaults
// and stay fixed; the two levers that most legibly move r* — how many labs share
// the market and how much capacity each holds — are exposed via the advanced
// panel below and default to the S3 reference scenario (3 labs, capacity 100).
const N = NORMALIZED.N
const thetaMax = NORMALIZED.thetaMax
const REP = NORMALIZED.firms[0]
const { A, B } = linearDemandFromVertical(REP.a * REP.q, N, thetaMax)

// Trailing firm: use the weakest normalized follower's cost shape (a_j, b_j).
const TRAILER = NORMALIZED.firms[2] // Follower B, a=1, b=0
const aj = TRAILER.a
const bj = TRAILER.b

// Reference-market and rung defaults. Named so "Reset to defaults" restores
// exactly what the widget opens with, including the advanced fields.
const DEFAULT_CAPACITY = 100
const DEFAULT_LABS = 3
// Illustrative amortized fixed cost per output on top of the opportunity cost;
// clearly a round number, not an estimate — it only sets the top rung.
const DEFAULT_FIXED_PER_UNIT = 1.6

/** r* for a given reference market (lab count and per-lab capacity). */
const rStarFor = (labs: number, capacity: number) =>
  cournotEquilibrium(A, B, REP.a, REP.b, 1, labs, capacity).r

const DEFAULT_R_STAR = rStarFor(DEFAULT_LABS, DEFAULT_CAPACITY)
const DEFAULT_RJ = 0.75 * DEFAULT_R_STAR
const DEFAULT_PRICE = DEFAULT_R_STAR + 0.8 // opens in the "below ATC" band

const fmt = (v: number) => v.toFixed(1)

export function S4TrailingLabs() {
  const [rj, setRj] = useState(DEFAULT_RJ)
  const [price, setPrice] = useState(DEFAULT_PRICE)
  // Advanced, reference-market state — previously frozen module constants.
  const [refLabs, setRefLabs] = useState(DEFAULT_LABS)
  const [refCapacity, setRefCapacity] = useState(DEFAULT_CAPACITY)
  const [fixedPerUnit, setFixedPerUnit] = useState(DEFAULT_FIXED_PER_UNIT)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // r* and everything anchored to it now recompute from the live reference market.
  const rStar = useMemo(() => rStarFor(refLabs, refCapacity), [refLabs, refCapacity])
  const ladderMax = useMemo(
    () => rStar + fixedPerUnit + bj / aj + 2.5,
    [rStar, fixedPerUnit],
  )

  const rungs: LadderRungs = {
    cash: rj + bj / aj,
    opportunity: rStar + bj / aj,
    averageTotal: rStar + bj / aj + fixedPerUnit,
  }

  return (
    <section className="content-section" id={s4.anchor}>
      <p className="eyebrow">{s4.number}</p>
      <h2>{s4.title}</h2>
      <div className="section-body">{s4.body}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(220px, 320px)', gap: 28, alignItems: 'start', marginTop: 20 }}>
        <LadderDiagram price={price} rungs={rungs} min={0} max={ladderMax} onChange={setPrice} />

        <div>
          <p style={{ fontSize: '.9rem', color: 'var(--muted)', marginTop: 0 }}>
            Drag the handle, or use the sliders. The market value of a FLOP is fixed at{' '}
            <strong>r* = {fmt(rStar)}</strong> (from the S3 symmetric-Cournot defaults).
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            <Slider label="Trailing firm's price, p_j" def={sliderDefs.pj} value={Number(price.toFixed(1))} min={0} max={Number(ladderMax.toFixed(1))} step={0.1} onChange={setPrice} />
            <Slider label="Its contracted compute price, r_j" def={sliderDefs.rj} value={Number(rj.toFixed(1))} min={Number((0.5 * rStar).toFixed(1))} max={Number(rStar.toFixed(1))} step={0.1} onChange={setRj} />
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
                r* and the cost rungs above come from a small reference market, held fixed by
                default — reshape it here. Fewer labs or tighter capacity make compute scarcer and
                push r* up.
              </p>
              <div style={{ display: 'grid', gap: 14 }}>
                <Slider label="Reference market: number of labs, n" def={sliderDefs.n} value={refLabs} min={1} max={8} step={1} onChange={setRefLabs} />
                <Slider label="Reference market: capacity per lab, K" def={sliderDefs.K} value={refCapacity} min={40} max={200} step={5} onChange={setRefCapacity} />
                <Slider label="Amortized fixed cost per output" def={sliderDefs.fixedPerUnit} value={Number(fixedPerUnit.toFixed(1))} min={0} max={4} step={0.1} onChange={setFixedPerUnit} />
              </div>
            </div>
          )}

          <div className="reset-row">
            <button
              type="button"
              className="reset-btn"
              onClick={() => {
                setRj(DEFAULT_RJ)
                setPrice(DEFAULT_PRICE)
                setRefLabs(DEFAULT_LABS)
                setRefCapacity(DEFAULT_CAPACITY)
                setFixedPerUnit(DEFAULT_FIXED_PER_UNIT)
              }}
            >
              Reset to defaults
            </button>
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 14 }}>
            When <Katex_r_j /> sits below r*, the firm holds cheaper contracted or sunk compute — the
            gap between its cash cost and the market's <Term term="opportunityCost">opportunity
            cost</Term> is exactly what the "below opportunity cost" rung measures. Pricing under its
            own cash cost is <Term term="lossLeading">loss-leading</Term>.
          </p>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
            The average-total-cost rung adds an illustrative amortized fixed cost of {fmt(fixedPerUnit)}{' '}
            per output — a round number for the diagram, not an estimate.
          </p>
        </div>
      </div>

      {s4.derivation && <Derivation id={`${s4.anchor}-derivation`}>{s4.derivation}</Derivation>}
    </section>
  )
}

// Tiny inline helper to keep r_j styled consistently with the surrounding prose.
function Katex_r_j() {
  return <em>r_j</em>
}
