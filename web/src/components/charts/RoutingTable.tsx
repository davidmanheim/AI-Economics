// S7 widget (plan §4.7a): task-routing table for the multi-homing / two-part
// tariff story of Appendix C. Rows are task types, columns are providers with a
// subscription fee phi and per-use price rho (illustrative dollar prices) and an
// on/off toggle. Each row highlights the subscribed provider it routes to and
// its share of daily volume; the footer reports total daily usage (dollars of
// spend per day), total user value, and each provider's subscriber / usage /
// compute shares as three small bars, making the paper's separation
// subscription >= usage >= compute visible.
//
// Economic content routes through the pure model (subscriptions.ts); this
// component only owns the subscription toggle state and lays the numbers out.

import { useState } from 'react'
import {
  incrementalValue,
  netValue,
  portfolioUtility,
  routeTasks,
  greedyPortfolio,
  type Provider,
  type TaskType,
} from '../../model/subscriptions'
import { firmDisplayName } from '../../lib/displayName'
import { VarTerm } from './VarLabel'
import { varDefs } from './varDefs'

interface RoutingTableProps {
  /** Representative purchaser willingness-to-pay theta. */
  theta: number
  tasks: TaskType[]
  providers: Provider[]
}

const PROVIDER_COLORS = ['var(--leader)', 'var(--frontier)', 'var(--accent)']

const ROUTING_CSS = `
.routing { margin-top: 18px; }
.routing-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.routing-table th, .routing-table td { border: 1px solid var(--line); padding: 8px 10px; text-align: center; }
.routing-corner, .routing-task { text-align: left; background: var(--surface); }
.routing-sub { display: block; font-size: .68rem; font-weight: 500; color: var(--muted); text-transform: none; letter-spacing: 0; }
.routing-prov { background: var(--surface); vertical-align: top; }
.routing-prov.on { background: var(--accent-pale); }
.routing-prov-name { display: block; font-weight: 800; letter-spacing: -.01em; }
.routing-switch { display: inline-flex; align-items: center; gap: 5px; margin: 6px 0 4px; font-size: .72rem; color: var(--muted); cursor: pointer; }
.routing-fees { display: block; font-size: .72rem; color: var(--muted); }
.routing-fee-ok, .routing-fee-no { display: inline-block; margin-top: 4px; font-size: .66rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
.routing-fee-ok { background: var(--accent-pale); color: var(--accent); }
.routing-fee-no { background: #f4e4dc; color: var(--frontier); }
.routing-task { font-weight: 700; }
.routing-cell { position: relative; color: var(--ink); }
.routing-cell.muted { color: var(--line); background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,.02) 5px, rgba(0,0,0,.02) 10px); }
.routing-cell.routes-here { background: var(--accent-pale); box-shadow: inset 0 0 0 2px var(--accent); font-weight: 800; }
.routing-netval { font-variant-numeric: tabular-nums; }
.routing-pin { display: block; font-size: .62rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .05em; }
.routing-footer { display: grid; grid-template-columns: minmax(160px, 1fr) 2fr; gap: 24px; margin-top: 20px; align-items: start; }
.routing-value strong { display: block; font-size: 2rem; letter-spacing: -.03em; color: var(--leader); font-variant-numeric: tabular-nums; }
.routing-uservalue { display: block; font-size: 1.35rem; font-weight: 800; letter-spacing: -.02em; color: var(--leader); font-variant-numeric: tabular-nums; }
.routing-hint { font-size: .8rem; color: var(--muted); }
.routing-share-row { display: grid; grid-template-columns: 90px repeat(3, 1fr); gap: 10px; align-items: center; margin: 6px 0; }
.routing-share-name { font-weight: 700; font-size: .82rem; }
.share-bar { display: flex; align-items: center; gap: 6px; font-size: .7rem; color: var(--muted); }
.share-bar-label { width: 44px; text-transform: uppercase; letter-spacing: .04em; }
.share-bar-track { flex: 1; height: 8px; background: var(--paper); border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.share-bar-fill { display: block; height: 100%; border-radius: 999px; }
.share-bar-pct { width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
@media (max-width: 640px) { .routing-footer { grid-template-columns: 1fr; } .routing-table { font-size: .78rem; } }
`

function normalize(arr: number[]): number[] {
  const total = arr.reduce((s, x) => s + x, 0)
  return total > 1e-12 ? arr.map((x) => x / total) : arr.map(() => 0)
}

