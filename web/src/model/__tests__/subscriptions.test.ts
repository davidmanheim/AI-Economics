import { describe, it, expect } from 'vitest'
import {
  netValue,
  incrementalValue,
  greedyPortfolio,
  routeTasks,
  portfolioUtility,
  singleProviderSubscribes,
  providerShares,
  type Provider,
  type TaskType,
  type PurchaserType,
} from '../subscriptions'

// Leader is best on the common tasks (1-4); Follower excels only on the rare
// task 0. Leader uses more FLOPs per output (a=2) than the efficient Follower.
const TASKS: TaskType[] = [
  { name: 'coding', count: 1 },
  { name: 'writing', count: 10 },
  { name: 'analysis', count: 10 },
  { name: 'lookup', count: 10 },
  { name: 'longdoc', count: 10 },
]

const PROVIDERS: Provider[] = [
  { name: 'Leader', phi: 5, rho: 1, a: 2, quality: [1, 2, 2, 2, 2] },
  { name: 'Follower', phi: 1, rho: 0.5, a: 1, quality: [5, 0.1, 0.1, 0.1, 0.1] },
]

describe('subscription multi-homing (Appendix C)', () => {
  it('netValue = theta Q - rho', () => {
    expect(netValue(10, PROVIDERS[0], 1)).toBeCloseTo(19, 12)
    expect(netValue(10, PROVIDERS[1], 0)).toBeCloseTo(49.5, 12)
  })

  it('incremental value of the Follower given the Leader is 40.5 (hand)', () => {
    // task0 gain = 49.5 - 9 = 40.5; other tasks gain <= 0. E_j = 0.
    const omega = incrementalValue(10, 1, [0], TASKS, PROVIDERS)
    expect(omega).toBeCloseTo(40.5, 9)
  })

  it('greedy chooses both providers (multi-homing under complete info)', () => {
    const S = greedyPortfolio(10, TASKS, PROVIDERS)
    expect(S).toEqual([0, 1])
  })

  it('routing sends the rare task to the Follower, the rest to the Leader', () => {
    const S = greedyPortfolio(10, TASKS, PROVIDERS)
    const route = routeTasks(10, S, TASKS, PROVIDERS)
    expect(route[0]).toBe(1) // Follower serves coding
    expect(route.slice(1)).toEqual([0, 0, 0, 0]) // Leader serves the rest
  })

  it('adding a provider never lowers portfolio utility at the optimum', () => {
    const uBoth = portfolioUtility(10, [0, 1], TASKS, PROVIDERS)
    const uLeader = portfolioUtility(10, [0], TASKS, PROVIDERS)
    expect(uBoth).toBeGreaterThan(uLeader)
  })

  it('single-provider subscription condition', () => {
    // (spot - rho) E[y] >= phi: (2 - 0.5)*10 = 15 >= 8 true; vs 20 false.
    expect(singleProviderSubscribes(2, 0.5, 10, 8)).toBe(true)
    expect(singleProviderSubscribes(2, 0.5, 10, 20)).toBe(false)
  })

  it('separates subscription >> usage >> compute share for the trailing provider', () => {
    const pop: PurchaserType[] = [{ theta: 10, weight: 100 }]
    const shares = providerShares(pop, TASKS, PROVIDERS)
    const follower = shares.find((s) => s.name === 'Follower')!
    const leader = shares.find((s) => s.name === 'Leader')!
    // Follower: broad subscription base, thin usage, thinner compute.
    expect(follower.subscriptionShare).toBeGreaterThan(follower.usageShare)
    expect(follower.usageShare).toBeGreaterThan(follower.computeShare)
    expect(follower.subscriptionShare).toBeCloseTo(0.5, 9)
    // Leader mirror image: dominates usage and compute.
    expect(leader.usageShare).toBeGreaterThan(leader.subscriptionShare)
    expect(leader.computeShare).toBeGreaterThan(leader.usageShare)
  })
})
