// S5 — "What happens after a new model release" (plan §4.5). Hosts M3:
//   - the seeded release-race timeline (RaceTimeline), driven by three sim
//     controls plus a re-run / same-seed pair, and
//   - a leadership-value calculator: r and Lambda are dials, but Δπ is DERIVED
//     from the simulated market state (leader's laboratory rent minus what it
//     would keep if the closest follower matched its quality) — never a free
//     dial, per the honesty guardrail.
//
// Narrative body and derivation come from content/copy.tsx (id `s5`); this file
// adds only the interactive shell and the short prose around the controls.

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  simulateReleases,
  vLead,
  type ReleasePeriod,
} from '../model/dynamics'
import { surplusSplit, vIntercept } from '../model/allocation'
import { clonePreset, NORMALIZED } from '../model/presets'
import type { Params } from '../model/types'
import { RaceTimeline } from '../components/charts/RaceTimeline'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Katex } from '../components/Katex'
import { Term } from '../components/Term'
import { Derivation } from '../components/Derivation'
import { firmDisplayName } from '../lib/displayName'
import { sections } from '../content/copy'

const PERIODS = 40
const PLAY_INTERVAL_MS = 320 // period-to-period cadence during auto-play

// Slider defaults, shared by initial state and "Reset to defaults".
const DEFAULT_HAZARD = 0.2
const DEFAULT_SHOCK = 0.2
const DEFAULT_SPEED = 0.4
// Advanced (secondary) defaults — previously hardcoded constants now exposed as
// sliders behind the "Advanced variables" toggle.
const DEFAULT_DRIFT = 0.02 // per-period frontier rise g (log-quality)
const DEFAULT_QUALITIES = NORMALIZED.firms.map((f) => f.q) // starting q per firm

const newSeed = () => (Math.random() * 0x100000000) >>> 0

/** Shared pill style for the playback buttons. `primary` fills the Play control. */
function playBtnStyle(disabled: boolean, primary = false): CSSProperties {
  return {
    padding: '7px 14px',
    borderRadius: 999,
    border: '1px solid var(--line)',
    background: disabled ? 'var(--surface)' : primary ? 'var(--accent)' : 'var(--surface)',
    color: disabled ? 'var(--muted)' : primary ? '#fff' : 'var(--ink)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: '.9rem',
  }
}

/** True when the visitor has asked the OS to minimize motion. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}
const fmt = (v: number, d = 2) => v.toFixed(d)

/** Index of the firm with the highest marginal-value intercept v_m(0). */
function leaderIndex(firms: Params['firms'], thetaMax: number): number {
  let idx = 0
  let best = -Infinity
  firms.forEach((f, i) => {
    const v0 = vIntercept(f.q, f.a, f.b, thetaMax)
    if (v0 > best) {
      best = v0
      idx = i
    }
  })
  return idx
}

/**
 * Δπ derived from the current simulated market (NOT a dial): the leader's
 * laboratory differential rent now, minus the rent it would keep if the closest
 * follower matched its quality. This is π_L^lead − π_L^follow from the paper's
 * Section 10, computed from the shared model rather than exposed as a slider.
 */
function deriveDeltaPi(base: Params, deployedQ: number[]): number {
  const firms = base.firms.map((f, i) => ({ ...f, q: deployedQ[i] }))
  const lead: Params = { ...base, firms }
  const li = leaderIndex(firms, base.thetaMax)

  const piLead = surplusSplit(lead).perFirmLabRent[li]

  // Closest follower = highest v-intercept among the non-leaders.
  let fi = -1
  let best = -Infinity
  firms.forEach((f, i) => {
    if (i === li) return
    const v0 = vIntercept(f.q, f.a, f.b, base.thetaMax)
    if (v0 > best) {
      best = v0
      fi = i
    }
  })
  if (fi < 0) return Math.max(0, piLead)

  const matched = firms.map((f, i) =>
    i === fi ? { ...f, q: firms[li].q } : f,
  )
  const piFollow = surplusSplit({ ...base, firms: matched }).perFirmLabRent[li]

  return Math.max(0, piLead - piFollow)
}

interface CalculatorProps {
  deltaPi: number
  leaderName: string
}

