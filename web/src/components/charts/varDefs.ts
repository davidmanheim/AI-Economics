// Plain-language, one-line definitions for the variable symbols and axis labels
// shown on the charts. Where a concept already lives in the prose glossary we
// reuse that entry verbatim (single source of truth); the rest are short new
// one-liners in the same plain register, kept here rather than in glossary.ts
// because they are "symbol → meaning" notes rather than prose terms.

import { glossary } from '../glossary'

export const varDefs = {
  // --- reused from the prose glossary -------------------------------------
  lambda: glossary.shadowPrice, // λ
  q: glossary.qualityAdjustedProductivity, // q, q_L, q_F
  markup: glossary.markup, // μ
  hazard: glossary.hazard, // Λ (catch-up hazard)
  marginalValue: glossary.marginalValue, // marginal value per FLOP
  scarcityRent: glossary.scarcityRent, // hyperscaler scarcity rent
  producerSurplus: glossary.producerSurplus, // producer surplus
  qualityAdjustedPrice: glossary.qualityAdjustedPrice, // P/Q
  opportunityCost: glossary.opportunityCost, // r* rung on the ladder

  // --- new short definitions ----------------------------------------------
  K: 'Capacity: the total number of standard tasks, say millions of queries a day, the shared hardware can serve.',
  c: 'Physical cost: what the hardware and its energy cost to produce one standard task, before any markup.',
  rStar: 'The dollars a lab pays to rent enough compute for one task, set where demand for compute meets its fixed supply.',
  theta: 'The most a given buyer would pay for one unit of AI output; a higher value means a keener buyer.',
  N: 'The size of the buyer pool, for example how many people or firms might pay for AI output.',
  n: 'How many rival labs sell in the market; more of them pushes the price down toward cost.',
  deltaPi: 'The extra profit, in dollars per period, that a lab earns while it stays ahead of its rivals.',
  phi: 'The flat subscription fee, for example $20 a month, paid to a provider before any use.',
  rho: 'The price of each individual use, for example $0.15 a query, charged on top of the subscription fee.',
  P: 'The all-in price, in dollars, that a buyer pays for one unit of AI output.',
  pj: "The price, in dollars, a trailing lab charges for one unit of its own output.",
  computeShare: "The share of all compute used in the market, as a percentage, that runs on this lab's behalf.",
  rentSplit: 'How the earnings above hardware cost divide, as percentages, between the labs and the hyperscalers that own the chips.',
  period: 'One step of the clock in the simulation, such as a quarter or a year.',
  qualityGap: "How many times more productive the leading lab's model is than the follower's; 1x means they have converged.",
  cashCost: 'The out-of-pocket dollars a lab spends to serve one more task right now: its compute rental plus other running costs.',
  averageTotalCost: "A lab's full cost per task once the one-time cost of training the model is spread over everything it sells.",
} as const

export type VarDefKey = keyof typeof varDefs
