// S2 — When one model wins everything, and when it doesn't (plan Section 4.2).
// Continues M1 with a second view of the same chart: the winner-take-all
// comparison overlay (leader's value for the last of all K units vs each
// follower's best first use), a banner that flips between WINNER-TAKE-ALL and
// COEXISTENCE as the sliders move, and a "find the tipping point" button that
// raises leader quality until the condition flips.
//
// Honesty guardrail (plan Section 4.2c / 7.5, and the paper's own wording in
// sec:concentration): the copy says the model *identifies the condition*, it
// does not say winner-take-most is unlikely — the outcome depends on curvature
// the model deliberately leaves open.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Derivation } from '../components/Derivation'
import { MarginalValueChart } from '../components/charts/MarginalValueChart'
import { Slider } from '../components/Slider'
import { sliderDefs } from '../components/sliderDefs'
import { Term } from '../components/Term'
import { firmDisplayName } from '../lib/displayName'
import { sections } from '../content/copy'
import { vIntercept, wtaTest } from '../model/allocation'
import { gaussian, mulberry32 } from '../model/dynamics'
import { TASK_NAMES } from '../model/subscriptions'
import {
  AllocationSliders,
  buildComparison,
  buildParams,
  DEFAULT_ALLOCATION_STATE,
  SLIDER_RANGES,
  useAllocationControls,
  useAllocationModel,
  type AllocationState,
} from './S1Allocation'

const numFmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))

/**
 * Five paper mechanisms for coexistence. Only productivity differences is simulated in
 * this chart. `proven` flags the one mechanism the paper has since formalized as a result
 * (Proposition 1, prop:segment-wta, under a stated separability assumption) rather than
 * merely asserted; it is still `simulated: false` because the chart only models the
 * single-quality case, but it is rendered distinctly from the three still-asserted routes.
 */
const COEXISTENCE_MECHANISMS: { label: string; simulated: boolean; proven?: boolean }[] = [
  { label: 'Productivity differences', simulated: true },
  { label: 'Task / segment strengths', simulated: true, proven: true },
  { label: 'Horizontal differentiation', simulated: false },
  { label: 'Different compute contracts', simulated: false },
  { label: 'Multi-tier product lines', simulated: false },
]

/**
 * Segment-level version of the winner-take-all test (Proposition 1 /
 * subsec:task-segmentation): within one task, compare the top two v_{ell,k}(0)
 * intercepts against the common clearing value r*. The task has a sole
 * provider exactly when the runner-up's intercept doesn't clear r*.
 */
interface SegmentResult {
  label: string
  leaderName: string
  soleProvider: boolean
  leaderV0: number
  runnerUpV0: number
}

function segmentResult(
  label: string,
  firms: { name: string; q: number }[],
  a: number,
  b: number,
  thetaMax: number,
  rStar: number,
): SegmentResult {
  const ranked = firms
    .map((f) => ({ name: f.name, v0: vIntercept(f.q, a, b, thetaMax) }))
    .sort((x, y) => y.v0 - x.v0)
  const [top, runnerUp] = ranked
  return {
    label,
    leaderName: top.name,
    soleProvider: runnerUp.v0 <= rStar,
    leaderV0: top.v0,
    runnerUpV0: runnerUp.v0,
  }
}

/**
 * Draw each firm's per-task quality as a lognormal multiplier of its own
 * aggregate q — no lab chooses which task it's strongest at. The multiplier
 * has mean 1 (mean-preserving spread, matching the paper's normalization
 * sum_k w_k beta_{ell,k} = 0 on the bridging paragraph in Section 6), so a
 * firm's task-average capability stays anchored to its own overall quality
 * level and only the task-to-task dispersion is under the reader's control.
 */
function drawTaskResults(
  seed: number,
  dispersion: number,
  firms: { name: string; q: number }[],
  a: number,
  b: number,
  thetaMax: number,
  rStar: number,
): SegmentResult[] {
  const rng = mulberry32(seed)
  return TASK_NAMES.map((taskName) => {
    const firmsAtTask = firms.map((f) => {
      const z = gaussian(rng)
      const multiplier = Math.exp(dispersion * z - 0.5 * dispersion * dispersion)
      return { name: f.name, q: f.q * multiplier }
    })
    return segmentResult(taskName, firmsAtTask, a, b, thetaMax, rStar)
  })
}

/** Smallest q_L (holding the other sliders) at which the WTA condition first holds. */
function findTippingQL(state: AllocationState): number | null {
  const step = 0.01
  for (let qL = state.qL; qL <= 12; qL += step) {
    if (wtaTest(buildParams({ ...state, qL })).isWTA) return Math.round(qL * 100) / 100
  }
  return null
}