function LeadershipCalculator({ deltaPi, leaderName }: CalculatorProps) {
  const [r, setR] = useState(0.05)
  const [Lambda, setLambda] = useState(0.5)

  const V = vLead(deltaPi, r, Lambda)
  const expectedLife = 1 / Lambda

  return (
    <div
      style={{
        marginTop: 28,
        padding: 20,
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--surface)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <h3 style={{ margin: '0 0 4px' }}>What a lead is worth</h3>
      <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '.95rem' }}>
        The <Term term="valueFormula">value formula</Term>{' '}
        <Katex math="V_L^{\text{lead}} = \Delta\pi / (r + \Lambda)" /> turns a flow
        premium and a catch-up <Term term="hazard">hazard</Term> into a stock of
        value.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          alignItems: 'end',
        }}
      >
        {/* Δπ — derived, not a dial */}
        <div>
          <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
            Δπ — flow premium of the lead
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {fmt(deltaPi)}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--accent)', fontWeight: 700 }}>
            DERIVED from the simulated market — not a dial
          </div>
        </div>

        <Slider
          label="r — interest rate"
          def={sliderDefs.interestRate}
          value={r}
          min={0.02}
          max={0.15}
          step={0.005}
          onChange={setR}
        />
        <Slider
          label="Λ — catch-up hazard (per period)"
          def={sliderDefs.catchupHazard}
          value={Lambda}
          min={0.1}
          max={1.5}
          step={0.05}
          onChange={setLambda}
        />
      </div>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 14,
        }}
      >
        <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
          Value of the lead
        </span>
        <span style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-.03em' }}>
          {Number.isFinite(V) ? fmt(V) : '∞'}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', maxWidth: 640, lineHeight: 1.55 }}>
        {firmDisplayName(leaderName)}'s lead earns about <strong>{fmt(deltaPi)}</strong> in extra
        profit per period. With a catch-up hazard of {fmt(Lambda, 2)} — leadership
        lasting roughly <strong>{fmt(expectedLife, 1)} periods</strong> on average
        — the whole lead is worth about <strong>{Number.isFinite(V) ? fmt(V) : '∞'}</strong>{' '}
        today. Catch-up risk discounts it exactly like extra impatience.
      </p>

      {/* Required honesty guardrail — must be visually present (plan §4.5(c)). */}
      <p
        style={{
          margin: '18px 0 0',
          padding: '12px 14px',
          borderLeft: '3px solid var(--frontier)',
          background: 'rgba(220,108,47,.08)',
          fontSize: '.92rem',
          lineHeight: 1.5,
        }}
      >
        In reality the prize and the catch-up risk move together — a fatter prize
        attracts more challenger spending, shortening leads. Treat these dials as a
        snapshot, not independent levers.
      </p>
    </div>
  )
}

