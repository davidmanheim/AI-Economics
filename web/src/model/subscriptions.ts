// Subscription pricing and multi-homing (paper Appendix C,
// \label{app:subscriptions}).
//
// A purchaser of type theta faces task types k with expected counts T_k. Each
// provider m offers a two-part tariff (phi_m fixed fee, rho_m per-use price) and
// a per-task quality Q_{mk}. The purchaser chooses a subscription portfolio S to
// maximize
//   U(S) = sum_k T_k * max{0, max_{m in S} (theta Q_{mk} - rho_m)} - sum_{m in S} phi_m,
// and adds provider j when its incremental value clears its fee,
//   Omega_j(S) = sum_k T_k [theta Q_{jk} - rho_j - B_k(S)]_+ - E_j  >=  phi_j,
//   B_k(S)     = max{0, max_{m in S} (theta Q_{mk} - rho_m)}.
// Multi-homing arises even under complete information: a trailing provider need
// only be sufficiently better on some tasks to justify its fee. Aggregated over
// a purchaser population, this separates subscription share, usage share, and
// compute share (subscription >= usage >= compute for a trailing provider).
//
// All functions pure. No DOM imports.

/** Five illustrative task types, shared with S2's task-heterogeneity demo so
 *  both sections refer to the same categories. */
export const TASK_NAMES = ['Research', 'Coding', 'Medical', 'Math/Engineering', 'Image/Video Gen']

/** A subscription provider and its per-task qualities. */
export interface Provider {
  name: string
  /** Fixed subscription fee phi_m >= 0. */
  phi: number
  /** Marginal price per standardized output after subscribing, rho_m. */
  rho: number
  /** FLOPs per standardized output a_m (for the compute-share calculation). */
  a: number
  /** Economically relevant quality Q_{mk} on each task (aligned with tasks). */
  quality: number[]
  /** Fixed evaluation cost E_j the purchaser incurs to assess this provider. */
  evalCost?: number
}

/** A task type with an expected count for a representative purchaser. */
export interface TaskType {
  name: string
  /** Expected tasks of this type, T_k. */
  count: number
}

/** A purchaser type in a population. */
export interface PurchaserType {
  theta: number
  /** Population weight (mass). Default 1. */
  weight?: number
  /** Optional per-task counts overriding TaskType.count for this type. */
  taskCounts?: number[]
}

/** The three shares of a provider, each normalized across providers. */
export interface ProviderShares {
  name: string
  subscriptionShare: number
  usageShare: number
  computeShare: number
}

function taskCount(tasks: TaskType[], purchaser: PurchaserType, k: number): number {
  return purchaser.taskCounts ? purchaser.taskCounts[k] : tasks[k].count
}

/** Net value of routing task k to subscribed provider m: theta Q_{mk} - rho_m. */
export function netValue(theta: number, provider: Provider, k: number): number {
  return theta * provider.quality[k] - provider.rho
}

/**
 * Best net value currently available for task k from portfolio S (indices into
 * `providers`): B_k(S) = max{0, max_{m in S} (theta Q_{mk} - rho_m)}.
 */
export function bestNetValue(
  theta: number,
  k: number,
  S: number[],
  providers: Provider[],
): number {
  let best = 0
  for (const m of S) {
    const v = netValue(theta, providers[m], k)
    if (v > best) best = v
  }
  return best
}

/**
 * Purchaser utility of portfolio S:
 *   U(S) = sum_k T_k B_k(S) - sum_{m in S} phi_m.
 */
export function portfolioUtility(
  theta: number,
  S: number[],
  tasks: TaskType[],
  providers: Provider[],
  purchaser: PurchaserType = { theta },
): number {
  let u = 0
  for (let k = 0; k < tasks.length; k++) {
    u += taskCount(tasks, purchaser, k) * bestNetValue(theta, k, S, providers)
  }
  for (const m of S) u -= providers[m].phi
  return u
}

/**
 * Incremental value of adding provider j to portfolio S (paper Omega_ij):
 *   Omega_j(S) = sum_k T_k [theta Q_{jk} - rho_j - B_k(S)]_+ - E_j.
 * Provider j is worth adding when Omega_j(S) >= phi_j.
 */
