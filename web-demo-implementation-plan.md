# Implementation Plan: Interactive Web Companion to "The Future Economics of LLMs"

Written 2026-07-14 for follow-up coding agents. Sources: `paper-draft-July-14.tex` (853 lines; equation/line references below point there), `Possible webpage structure.txt` (the "notes"). There is **no existing scaffolding** in `C:\apps\AI-Econ` — no package.json, no src/. Everything below is greenfield. Companion document: `paper-review-notes.md` (the review); where the review flags a claim as asserted rather than derived, the demo must present it as such (see §7, constraint 6).

Audience calibration (binding on all copy): readers know supply/demand, monopoly vs. competition, and marginal reasoning. They do **not** know Cournot, Nash bargaining, the Lerner index, shadow prices, hazard rates, or quality ladders. Every such term gets a plain-language explanation at first use (the `<Term>` component, §5). Write copy at the level of a good *Economist* explainer, with the math available but folded away.

---

## 1. Critique and refinement of the website notes

### 1.1 Do the "four interactive modules" map onto the paper? Yes, cleanly, with one decision to make.

The notes never say *which* four modules. The paper has exactly four self-contained interactive mechanisms with closed forms or near-closed forms:

| Module | Paper source | Core object |
|---|---|---|
| M1: Allocating scarce compute | Secs. 4–6: `v_m = c + λ` (line 172); WTA condition `v_L(K) ≥ max_j v_j(0)` (line 268); dominance price `P* = Q_L F⁻¹(1 − K/(a_L N))` (line 400) | Marginal-value-per-FLOP schedules stacked against fixed K |
| M2: Who gets the money (oligopoly & rent split) | Sec. 7 price decomposition (line 311); binding/slack condition (lines 337, 343); App. D symmetric Cournot closed forms (lines 763–791); App. A Nash bargaining split (lines 658–676) | Stacked price bar + rent-division bar as functions of n, K, bargaining weight |
| M3: The release race (temporary leadership) | Sec. 10: hazard release process (line 477), `V_lead ≈ Δπ/(r+Λ)` (line 504), share adjustment (line 494) | Simulated timeline of releases, market shares, and rent shares |
| M4: Three technological futures | Sec. 11: q(G) curves for the three regimes (lines 527, 555, 581) and their rent-share consequences | Regime selector driving long-run paths of quality gap, markup, scarcity rent |

**Decision made here:** subscriptions/multi-homing (App. C) does **not** get a full module. It gets a compact interactive widget inside narrative section S7 (a task-routing table, §4.7). Rationale: App. C's mechanism is a discrete portfolio-choice calculation, is self-contained, and doesn't share state with the market model; a full module would dilute the four-module structure the notes recommend.

### 1.2 Things in the notes not fully supported by the model as written — implementer must know these

1. **The paper never writes down a multi-model demand system.** R(y;Q) and D_ℓ(P;q) are abstract primitives. The demo cannot plot abstract primitives, so the implementation must commit to a concrete demand system. **Decision: use the paper's own purchaser utility θ·Q_m − P_m with θ ~ Uniform[0, θ_max], N purchasers, and standard vertical-differentiation segmentation** (purchasers sort into quality tiers by indifference cutoffs). This is fully consistent with Sec. 3 and reduces to the paper's single-model formula (line 396) when one model is active. Every module states in its fine print: "The paper's results hold for general demand; the pictures use the simplest demand consistent with the paper's Section 3." This same demand system is what the review recommends adding to the paper — coordinate: implement it once in the notebook (Phase 9) and port the formulas.
2. **"Share of total producer surplus" outputs** (a notes requirement) are only computable in closed form in the Cournot example (App. D) and the bargaining split (App. A). M2 therefore carries the surplus-share duty; other modules show profit *levels* and clearly label them as levels (constraint 4, §7).
3. **The rent-share dynamics in M3/M4 rest on comparative-statics chains the paper asserts, not derives** (review §1.6). The demo implements them via the concrete demand system, where they *are* true. Fine — but the derivation panels must say "under the linear/uniform demand used here," not "in general."
4. **Δπ and Λ in M3 are not independent in equilibrium** (review §1.5): a bigger leadership prize attracts more challenger investment, raising the catch-up hazard. The M3 UI must carry a one-line caveat rather than silently presenting them as free dials (§4.5.c).
5. Everything else in the notes (normalized values, generic firm names, the four distinctions, the closing narrative sentence) is fully supported.

### 1.3 Revised section list