export function S5ReleaseRace() {
  const s5 = sections.find((s) => s.id === 's5')!

  // Sim controls.
  const [hazard, setHazard] = useState(DEFAULT_HAZARD)
  const [shock, setShock] = useState(DEFAULT_SHOCK) // σ of the release-quality shock ν
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [seed, setSeed] = useState(() => newSeed())
  const [sameSeed, setSameSeed] = useState(false)

  // Advanced (secondary) controls — previously fixed constants. Collapsed by
  // default behind the "Advanced variables" toggle. `qualities` are the per-firm
  // starting quality levels (deployed q and the release-target scale); `drift` is
  // the per-period frontier rise g.
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [qualities, setQualities] = useState<number[]>(DEFAULT_QUALITIES)
  const [drift, setDrift] = useState(DEFAULT_DRIFT)

  // Bumped by "Reset to defaults" to remount the leadership calculator, which
  // returns its r / Λ dials to their initial defaults.
  const [calcResetKey, setCalcResetKey] = useState(0)

  // Base preset with the starting qualities overridden by the advanced sliders.
  // The firm names / a / b / thetaMax stay from NORMALIZED; only q is reactive.
  const base = useMemo(() => {
    const p = clonePreset(NORMALIZED)
    p.firms.forEach((f, i) => {
      if (qualities[i] != null) f.q = qualities[i]
    })
    return p
  }, [qualities])

  const sim = useMemo(
    () =>
      simulateReleases({
        base,
        hazards: base.firms.map(() => hazard),
        alpha: base.firms.map((f) => Math.log(f.q)),
        A0: 0,
        g: drift,
        sigmaJump: shock,
        adjustmentSpeed: speed,
        periods: PERIODS,
        seed,
      }),
    [base, hazard, shock, speed, seed, drift],
  )

  const periods: ReleasePeriod[] = sim.periods
  const firmNames = base.firms.map((f) => f.name)
  const last = periods[periods.length - 1]

  const deltaPi = useMemo(
    () => deriveDeltaPi(base, last.q),
    [base, last],
  )

  // Playback -------------------------------------------------------------
  // `reveal` is how many periods the chart has "unfolded" so far. It rests at
  // the full length (static, whole-run view) and only shrinks when the reader
  // presses Play/Step to watch it build up.
  const reducedMotion = usePrefersReducedMotion()
  const [reveal, setReveal] = useState(periods.length)
  const [playing, setPlaying] = useState(false)

  // A fresh simulation (new seed or changed slider) snaps back to the full
  // static view and stops any run in progress.
  useEffect(() => {
    setReveal(periods.length)
    setPlaying(false)
  }, [sim, periods.length])

  // Auto-advance while playing. Never runs under reduced-motion (Play there
  // reveals instantly instead), and always cleaned up on unmount.
  useEffect(() => {
    if (!playing || reducedMotion) return
    const id = setInterval(() => {
      setReveal((r) => {
        if (r >= periods.length) {
          setPlaying(false)
          return r
        }
        return r + 1
      })
    }, PLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [playing, reducedMotion, periods.length])

  const atEnd = reveal >= periods.length
  const atStart = reveal <= 1

  const play = () => {
    if (reducedMotion) {
      setReveal(periods.length) // instant reveal, no motion
      return
    }
    // Restart from the top if we're sitting at the end.
    if (atEnd) setReveal(1)
    setPlaying(true)
  }
  const pause = () => setPlaying(false)
  const stepForward = () => {
    setPlaying(false)
    setReveal((r) => Math.min(periods.length, r + 1))
  }
  const stepBack = () => {
    setPlaying(false)
    setReveal((r) => Math.max(1, r - 1))
  }

  const reRun = () => {
    if (!sameSeed) setSeed(newSeed())
  }

  const resetDefaults = () => {
    setHazard(DEFAULT_HAZARD)
    setShock(DEFAULT_SHOCK)
    setSpeed(DEFAULT_SPEED)
    // Advanced fields too: any change to these rebuilds `base`/`sim`, which the
    // reveal effect already treats like any slider change (snaps the timeline
    // back to the full static view and stops playback).
    setQualities(DEFAULT_QUALITIES)
    setDrift(DEFAULT_DRIFT)
    setCalcResetKey((k) => k + 1)
    // Seed is intentionally left untouched — it has its own Re-run / Same-seed
    // controls, so a reader can restore the sliders to baseline while holding
    // the current story fixed for comparison.
  }

  return (
    <section className="content-section" id={s5.anchor}>
      <p className="eyebrow">{s5.number}</p>
      <h2>{s5.title}</h2>
      <div className="section-body">{s5.body}</div>

      {/* Sim controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          margin: '10px 0 24px',
        }}
      >
        <Slider
          label="Challenger release hazard (per period)"
          def={sliderDefs.releaseHazard}
          value={hazard}
          min={0.05}
          max={0.6}
          step={0.01}
          onChange={setHazard}
        />
        <Slider
          label="Release-quality shock (ν, σ)"
          def={sliderDefs.releaseShock}
          value={shock}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={setShock}
        />
        <Slider
          label="Adjustment speed (how fast customers switch)"
          def={sliderDefs.adjustmentSpeed}
          value={speed}
          min={0.05}
          max={1}
          step={0.05}
          onChange={setSpeed}
        />
      </div>

      {/* Advanced variables — previously fixed constants, collapsed by default.
          Changing any of these rebuilds the simulation, which the reveal effect
          treats exactly like a primary-slider change (snaps back to the full
          static view and stops playback). */}
      <button
        type="button"
        className="advanced-toggle"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced((o) => !o)}
      >
        <span className="chevron" aria-hidden="true">▸</span>
        Advanced variables
      </button>

      {showAdvanced && (
        <div className="advanced-panel">
          <p className="advanced-panel-note">
            These are held fixed above so the main sliders stay focused on the
            release dynamics. Each lab's starting quality sets both where it begins
            and the scale of its future releases, so a wider gap makes the lead
            harder to overturn. Frontier drift is the background pace at which the
            state of the art rises on its own, independent of any single lab.
          </p>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            {base.firms.map((f, i) => (
              <Slider
                key={f.name}
                label={`${firmDisplayName(f.name)} — starting quality`}
                def={sliderDefs.quality}
                value={qualities[i]}
                min={0.6}
                max={2.4}
                step={0.05}
                onChange={(v) =>
                  setQualities((qs) => qs.map((q, j) => (j === i ? v : q)))
                }
              />
            ))}
            <Slider
              label="Frontier drift (g — background rise per period)"
              def={sliderDefs.frontierDrift}
              value={drift}
              min={0}
              max={0.06}
              step={0.005}
              onChange={setDrift}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          marginBottom: 8,
          marginTop: 24,
        }}
      >
        <button
          onClick={reRun}
          disabled={sameSeed}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            background: sameSeed ? 'var(--surface)' : 'var(--accent)',
            color: sameSeed ? 'var(--muted)' : '#fff',
            cursor: sameSeed ? 'not-allowed' : 'pointer',
            fontWeight: 700,
          }}
        >
          Re-run (new seed)
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.9rem' }}>
          <input
            type="checkbox"
            checked={sameSeed}
            onChange={(e) => setSameSeed(e.target.checked)}
          />
          Same seed (reproducible comparison)
        </label>
        <span className="chart-chip" title="Random seed for this run. Same seed + same sliders = identical timeline.">
          seed {seed}
        </span>
        <button
          onClick={resetDefaults}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontWeight: 700,
            marginLeft: 'auto',
          }}
        >
          Reset to defaults
        </button>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: '.85rem', color: 'var(--muted)', maxWidth: 640, lineHeight: 1.5 }}>
        <strong>Re-run</strong> randomizes the story with a new seed;{' '}
        <strong>Same seed</strong> holds this exact story fixed so you can change
        the sliders and watch only that effect. <strong>Reset to defaults</strong>{' '}
        returns the sliders and dials to baseline (the seed stays put).
      </p>

      <p className="section-body" style={{ marginBottom: 12 }}>
        Each release lifts a laboratory's quality; compute shares partial-adjust
        toward the new static equilibrium, and the bottom strip tracks how the{' '}
        <Term term="scarcityRent">scarcity rent</Term> divides between laboratories
        and the hyperscaler across the run — labs gaining just after breakthroughs,
        the hyperscaler gaining as followers catch up.
      </p>

      {/* Playback controls — reveal the run period by period */}
      <div
        role="group"
        aria-label="Timeline playback"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          margin: '4px 0 14px',
        }}
      >
        <button
          onClick={stepBack}
          disabled={atStart}
          aria-label="Step back one period"
          style={playBtnStyle(atStart)}
        >
          ◀ Step
        </button>
        {reducedMotion ? (
          <button
            onClick={play}
            disabled={atEnd}
            style={playBtnStyle(atEnd, true)}
          >
            Reveal all
          </button>
        ) : playing ? (
          <button onClick={pause} style={playBtnStyle(false, true)}>
            ⏸ Pause
          </button>
        ) : (
          <button onClick={play} style={playBtnStyle(false, true)}>
            ▶ {atEnd ? 'Replay' : 'Play'}
          </button>
        )}
        <button
          onClick={stepForward}
          disabled={atEnd}
          aria-label="Step forward one period"
          style={playBtnStyle(atEnd)}
        >
          Step ▶
        </button>
        <span className="chart-chip" aria-live="polite">
          period {Math.min(reveal, periods.length)} / {periods.length}
        </span>
        {reducedMotion && (
          <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
            Auto-play off (reduced motion) — step through manually.
          </span>
        )}
      </div>

      <RaceTimeline
        periods={periods}
        firmNames={firmNames}
        revealCount={reveal}
      />

      <LeadershipCalculator
        key={calcResetKey}
        deltaPi={deltaPi}
        leaderName={last.leader}
      />

      {s5.derivation && (
        <Derivation id={`${s5.anchor}-derivation`}>{s5.derivation}</Derivation>
      )}
    </section>
  )
}