export function incrementalValue(
  theta: number,
  j: number,
  S: number[],
  tasks: TaskType[],
  providers: Provider[],
  purchaser: PurchaserType = { theta },
): number {
  const prov = providers[j]
  let sum = 0
  for (let k = 0; k < tasks.length; k++) {
    const gain = netValue(theta, prov, k) - bestNetValue(theta, k, S, providers)
    if (gain > 0) sum += taskCount(tasks, purchaser, k) * gain
  }
  return sum - (prov.evalCost ?? 0)
}

/**
 * Greedy subscription-portfolio choice: repeatedly add the provider whose
 * incremental value most exceeds its fee, while any provider clears its fee
 * (Omega_j(S) >= phi_j). Returns the chosen provider indices (sorted).
 *
 * Greedy is exact when adding a provider only weakly lowers others' incremental
 * values (submodularity of B_k), which holds here because B_k(S) is a maximum
 * over S and therefore monotone; it is used as a fast, deterministic heuristic.
 */
export function greedyPortfolio(
  theta: number,
  tasks: TaskType[],
  providers: Provider[],
  purchaser: PurchaserType = { theta },
): number[] {
  const S: number[] = []
  const inS = new Array(providers.length).fill(false)

  for (;;) {
    let bestJ = -1
    let bestNet = 0 // require strictly positive net gain (Omega - phi > 0)
    for (let j = 0; j < providers.length; j++) {
      if (inS[j]) continue
      const omega = incrementalValue(theta, j, S, tasks, providers, purchaser)
      const net = omega - providers[j].phi
      if (net > bestNet + 1e-12) {
        bestNet = net
        bestJ = j
      }
    }
    if (bestJ < 0) break
    S.push(bestJ)
    inS[bestJ] = true
  }

  return S.sort((x, y) => x - y)
}

/** Which provider (index into S) serves each task, or -1 if unserved. */
export function routeTasks(
  theta: number,
  S: number[],
  tasks: TaskType[],
  providers: Provider[],
): number[] {
  return tasks.map((_, k) => {
    let bestM = -1
    let best = 0 // must beat the outside option of not routing (value 0)
    for (const m of S) {
      const v = netValue(theta, providers[m], k)
      if (v > best) {
        best = v
        bestM = m
      }
    }
    return bestM
  })
}

/**
 * Single-provider subscription condition (paper app:subscriptions):
 *   (P_spot - rho_m) * E[y_im] >= phi_m.
 */
export function singleProviderSubscribes(
  spotPrice: number,
  rho: number,
  expectedOutputs: number,
  phi: number,
): boolean {
  return (spotPrice - rho) * expectedOutputs >= phi
}

/**
 * Aggregate a purchaser population into per-provider subscription, usage, and
 * compute shares (each normalized across providers). Illustrates the paper's
 * separation subscription share >= usage share >= compute share.
 *
 *   subscription mass_m = sum of weights of purchasers with m in their portfolio
 *   usage mass_m        = sum weight * (outputs routed to m)
 *   compute mass_m      = sum weight * a_m * (outputs routed to m)
 */
export function providerShares(
  purchasers: PurchaserType[],
  tasks: TaskType[],
  providers: Provider[],
): ProviderShares[] {
  const subs = new Array(providers.length).fill(0)
  const usage = new Array(providers.length).fill(0)
  const compute = new Array(providers.length).fill(0)

  for (const p of purchasers) {
    const w = p.weight ?? 1
    const S = greedyPortfolio(p.theta, tasks, providers, p)
    for (const m of S) subs[m] += w
    const route = routeTasks(p.theta, S, tasks, providers)
    route.forEach((m, k) => {
      if (m < 0) return
      const outputs = taskCount(tasks, p, k)
      usage[m] += w * outputs
      compute[m] += w * providers[m].a * outputs
    })
  }

  const norm = (arr: number[]): number[] => {
    const total = arr.reduce((s, x) => s + x, 0)
    return total > 1e-12 ? arr.map((x) => x / total) : arr.map(() => 0)
  }

  const subShare = norm(subs)
  const useShare = norm(usage)
  const compShare = norm(compute)

  return providers.map((prov, m) => ({
    name: prov.name,
    subscriptionShare: subShare[m],
    usageShare: useShare[m],
    computeShare: compShare[m],
  }))
}