The notes' 8+1 list is good but has one gap (nothing between "how oligopoly changes prices" and the release dynamics covers *trailing labs*, which is a full paper section with the paper's most practical taxonomy) and one redundancy (sections 1 and 4 both cover rent division). Revised list — 8 narrative sections + explorer + colophon:

- **S0. The one-sentence model** (hero): the notes' closing narrative verbatim: "New models shift the value of GPU capacity. Scarcity determines how much surplus exists, competition determines who receives it, and technological progress determines whether market leadership is temporary, persistent, or eventually commoditized." Plus a static two-layer diagram (purchasers → labs → hyperscalers).
- **S1. How scarce GPUs are allocated** → hosts **M1**.
- **S2. When one model wins everything — and when it doesn't** → continues M1 (WTA condition view).
- **S3. What a price is made of** → hosts **M2** (three-component decomposition, Cournot, binding vs. slack, bargaining).
- **S4. Life behind the frontier** → static/lightly-interactive: the three trailing-lab tiers (Sec. 9). *(New — fills the gap.)*
- **S5. What happens after a new model release** → hosts **M3**.
- **S6. Three possible technological futures** → hosts **M4**.
- **S7. Why users subscribe to several providers** → subscription widget (App. C).
- **S8. Explore the full model** → all parameters, all outputs (the explorer).
- **S9. Paper, derivations index, and downloadable notebook** (colophon).