export function S2WinnerTakeMost() {
  const section = sections.find((s) => s.id === 's2')!
  const { state, set, setState } = useAllocationControls()
  const model = useAllocationModel(state)
  const comparison = buildComparison(model)

  const [critical, setCritical] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [tasksOn, setTasksOn] = useState(false)
  const [dispersion, setDispersion] = useState(0.25)
  const [seed, setSeed] = useState(1)

  // Five-task demo: no lab picks which task it's best at. Each firm's per-task
  // quality is a random draw around its own aggregate q (see drawTaskResults),
  // run through the same v_ell,k(0) vs r* test as Proposition 1, one task at a
  // time, over the same five task types the subscriptions section uses.
  const { a: firmA, b: firmB } = model.params.firms[0]
  const rStar = model.params.c + model.lambda
  const taskResults = useMemo(
    () =>
      drawTaskResults(
        seed,
        dispersion,
        [
          { name: 'Leader', q: state.qL },
          { name: 'Follower A', q: state.qA },
          { name: 'Follower B', q: state.qB },
        ],
        firmA,
        firmB,
        model.params.thetaMax,
        rStar,
      ),
    [seed, dispersion, state.qL, state.qA, state.qB, firmA, firmB, model.params.thetaMax, rStar],
  )

  // Clean up any running animation on unmount.
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  function findTippingPoint() {
    if (timer.current) clearInterval(timer.current)
    const target = findTippingQL(state)
    setCritical(target)
    if (target === null || target <= state.qL) return
    timer.current = setInterval(() => {
      setState((s) => {
        const next = Math.round((s.qL + 0.02) * 100) / 100
        if (next >= target) {
          if (timer.current) clearInterval(timer.current)
          return { ...s, qL: target }
        }
        return { ...s, qL: next }
      })
    }, 40)
  }

  function resetDefaults() {
    if (timer.current) clearInterval(timer.current)
    setCritical(null)
    setState(DEFAULT_ALLOCATION_STATE)
    setDispersion(0.25)
    setSeed(1)
  }

  const banner = comparison.isWta ? 'WINNER-TAKE-ALL' : 'COEXISTENCE'

  return (
    <section className="content-section" id={section.anchor}>
      <p className="eyebrow">{section.number}</p>
      <h2>{section.title}</h2>
      <div className="section-body">{section.body}</div>

      <div className="module">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: 14,
            padding: '16px 20px',
            margin: '8px 0',
            borderRadius: 10,
            border: `2px solid ${comparison.isWta ? 'var(--leader)' : 'var(--accent)'}`,
            background: comparison.isWta ? 'rgba(102,70,213,.08)' : 'var(--accent-pale)',
          }}
        >
          <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-.02em', color: comparison.isWta ? 'var(--leader)' : 'var(--accent)' }}>{banner}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            {firmDisplayName(comparison.leaderName)}'s value for the last of all K units, v_L(K) = {numFmt(comparison.vLeaderAtK)},{' '}
            {comparison.isWta ? 'clears' : 'falls short of'} the best follower's first use ={' '}
            {numFmt(Math.max(...comparison.followerBestUse.map((f) => f.v)))}.
          </span>
        </div>

        <p style={{ maxWidth: 720, fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--ink)' }}>
          Whether you land on <Term term="winnerTakeMost">winner-take-most</Term> or literal
          winner-take-all depends on how steeply each firm's <Term term="marginalValue">marginal
          value</Term> falls off, which you can explore in the graph below.
        </p>

        {/* Capacity is capped tighter than S1's: v_L(K) — the leader's value for the very
            last of K units, evaluated as if it alone held all of K — turns negative once K
            pushes past where the demand curve still has willing buyers, which makes this
            chart's WTA comparison unreadable at S1's full 20-300 range. */}
        <AllocationSliders state={state} set={set} kRange={{ min: 20, max: 100, step: SLIDER_RANGES.K.step }} />
        <div className="reset-row">
          <button type="button" className="reset-btn" onClick={resetDefaults}>
            Reset to defaults
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, margin: '12px 0' }}>
          <button
            onClick={findTippingPoint}
            style={{
              cursor: 'pointer',
              border: '1px solid var(--accent)',
              borderRadius: 999,
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            Find the tipping point (raise q_L until it flips)
          </button>
          {critical !== null && (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Condition first holds at q_L ≈ {numFmt(critical)}
              {critical > SLIDER_RANGES.qL.max && ' (beyond the slider range)'}.
            </span>
          )}
          {critical === null && (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              (press to sweep leader quality upward)
            </span>
          )}
        </div>

        <MarginalValueChart
          firms={model.firms}
          K={model.params.K}
          c={model.params.c}
          lambda={model.lambda}
          comparison={comparison}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span className="chart-caption" style={{ margin: 0 }}>Five routes to coexistence</span>
          {COEXISTENCE_MECHANISMS.map((m) => {
            // Three visual states: plain simulated (default accent chip), proven — whether or
            // not simulated here — (accent outline + "proven" suffix, marking the mechanism
            // formalized as Proposition 1), and still-asserted (muted grey, as before).
            const style = m.proven
              ? { border: '1px solid var(--accent)', fontWeight: 800 as const }
              : m.simulated
                ? undefined
                : { background: 'var(--line)', color: 'var(--muted)' }
            const suffix = m.proven ? ' · proven' : m.simulated ? '' : ' · not simulated'
            const title = m.proven
              ? `Formalized in the paper as Proposition 1${m.simulated ? ' — try the five-task toggle below' : ', under a stated separability assumption'}`
              : m.simulated
                ? 'Simulated in this chart'
                : 'Real, but not simulated here'
            return (
              <span key={m.label} className="chart-chip" style={style} title={title}>
                {m.label}{suffix}
              </span>
            )
          })}
        </div>

        <button
          type="button"
          className="advanced-toggle"
          aria-expanded={tasksOn}
          onClick={() => setTasksOn((o) => !o)}
        >
          <span className="chevron" aria-hidden="true">▸</span>
          Simulate task/segment strengths
        </button>

        {tasksOn && (
          <div className="advanced-panel">
            <p className="advanced-panel-note">
              Split demand into the five task types from the subscriptions section below (Research,
              Coding, Medical, Math/Engineering, Image/Video Gen). No lab picks which task it's
              strongest at — each lab's per-task quality is a random draw centered on its own
              aggregate quality q, so a higher-quality lab is still typically ahead, but not
              guaranteed to lead every task. Each task is tested against the same clearing value{' '}
              r* = {numFmt(rStar)} the aggregate chart above uses — the Proposition 1 test, one task
              at a time.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 20 }}>
              <div style={{ display: 'grid', gap: 14, maxWidth: 320, flex: '1 1 260px' }}>
                <Slider
                  label="Task-to-task dispersion"
                  def={sliderDefs.taskDispersion}
                  value={dispersion}
                  min={0}
                  max={0.6}
                  step={0.05}
                  onChange={setDispersion}
                />
              </div>
              <button
                type="button"
                className="reset-btn"
                onClick={() => setSeed((s) => s + 1)}
                style={{ marginBottom: 4 }}
              >
                Reroll task draws
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', margin: '14px 0 0' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '6px 10px' }}>Task</th>
                  <th style={{ padding: '6px 10px' }}>Leader</th>
                  <th style={{ padding: '6px 10px' }}>v(0) vs runner-up</th>
                  <th style={{ padding: '6px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {taskResults.map((t) => (
                  <tr key={t.label} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '6px 10px' }}>{t.label}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700 }}>{firmDisplayName(t.leaderName)}</td>
                    <td style={{ padding: '6px 10px' }}>{numFmt(t.leaderV0)} vs {numFmt(t.runnerUpV0)}</td>
                    <td style={{ padding: '6px 10px', color: t.soleProvider ? 'var(--accent)' : 'var(--muted)', fontWeight: t.soleProvider ? 700 : 400 }}>
                      {t.soleProvider ? 'wins alone' : "leads, doesn't clear"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ margin: '10px 0 0', fontSize: '.82rem', color: 'var(--muted)' }}>
              {(() => {
                const leaders = new Set(taskResults.map((t) => t.leaderName))
                const soleCounts = new Map<string, number>()
                taskResults.forEach((t) => {
                  if (t.soleProvider) soleCounts.set(t.leaderName, (soleCounts.get(t.leaderName) ?? 0) + 1)
                })
                const soleWinners = [...soleCounts.entries()]
                if (leaders.size <= 1) {
                  return `In this draw, ${firmDisplayName([...leaders][0])} leads every task — task-level noise wasn't enough to flip the ranking. Raise the dispersion or reroll to see it break.`
                }
                if (soleWinners.length === 0) {
                  return 'In this draw, the lead changes across tasks, but no lab clears r* outright in any single task — each task still has a credible runner-up.'
                }
                return `In this draw, the lead changes across tasks, and ${soleWinners
                  .map(([name, n]) => `${firmDisplayName(name)} wins ${n} outright`)
                  .join(', ')} — no single lab has to dominate every task for coexistence to appear.`
              })()}
            </p>
          </div>
        )}

        <p style={{ margin: '8px 0 0', maxWidth: 620, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--muted)' }}>
          Run the winner-take-all test inside each segment and different labs can lead different
          segments, so a single global leader stops being the default. The derivation states this
          as Proposition 1, together with the separability assumption it rests on.
        </p>
      </div>

      {section.derivation && <Derivation id={`${section.anchor}-derivation`}>{section.derivation}</Derivation>}
    </section>
  )
}
