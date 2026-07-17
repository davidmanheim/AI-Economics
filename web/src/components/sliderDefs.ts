// Plain-language definitions for the hover/focus tooltips on the interactive
// SLIDER controls (the `def` prop on Slider.tsx / AdaptiveSlider).
//
// Concepts that already have a definition from the chart-variable pass are
// reused VERBATIM from varDefs (one definition per concept, no drift). The rest
// are new one-liners written to the same concrete-referent bar: a short label
// lead-in, then one sentence a reader with no economics background can picture
// in the real world (millions of queries, buying hardware, paying for energy) —
// not circular math-only language.

import { varDefs } from './charts/varDefs'

export const sliderDefs = {
  // --- reused verbatim from the chart variable definitions -----------------
  K: varDefs.K, // Capacity K
  c: varDefs.c, // Physical cost c
  quality: varDefs.q, // any firm's quality slider (q_L, q, quality q)
  N: varDefs.N, // Purchaser mass N
  n: varDefs.n, // Number of labs n
  catchupHazard: varDefs.hazard, // Catch-up hazard Λ
  phi: varDefs.phi, // φ monthly fee
  rho: varDefs.rho, // ρ per use
  pj: varDefs.pj, // Trailing firm's price p_j

  // --- new, written to the concrete-referent bar ---------------------------
  thetaMax:
    'Willingness to pay: the highest price any buyer in the market would pay for one nominal task, such as what the single most eager customer would spend on one query.',
  interestRate:
    'Interest rate: how much less a dollar of profit next year is worth than a dollar today, for example a 5% yearly cost of capital used to discount future earnings.',
  rj:
    'Contracted compute price: the per-task rental a trailing lab has locked in with its hardware provider, for example a fixed dollars-per-query cloud contract.',
  zeta:
    'Bargaining weight: how much of the scarcity premium the lab negotiates away from the hardware owner — 0 means it pays the open-market rental, 1 means it captures the whole premium.',
  a:
    'FLOPs per output: how much raw computing work one nominal task consumes, for example how many chip operations it takes to answer a single query.',
  b:
    "Non-compute cost: the per-task spending that isn't hardware or energy — things like data licensing, safety review, or support staff for one nominal task.",
  beta:
    'Curvature: how quickly quality gains slow as a model nears the best it can be, like the last few points on a test getting far harder to win than the first.',
  capacityGrowth:
    'Capacity growth: how fast the installed hardware expands each period, for example the percentage more queries the GPU fleet can serve next quarter as new chips come online.',
  demandGrowth:
    'Demand growth: how fast buyers’ appetite for AI output rises each period, for example the percentage more queries the market wants to buy next quarter.',
  etaGap:
    "Asymptote gap: how far the leader's ultimate quality ceiling sits above the follower's — 1 means they top out equally, 1.3 means the leader's best possible model is 30% better than anything the follower can build.",
  releaseHazard:
    'Release hazard: the chance each period that a challenger ships a new model good enough to reset the race, for example a 20% chance per quarter of a rival launch.',
  releaseShock:
    'Release-quality shock: how much the quality of each new release swings around its trend — a big value means launches are unpredictable, sometimes a leap and sometimes a dud.',
  adjustmentSpeed:
    'Adjustment speed: how fast customers actually switch to a newly better model — 1 means they move immediately, low values mean habits and contracts hold them in place for a while.',
  fixedPerUnit:
    "Amortized fixed cost per output: the extra historical training and overhead spending baked into a lab's average total cost, spread over each nominal task — on top of the per-task cash cost of running the model.",
  frontierDrift:
    'Frontier drift: how fast the underlying frontier improves each period on its own, independent of any single lab’s release — the steady background rise in what a state-of-the-art model can do each quarter.',
  qBar:
    'Quality ceiling: the best a model can ultimately reach in the two capped regimes — the common asymptote every lab is converging toward, past which extra training barely moves quality.',
  gapCoefficient:
    "Starting gap: how far below its ceiling a lab's quality begins — a larger value means models open further from their best and have more ground to make up as cumulative training piles up.",
  trainingGrowth:
    "Training-compute growth: how fast each lab's cumulative training pile expands per period, for example the percentage more chip-hours poured into the next model than into the last.",
  taskDispersion:
    "Task-to-task dispersion: how much a lab's quality randomly swings from one task type to the next around its own overall level, for example an otherwise-average lab occasionally turning out unusually strong or weak at medical queries by chance rather than by design.",
} as const

export type SliderDefKey = keyof typeof sliderDefs