"Who captures the value of an LLM output?" (notes' section 1) becomes the *question posed in S0* and *answered in S3* rather than a standalone section — it was redundant with the oligopoly section.

---

## 2. Recommended tech stack

**Static single-page app: Vite + React 18 + TypeScript. No backend, no framework server. Deployable as flat files (GitHub Pages / Netlify / any static host).**

- Why not plain HTML/JS: four stateful modules sharing a parameter store, a global normalized/illustrative toggle, and an explorer that reuses the modules' charts — component reuse and typed shared state pay for themselves immediately.
- Why not Next/Astro/SvelteKit: no routing, no SSR, no content collections needed; one page. Vite's static build is the smallest thing that works, and React is the ecosystem where a coding agent is least likely to get stuck.
- **Math rendering: KaTeX** (via `katex` + a thin wrapper component). Small, fast, no MathJax runtime cost.
- **Charts: custom SVG components built on `d3-scale`, `d3-shape`, `d3-array` only (no full D3, no chart library).** Justification: the centerpiece visuals are nonstandard — stacked marginal-value schedules against a capacity line, a θ-line segmentation strip, a stacked price-decomposition bar with a toggleable quality-adjusted twin, a release-race timeline with regime shading. Recharts/Plotly fight you on all of these and bloat the bundle; d3 micro-packages + React SVG is the well-trodden path for bespoke economics charts. Keep every chart a pure function of props (data in, SVG out) so the explorer can reuse them.
- **State: Zustand** (one store, ~1 kB) for the global parameter set + calibration toggle. Module-local state stays in components.
- **Model math: a pure-TypeScript package in `src/model/` with zero DOM imports**, unit-tested with **Vitest** against values cross-checked from the Python notebook. This is the single most important architectural rule: every equation lives exactly once, in `src/model/`, and both the modules and the explorer call it.
- **The downloadable notebook: a real Jupyter notebook (Python, numpy + matplotlib only), maintained by hand as a parallel implementation — not generated from JS.** Recommendation over a JS state export, for three reasons: (a) the paper's audience (economists) can read and extend Python, not a JSON blob; (b) the review recommends the paper itself gain a numerical section — this notebook is that artifact, double-duty; (c) it serves as the test oracle for `src/model/` (generate `fixtures.json` from the notebook; Vitest asserts TS matches to 1e-9). *Additionally* provide the cheap thing: an "Export current parameters (JSON)" button in the explorer, and have the notebook's first cell optionally load such a file. Both, not either.
- Styling: plain CSS modules or a single `styles.css` with CSS custom properties (needed for the light/dark and distinction-coding tokens, §7). No Tailwind (one less toolchain moving part; the design tokens matter more than utility classes here).

---

## 3. The shared model core (`src/model/`) — what to implement

All functions pure, all parameters explicit. Canonical parameter object (defaults = the notes' normalization):

```ts
interface Params {
  c: number;        // physical cost per FLOP-unit; default 1
  K: number;        // aggregate capacity; default 100
  N: number;        // purchaser mass; default 300
  thetaMax: number; // θ ~ U[0, thetaMax]; default 10
  firms: Firm[];    // { name: 'Leader'|'Follower A'|'Follower B', q: number, a: number, b: number }
                    // defaults: Leader q=1.4, Follower A q=1.1, Follower B q=0.9; a=1, b=0 for all
  // dynamics (M3): r=0.05, Lambda=0.5, deltaPi derived not dialed (see §4.5)
  // regimes (M4): qBar, d, beta, eta per firm (see §4.6)
}
```

Files and their contents:

- `types.ts` — Params, Firm, results types.
- `demand.ts` — uniform-θ vertical-differentiation demand: indifference cutoffs, per-firm demand D_m(P), inverse demand, and the single-firm closed form `P* = Q·(1 − y/N·θmax⁻¹...)` matching paper line 400 (with F uniform, F⁻¹(z) = z·θ_max).
- `allocation.ts` — integrated benchmark: marginal-net-revenue-per-FLOP schedules v_m(x), water-filling allocation solving v_m = c + λ with Σ a_m y_m ≤ K, returns {x_m, y_m, λ, active set}; WTA test `vL(K) >= max_j vj(0)`; dominance-case price.
- `cournot.ts` — App. D closed forms: symmetric Cournot with capacity (r*, P*, per-firm markup BK/(a·n), lab profit BK²/(a²n), hyperscaler rent (r*−c)K, binding threshold K < a·n(A−b−ac)/(B(n+1))); plus the general price decomposition splitter → {physicalCost, scarcityRent, markup} per paper line 311. Map the vertical demand to the linear inverse demand A − BY for the symmetric case (A = θ_max·q̄ effective intercept; document the mapping in comments).
- `bargaining.ts` — App. A: `r = β·v̄_h + (1−β)·v̂_ℓ`, surplus split arrays for the S3 bargaining sub-view.
- `dynamics.ts` — M3: `vLead(deltaPi, r, Lambda)`; a seeded (deterministic) discrete-time simulator: per period, each challenger releases w.p. h; on release draw log-quality `A_t + α_ℓ + ζ`; recompute static equilibrium via `allocation.ts`/`cournot.ts`; apply share partial adjustment `s' = (1−speed)s + speed·ŝ` (paper line 494). Seeded RNG (mulberry32) so "re-run" is reproducible and the notebook can replicate runs.
- `regimes.ts` — M4: the three q_ℓ(G) laws (paper lines 527, 555, 581), G accumulating at a chosen investment rate, mapped each period through the static model to paths of {q_L/q_F, markup μ, scarcity rent r−c, quality-adjusted price P/Q}.
- `subscriptions.ts` — App. C: incremental portfolio value Ω_ij(S) (paper line 728) over a small fixed task grid; greedy portfolio choice.
- `presets.ts` — `NORMALIZED` (above) and `ILLUSTRATIVE` calibration (real-ish units, clearly labeled "illustrative, not estimated": e.g., cost per million tokens $0.30, leader quality premium 40%, capacity in GPU-years; pick round numbers, cite nothing).
- `__tests__/*.test.ts` + `fixtures.json` (generated by the notebook).

**Numerical note for implementers:** the water-filling in `allocation.ts` with uniform-θ demand is piecewise linear, so solve λ by bisection on λ ∈ [0, max_m v_m(0)] — 40 iterations, exact enough, no library needed.

---

## 4. Section-by-section and module-by-module content plan

Format per item: (a) equations/mechanism from the .tex; (b) adjustable parameters w/ defaults & ranges; (c) plain-language explanations required; (d) expandable derivation contents.

### 4.0 S0 — Hero / the one-sentence model
- (a) None. Static SVG diagram: Purchasers (many small dots, sized by θ) → three model firms (Leader, Follower A, Follower B) → GPU capacity block of width K owned by hyperscalers. The notes' closing narrative as the epigraph.
- (b) None interactive. The global **calibration toggle** (Normalized / Illustrative) lives in the sticky header introduced here.
- (c) Define at first use: *hyperscaler* ("a company that owns warehouse-scale computing hardware — the GPUs — and rents it out"); *model laboratory* ("a company that builds an AI model and sells its outputs"); *FLOP/compute* ("a unit of raw computing work; every AI answer consumes some"); *scarcity* ("for the next few years, people want more AI output at near-cost prices than the installed hardware can produce — the paper's maintained assumption, stated at its eq. for Σ a·D > K, tex line 145").
- (d) Derivation drawer: the paper's Sec. 3 setup verbatim-ish (utility θQ−P, q ≡ Q/a, unit-invariance note pointing to App. E).

### 4.1 S1 + M1 — How scarce GPUs are allocated
- (a) Integrated benchmark: v_m ≡ (MR_m − b_m)/a_m, allocation rule **v_m = c + λ** (line 172), inactive condition v_m ≤ c+λ (line 176). Visual: each firm's downward-sloping v_m(x) curve drawn side-by-side over a shared horizontal compute axis of total width K; a horizontal "water level" line at height c+λ; shaded areas = compute won. Secondary strip: the θ-line showing which purchasers are served by which model (frontier segment vs. rest — distinction #3, §7).
- (b) Sliders: K ∈ [20, 300], default 100 (the money slider — drag K down, watch λ rise); leader productivity q_L ∈ [1.0, 2.5], default 1.4; follower A q ∈ [0.8, 1.4], default 1.1; follower B q ∈ [0.5, 1.2], default 0.9; c ∈ [0.5, 3], default 1. Readouts: λ (labeled "scarcity premium per unit of compute"), each firm's compute share, output, the marginal purchaser's θ.
- (c) Plain language required: *marginal value* ("what one more unit of compute would earn a firm, given what it already has — it falls as the firm serves ever-less-eager customers"); *shadow price / λ* ("the going rate a unit of compute commands when there isn't enough to go around; in this model it's the height of the water line"); *scarcity rent* ("earnings above the physical cost of running the hardware, existing only because capacity is limited — like the premium on the last hotel rooms in town"); *quality-adjusted productivity q = Q/a* ("value delivered per unit of compute, not per answer — a model that gives slightly better answers using half the compute wins on this measure").
- (d) Derivation drawer: the constrained maximization (lines 156–176) with the Lagrangian spelled out, plus the MR ≈ P caveat paragraph (lines 182–188), plus one worked number: at defaults, report λ and shares computed live.

### 4.2 S2 — When one model wins everything (continues M1, second view)
- (a) WTA condition **v_L(K) ≥ max_j v_j(0)** (line 268). Visual: same chart as M1 but with a prominent comparison: the height of the leader's curve *at the far right edge* (its worst funded use) vs. each follower's curve *at its left edge* (its best use). A banner flips between "WINNER-TAKE-ALL" and "COEXISTENCE" as sliders move. List the paper's five coexistence mechanisms (lines 274–280) as annotated chips; the demo only *simulates* mechanism 1 (productivity differences) — the other four are explained as static text with the chip greyed "not in this simulation."
- (b) Same sliders as M1. Add a "find the tipping point" affordance: a button that animates q_L upward until the condition flips, displaying the critical q_L.
- (c) Plain language: *winner-take-most vs. winner-take-all* ("winner-take-all means literally every unit of compute; the paper's point is this needs a demanding condition — the leader's least valuable customer must still be worth more than the runner-up's most valuable customer. Miss it, and the market splits"). **Per the review (§1.3.1): copy must say the model identifies the condition, not that WTA is unlikely** — phrase as "whether this happens depends on how steeply value falls off, which the model doesn't decide for you — try it."
- (d) Derivation drawer: Sec. 6 in full (separability assumption G″<0 stated honestly), plus the App. E.4 nonseparable version, plus a note that under oligopoly dominance is *harder* (v̂ < v, review §1.3.2).

### 4.3 S3 + M2 — What a price is made of
- (a) The boxed decomposition **P = (b + a·c) + a·(r − c) + μ** (line 311); Cournot FOC and markup μ ≡ −y·∂P/∂y (lines 303–307); App. D closed forms (r*, P*, profits; lines 763–791); binding vs. slack test (lines 337, 343); Lerner condition (line 359); App. A bargaining split r = β·v̄ + (1−β)·v̂ (line 664).
  Visuals: (i) **the stacked price bar** — three colored segments (physical cost / hyperscaler scarcity rent / lab markup), with a twin bar showing the *quality-adjusted* price P/Q beside the nominal one (distinction #2, §7); (ii) **the rent-split donut or 100% bar** — share of total producer surplus going to labs vs. hyperscalers (distinction #1: this chart is shares; profit-level readouts sit in a separate labeled row); (iii) a small K–n phase plot shading the binding vs. slack region with the current point marked.
- (b) Sliders: number of labs n ∈ [1, 8] (integer), default 3; K ∈ [20, 300], default 100; c ∈ [0.5, 3]; bargaining weight β ∈ [0, 1], default 1 ("1 = compute sold by open competition; below 1, labs negotiate a share of the pie" — appears only in the bargaining sub-view); demand intercept A fixed by the global demand params.
  **Headline scripted moment** (make it a preset button): "Add more labs" — with K binding, n: 2→6 leaves the consumer price bar's *total height unchanged* while the color split shifts from lab markup to hyperscaler rent (App. D result, line 775). Second preset: "Build more GPUs" — K past the binding threshold: scarcity segment collapses to zero, markup segment persists (line 345). These two presets *are* the paper's policy content.
- (c) Plain language required: *Cournot competition* ("a standard model of competition among a few firms: each decides how much to produce, knowing that flooding the market lowers the price for everyone, including itself. More firms → each holds back less → prices fall. We use it because the AI model market has a handful of firms, not thousands"); *markup* ("the gap between price and the firm's own all-in cost per unit, sustainable because the few competitors' products aren't perfect substitutes"); *Lerner index* ("a standard gauge of pricing power: the markup as a fraction of price. It equals 1 over how price-sensitive the firm's customers are — hard-to-replace products ⇒ insensitive customers ⇒ big markup"); *Nash bargaining* ("a standard way to model a negotiated price: each side gets its walk-away value, and the surplus left over is split by bargaining strength — β is the lab's share of that split"); *oligopsony* ("market power exercised by the *buyers* — a few big labs can push the rental price of compute down, mirror-image of the usual seller power"); *binding vs. slack capacity* ("binding: firms would happily sell more if hardware existed — the hardware is the bottleneck. Slack: the bottleneck is gone; any remaining premium is competitive strategy, not scarcity").
- (d) Derivation drawer: Cournot FOC → decomposition identity (4 lines); full App. D algebra with the n-independence of P* highlighted; App. A Nash solution; a fine-print note (per review §1.2.2) that the r* ≈ max{c, v̂_F} auction story is the corner case and the interior case has v_ℓ(x_ℓ) = r* for all active labs.

### 4.4 S4 — Life behind the frontier (static + one micro-widget)
- (a) Sec. 9's three tiers: below average total cost (line 433), below opportunity cost (line 439), below marginal cash cost (line 445); viability threshold v_j(0) vs r*. Visual: a vertical "price ladder" diagram for a trailing firm — rungs at b/a + r_j, b/a + r*, average total cost — with the firm's price p_j draggable up and down the ladder; the diagram labels which regime you're in and what it means, in one sentence each.
- (b) One slider (p_j) plus readouts fed by the S1/S3 global state (r*, r_j with r_j settable ∈ [0.5·r*, r*]).
- (c) Plain language: *opportunity cost* ("what the compute would earn in its best alternative use — selling it to the leader, say. A firm can be cash-positive yet still burning value if it locked in hardware that others would pay more for"); *loss-leading* ("selling below your own cash cost on purpose, betting that staying in the game — keeping customers, data, know-how — pays off later. The paper's appendix formalizes when that bet is rational, and warns it should not be assumed").
- (d) Derivation drawer: App. B Bellman condition (line 695) with a plain-language walkthrough; pointer to S7 for the multi-homing survival route.

### 4.5 S5 + M3 — What happens after a new model release
- (a) Sec. 10: hazard release h(g,I) (line 477), quality draw (line 482), share adjustment (line 494), **V_lead ≈ Δπ/(r + Λ)** (line 504). Visuals: (i) a **race timeline** (x = time, 40 periods): each firm's quality q_ℓt as a step function jumping at releases; below it, a stacked-area chart of compute shares; below that, a two-band strip showing rent split (lab differential rent vs. hyperscaler rent) per period — the "labs gain after breakthroughs, hyperscalers gain during catch-up" claim (line 595) made visible; (ii) a **leadership-value calculator**: three dials → V_lead with a big number and a sentence.
- (b) Timeline sim: challenger release hazard h ∈ [0.05, 0.6]/period, default 0.2; quality jump size (σ of ζ) ∈ [0.05, 0.5], default 0.2; adjustment speed ∈ (0, 1], default 0.4 ("how fast customers actually switch"); re-run button (new seed) + "same seed" toggle. Calculator: Δπ default derived from the current M2 state (leader profit minus its profit if follower matched quality — computed, not dialed, to keep it honest), r ∈ [0.02, 0.15] default 0.05, Λ ∈ [0.1, 1.5] default 0.5.
- (c) Plain language: *hazard rate Λ* ("the per-year chance a rival catches up. Λ = 0.5 means leadership lasts two years on average"); *the value formula* ("profit-while-ahead, divided by (interest rate + catch-up risk). Catch-up risk acts exactly like extra impatience: a lead that could end any month is worth far less than the same profits guaranteed"); *quality ladder / creative destruction* ("economists' name for markets where firms leapfrog each other with better versions, and each leader's profits are both the prize that motivated the last innovation and the target of the next one"); **required caveat, one line under the calculator**: "In reality the prize and the catch-up risk move together — a fatter prize attracts more challenger spending, shortening leads. Treat these dials as a snapshot, not independent levers." (review §1.5.)
- (d) Derivation drawer: 3-line derivation of V_lead as an exponential-hazard perpetuity **with its three assumptions listed** (constant Δπ, constant Λ, no value of regaining the lead); the investment condition (line 508) with the business-stealing vs. spillover over/under-investment paragraph (line 510).

### 4.6 S6 + M4 — Three possible technological futures
- (a) Sec. 11: common asymptote `q(G) = q̄ − d(ψG)^{−β}` (line 527); firm-specific `q(G) = η·q̄ − d·G^{−β}` (line 555); continuing `q(G) = η·G^β` (line 581). Visuals: a **three-tab (or three-column) regime comparison**; per regime, two linked charts over long horizon: (top) q_L and q_F paths + their ratio; (bottom) the three price components (stacked area) and quality-adjusted price line. End-state summary cards per regime: "Leader's edge: gone / permanent / recurring", "Lab markup: maybe persists / persists / cycles", "Hyperscaler rent: depends on capacity / depends on capacity / cycles", mirroring Sec. 11.4.
- (b) Sliders (shared across tabs where meaningful): asymptote gap η_L/η_F ∈ [1.0, 1.6] default 1.27 (≈1.4/1.1, firm-specific regime only); curvature β ∈ [0.1, 1.0] default 0.4; capacity growth rate ∈ [0%, 30%]/period default 10% (this is what lets scarcity rent decay); demand growth ∈ [0%, 30%] default 8% (so users can produce the "capacity grows but demand outruns it" case, line 472). In the continuing-improvement tab, reuse the M3 release simulator in the background for the cycling.
- (c) Plain language: *asymptote* ("a ceiling the technology approaches but can't pass. 'Common ceiling' = everyone eventually builds essentially the same quality product; 'firm-specific ceilings' = some organizations can simply reach higher, permanently"); *commoditization* ("when a product becomes interchangeable across suppliers and competition drives price to cost. **The section's key warning: equal quality alone doesn't do it — you also need enough competing sellers of models AND enough hardware.** Three conditions, not one" — this is the q_L−q_F→0, μ→0, r−c→0 conjunction at line 547 and must be a visually prominent callout); *quality-adjusted price* ("price per unit of usefulness rather than per answer. Nominal prices can stay flat while quality-adjusted prices collapse — most of what users gain arrives this way"; distinction #2).
- (d) Derivation drawer: the three functional forms with limits worked (lines 531–537, 557–559); the honest note that the μ-compression arrows (line 541) hold under the demo's demand system specifically; the "exponentially increasing compute for proportional gap reduction" observation (line 533) connected in one sentence to Bloom et al.'s "ideas getting harder to find."

### 4.7 S7 — Why users subscribe to several providers (widget)
- (a) App. C: subscription condition (line 708), portfolio incremental value Ω_ij (line 728), and the subscription-share ≫ usage-share ≫ compute-share separation (line 754). Visual: a **task-routing table**: rows = 5 task types (writing, coding, analysis, quick lookups, long documents) with fixed illustrative per-provider qualities; columns = providers with subscription fee φ and per-use price ρ; user toggles subscriptions on/off; each row highlights where the task routes; footer computes total user value and each provider's three shares (subscribers / usage / compute) as three small bars.
- (b) Adjustable: φ_m ∈ [0, 30] and ρ_m ∈ [0, 2] per provider (defaults: Leader φ=20, ρ=1.0; Follower A φ=8, ρ=0.6); user's task mix via 5 small count steppers.
- (c) Plain language: *two-part tariff* ("pay a flat fee for membership, then a low price per use — gyms and warehouse clubs work this way. The flat fee harvests value the per-use price leaves behind"); *multi-homing* ("keeping subscriptions to several providers and routing each task to whichever is best at it. Note the punchline: a second-tier provider doesn't need to be anyone's favorite overall — just clearly better at *something* — to earn its fee").
- (d) Derivation drawer: App. C's Ω formula annotated term-by-term; the ρ < κ cross-subsidy condition (line 750).

### 4.8 S8 — Explore the full model
- All Params exposed in a grouped panel (Market / Firms / Dynamics / Regime); all module charts rendered as a dashboard grid, live off the same store; preset manager (Normalized, Illustrative, plus the scripted presets from S3); **Export parameters (JSON)** and **Copy shareable URL** (params serialized to the hash fragment). Banner: "For readers comfortable with the full machinery — everything above is this page with training wheels."

### 4.9 S9 — Colophon
- Link/download: the paper PDF, `notebook/llm-econ-model.ipynb`, `fixtures.json`, source repo. Index of all derivation drawers (each drawer gets an anchor). One-paragraph disclaimer restating: generic firms, normalized units, illustrative calibration is illustrative.

---

## 5. File/component structure to create

```
C:\apps\AI-Econ\web\
  package.json  vite.config.ts  tsconfig.json  index.html
  public/
    notebook/llm-econ-model.ipynb        # Phase 9; also linked from S9
    paper.pdf                            # compiled from ../paper-draft (whenever available)
  src/
    main.tsx  App.tsx  styles.css        # styles.css holds design tokens (§7)
    state/store.ts                       # Zustand: Params + calibration mode + preset actions
    model/                               # PURE math, no DOM — see §3
      types.ts demand.ts allocation.ts cournot.ts bargaining.ts
      dynamics.ts regimes.ts subscriptions.ts presets.ts
      __tests__/{allocation,cournot,dynamics,regimes,subscriptions}.test.ts
      __tests__/fixtures.json
    components/
      Katex.tsx                          # inline/display math wrapper
      Term.tsx                           # dotted-underline term -> plain-language popover; content from glossary.ts
      glossary.ts                        # ALL plain-language definitions from §4(c), keyed by slug
      Derivation.tsx                     # collapsible "Show the math" drawer w/ anchor id
      Slider.tsx  ParamGroup.tsx  PresetButton.tsx
      CalibrationToggle.tsx              # Normalized <-> Illustrative, sticky header
      charts/
        Axes.tsx  useChartDims.ts
        MarginalValueChart.tsx           # M1/M2: v(x) curves + water line + K
        ThetaStrip.tsx                   # purchaser segmentation strip
        PriceStackBar.tsx                # nominal + quality-adjusted twin bars
        RentShareBar.tsx                 # 100% surplus-share bar (labeled SHARES)
        BindingRegionPlot.tsx            # K-n phase plot
        RaceTimeline.tsx                 # M3 quality steps + share areas + rent strip
        RegimePaths.tsx                  # M4 two-panel path chart
        LadderDiagram.tsx                # S4 price ladder
        RoutingTable.tsx                 # S7 widget
    sections/
      S0Hero.tsx S1Allocation.tsx S2WinnerTakeMost.tsx S3PriceAnatomy.tsx
      S4TrailingLabs.tsx S5ReleaseRace.tsx S6Regimes.tsx S7Subscriptions.tsx
      S8Explorer.tsx S9Colophon.tsx
    content/
      derivations/                       # one .tsx per drawer (uses Katex), e.g. allocation-benchmark.tsx,
                                         # wta-condition.tsx, cournot-decomposition.tsx, bargaining.tsx,
                                         # vlead.tsx, regimes.tsx, subscriptions.tsx, loss-leading.tsx
      copy.ts                            # narrative prose per section (keep prose out of components)
```

Module components (M1–M4) are not separate files; each lives inside its host section component, composed from `charts/` + `model/`. The explorer imports the same chart components.

---

## 6. Phased build sequence (each phase ≈ one agent session)

1. **Scaffold** — Vite+React+TS app in `web/`; styles.css with design tokens (§7); sticky header with CalibrationToggle stub; section skeletons S0–S9 with placeholder prose; Katex, Term, Derivation, Slider components working; deploy check (`npm run build` emits static dist). *Scope: small-medium.*
2. **Model core** — all of `src/model/` per §3, with hand-computed unit tests (fixtures.json arrives in Phase 9; write provisional expected values by hand for the Cournot closed forms, which are exact). This phase writes no UI. *Scope: medium-large; the water-filling and demand segmentation are the only nontrivial algorithms.*
3. **Essay pass** — full narrative copy for S0–S9 in `content/copy.ts` drawing on the paper's own intuition paragraphs; glossary.ts fully populated from §4(c); S0 hero diagram (static SVG). No interactive charts yet. *Scope: medium; writing-heavy.*
4. **M1 + S1/S2** — MarginalValueChart, ThetaStrip, WTA banner, tipping-point button, both sections wired to store. *Scope: medium-large (the flagship chart).*
5. **M2 + S3 + S4** — PriceStackBar (+ quality-adjusted twin), RentShareBar, BindingRegionPlot, the two scripted presets, bargaining sub-view; S4 LadderDiagram. *Scope: medium-large.*
6. **M3 + S5** — seeded simulator UI, RaceTimeline, V_lead calculator with derived Δπ and the equilibrium caveat. *Scope: medium.*
7. **M4 + S6 + S7** — RegimePaths with three tabs and summary cards; S7 RoutingTable widget. *Scope: medium.*
8. **Explorer (S8)** — parameter panel groups, dashboard grid reusing charts, JSON export, URL-hash state sharing, preset manager. *Scope: medium.*
9. **Notebook + fixtures + derivations** — write `llm-econ-model.ipynb` (numpy/matplotlib; sections mirroring `model/` files; final cell dumps `fixtures.json`); wire Vitest to fixtures; write all derivation drawers in `content/derivations/`; S9 colophon. *Scope: medium-large. Coordinate with the paper: this notebook is also the paper's numerical-illustration engine (see paper-review-notes.md §5, item 9).*
10. **Polish + audit** — responsive/mobile pass; dark mode; accessibility (sliders keyboard-operable, charts get text summaries); a **constraints audit against §7 below, checked item by item**; cross-browser; deploy. *Scope: small-medium.*

Phases 4–7 are independent of each other after Phase 2+3 and can be reordered or parallelized across sessions.

---

## 7. Design constraints to preserve (verbatim requirements — audit these in Phase 10)

1. **Generic firm names only**: "Leader," "Follower A," "Follower B," "Hyperscaler." Never OpenAI/Anthropic/Google/Microsoft/NVIDIA etc., in copy, labels, presets, alt text, or the notebook. Rationale (from the notes): real names make readers argue calibration instead of learning the mechanism.
2. **Normalized ↔ Illustrative toggle**: global, sticky, defaulting to Normalized (c=1, q_L=1.4, q_F=1.1, K=100). The Illustrative preset must be visibly badged "illustrative calibration — round numbers, not estimates" everywhere it changes a displayed unit.
3. **Four conceptual distinctions, each with a fixed visual encoding used consistently on every chart, defined once as CSS tokens**:
   - **Profit level vs. share of surplus**: levels are bars/numbers with currency-ish units; shares are 100%-normalized bars/donuts with a "% of producer surplus" axis label. Never mix on one chart; RentShareBar carries a permanent "SHARES, not levels" caption.
   - **Nominal vs. quality-adjusted price**: always shown as twin elements — solid fill for nominal, hatched/outlined twin for quality-adjusted, with a persistent legend. If a chart shows only one, it must say which.
   - **Total market vs. frontier segment**: the θ-strip encodes the frontier/high-value segment with a distinct token color; any statistic scoped to the frontier segment carries a chip "frontier segment only."
   - **Temporary vs. durable leadership**: timeline charts shade leadership spells; temporary spells get the dashed/animated boundary token, durable dominance (firm-specific-asymptote regime) gets the solid boundary token; summary cards in M4 must state which kind is on display.
4. **Every technical term routes through `<Term>`/glossary.ts** — no bare "Cournot," "Lerner," "Nash bargaining," "hazard," "shadow price," "oligopsony" anywhere in rendered copy.
5. **Honesty guardrails imported from the paper review** (`paper-review-notes.md`): S2 presents winner-take-most as a *condition*, not a likelihood (§1.3.1 there); M3's Δπ/Λ non-independence caveat (§1.5); M4's derivation drawers scope the elasticity/markup arrows to the demo's demand system (§1.6.1); M1's fine print notes the demand system is the demo's concretization of the paper's general R(y;Q) (§1.2 here).
6. **Single source of truth for math**: no equation reimplemented inside a component; everything calls `src/model/`; the notebook is the oracle via fixtures.
7. **The central narrative sentence** (notes, final lines) appears verbatim in S0 and is echoed in S9: "New models shift the value of GPU capacity. Scarcity determines how much surplus exists, competition determines who receives it, and technological progress determines whether market leadership is temporary, persistent, or eventually commoditized."