export function RoutingTable({ theta, tasks, providers }: RoutingTableProps) {
  const [subscribed, setSubscribed] = useState<boolean[]>(() => providers.map(() => true))

  // Guard against provider-count changes from the parent (rare, but cheap).
  const subs = subscribed.length === providers.length ? subscribed : providers.map(() => true)

  const S = subs.map((on, i) => (on ? i : -1)).filter((i) => i >= 0)
  const route = routeTasks(theta, S, tasks, providers) // provider index per task, or -1
  const totalValue = portfolioUtility(theta, S, tasks, providers)
  const best = greedyPortfolio(theta, tasks, providers)

  // Three masses per provider, then normalized to shares.
  const subMass = providers.map((_, m) => (subs[m] ? 1 : 0))
  const usageMass = providers.map(() => 0)
  const computeMass = providers.map(() => 0)
  route.forEach((m, k) => {
    if (m < 0) return
    usageMass[m] += tasks[k].count
    computeMass[m] += providers[m].a * tasks[k].count
  })
  const subShare = normalize(subMass)
  const usageShare = normalize(usageMass)
  const computeShare = normalize(computeMass)

  // Task-mix shares (percent of daily volume), derived live from the counts.
  const totalCount = tasks.reduce((s, t) => s + t.count, 0)
  const taskShare = (k: number) => (totalCount > 0 ? Math.round((100 * tasks[k].count) / totalCount) : 0)

  // Total daily usage in dollars: metered per-use spend on the tasks that route
  // somewhere, plus a daily slice (÷30) of each subscribed provider's monthly
  // fee. rho and phi are illustrative dollar prices, not calibrated estimates.
  const meteredDaily = route.reduce((sum, m, k) => (m < 0 ? sum : sum + providers[m].rho * tasks[k].count), 0)
  const subsDaily = providers.reduce((sum, p, m) => (subs[m] ? sum + p.phi / 30 : sum), 0)
  const dailyUsage = meteredDaily + subsDaily
  const routedTasks = route.reduce((sum, m, k) => (m < 0 ? sum : sum + tasks[k].count), 0)

  const toggle = (m: number) =>
    setSubscribed((prev) => {
      const next = (prev.length === providers.length ? prev : providers.map(() => true)).slice()
      next[m] = !next[m]
      return next
    })

  // Does each subscribed provider clear its own fee at the margin?
  const justifiesFee = providers.map((_, m) => {
    if (!subs[m]) return false
    const without = S.filter((i) => i !== m)
    return incrementalValue(theta, m, without, tasks, providers) >= providers[m].phi
  })

  const sameAsBest =
    best.length === S.length && best.every((i, idx) => i === S[idx])

  return (
    <div className="routing">
      <style>{ROUTING_CSS}</style>
      <table className="routing-table">
        <thead>
          <tr>
            <th className="routing-corner">
              Task type
              <span className="routing-sub">daily count · share of volume</span>
            </th>
            {providers.map((p, m) => (
              <th key={p.name} className={subs[m] ? 'routing-prov on' : 'routing-prov'}>
                <span className="routing-prov-name" style={{ color: PROVIDER_COLORS[m % 3] }}>
                  {firmDisplayName(p.name)}
                </span>
                <label className="routing-switch">
                  <input type="checkbox" checked={subs[m]} onChange={() => toggle(m)} />
                  <span>{subs[m] ? 'subscribed' : 'off'}</span>
                </label>
                <span className="routing-fees">
                  fee <VarTerm def={varDefs.phi} label="φ (subscription fee)">φ</VarTerm> ${p.phi.toFixed(0)}/mo · use{' '}
                  <VarTerm def={varDefs.rho} label="ρ (per-use price)">ρ</VarTerm> ${p.rho.toFixed(2)}
                </span>
                {subs[m] && (
                  <span className={justifiesFee[m] ? 'routing-fee-ok' : 'routing-fee-no'}>
                    {justifiesFee[m] ? 'earns its fee' : 'below its fee'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, k) => {
            const winner = route[k]
            return (
              <tr key={task.name}>
                <th scope="row" className="routing-task">
                  {task.name}
                  <span className="routing-sub">{task.count} · {taskShare(k)}%</span>
                </th>
                {providers.map((p, m) => {
                  const v = netValue(theta, p, k)
                  const isWinner = winner === m
                  const cls = [
                    'routing-cell',
                    !subs[m] ? 'muted' : '',
                    isWinner ? 'routes-here' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <td key={p.name} className={cls}>
                      <span className="routing-netval">{v.toFixed(1)}</span>
                      {isWinner && <span className="routing-pin">routes here</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="routing-footer">
        <div className="routing-value">
          <span className="chart-caption">Total daily usage</span>
          <strong>${dailyUsage.toFixed(2)}/day</strong>
          <span className="routing-hint">
            {routedTasks} tasks/day · ${meteredDaily.toFixed(2)} per-use + ${subsDaily.toFixed(2)} subscriptions
          </span>
          <span className="chart-caption" style={{ marginTop: 12 }}>
            Total user value
          </span>
          <span className="routing-uservalue">{totalValue.toFixed(1)}</span>
          <span className="routing-hint">
            {sameAsBest
              ? 'This is the value-maximizing portfolio.'
              : `A greedy chooser would instead subscribe to: ${
                  best.length ? best.map((i) => firmDisplayName(providers[i].name)).join(', ') : 'nothing'
                }.`}
          </span>
        </div>

        <div className="routing-shares">
          <span className="chart-caption">Provider shares — subscriber ≥ usage ≥ compute</span>
          {providers.map((p, m) => (
            <div key={p.name} className="routing-share-row">
              <span className="routing-share-name" style={{ color: PROVIDER_COLORS[m % 3] }}>
                {firmDisplayName(p.name)}
              </span>
              <ShareBar label="sub" value={subShare[m]} color={PROVIDER_COLORS[m % 3]} />
              <ShareBar label="use" value={usageShare[m]} color={PROVIDER_COLORS[m % 3]} />
              <ShareBar label="compute" value={computeShare[m]} color={PROVIDER_COLORS[m % 3]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShareBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="share-bar" title={`${label}: ${(value * 100).toFixed(0)}%`}>
      <span className="share-bar-label">{label}</span>
      <span className="share-bar-track">
        <span
          className="share-bar-fill"
          style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
        />
      </span>
      <span className="share-bar-pct">{(value * 100).toFixed(0)}%</span>
    </span>
  )
}
