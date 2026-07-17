# Resolution Log: Critical Review (paper-review-critical-gaps.md)

Paper: `paper-draft-July-14-additions.tex`. All line numbers below refer to the revised file after these edits. The paper compiles cleanly with `latexmk -pdf -interaction=nonstopmode -halt-on-error` (47 pages, no undefined references, no errors; a handful of pre-existing cosmetic overfull-hbox warnings remain, none introduced by this pass except one in the notation table, which was fixed by switching its second column to a wrapping `p{}` column, requiring `\usepackage{array}` in the preamble).

---

## C1 — Proposition 4 / `prop:breakthrough` (statement ~707–723, proposition ~747–763; proof in Appendix F ~1159–1251)

**What changed.** The proposition and its proof were restructured into two explicitly separate parts, proven in two different, clearly labeled models, rather than one proposition proven by a single (flawed) argument:

- **Part 1 (markup and elasticity).** Proven under Bertrand price competition in the slack-capacity regime, with a *general* compute-inclusive marginal cost `κ ≥ 0` (not the old `κ=0` normalization). Appendix F, §"Bertrand equilibrium and comparative statics (slack capacity)" (~line 1183, `subsec:app-bertrand`) derives closed forms `μ_L = Δ(2Q_L−κ)/(3Q_L+Δ)` and `ε_LL = [Q_L/(2Q_L−κ)]·(2+3κ/Δ)` where `Δ≡Q_L−Q_F`, and differentiates both directly: `∂μ_L/∂Δ = (2Q_L−κ)·3Q_L/(3Q_L+Δ)² > 0` whenever `2Q_L>κ` (i.e., whenever `μ_L>0`, the proposition's own interior-equilibrium condition), and `∂ε_LL/∂Δ = −3κQ_L/[(2Q_L−κ)Δ²] < 0` whenever `κ>0`. This replaces "can be verified directly" with an actual derivative, and resolves the vacuous-elasticity problem honestly: at `κ=0` the derivative is identically zero and `ε_LL≡1`, which the text now states is the *degenerate boundary* of the result, not a demonstration of it.
- **Part 2 (differential compute rent).** The flawed capacity-free Bertrand "bridging paragraph" (old line 1172) is deleted and replaced with a new subsection, "Capacity-constrained Cournot and the compute-rent comparative static" (~line 1219, `subsec:app-cournot-breakthrough`). This builds a model in which `x_ℓ` genuinely appears: laboratories precommit compute `x_ℓ`, deploy it as output `y_ℓ=x_ℓ/a_ℓ`, and receive the two-model system's price — the Kreps–Scheinkman reduced form (capacity-then-price competition ⟹ Cournot outcomes) already cited in the literature review, now actually used rather than gestured at. `v̂_ℓ(x_ℓ,x_{-ℓ}) ≡ ∂π_ℓ*/∂x_ℓ` is then a well-defined function of the compute allocation, evaluated at the winner-take-all corner `x_L=K, x_F=0` (the corner the paper's own `r*≃max{c,v̂_F}` definition already presumes). Closed form: `v̂_L−v̂_F = −K·Q_L + Δ·(1−K)`, so `∂(v̂_L−v̂_F)/∂Δ = 1−K > 0` whenever `K<1`, which is exactly the paper's maintained scarcity condition (capacity insufficient to serve the whole addressable market), not an extra assumption. The formula also self-disciplines the corner: at `Δ=0` it gives `v̂_L−v̂_F=−KQ_L<0`, correctly saying the corner should *not* arise absent a quality gap.
- The proposition statement (~line 747) now states both parts with their respective scope conditions, and explicitly flags that Part 2 holds `κ` fixed as `Δ` varies (the review's point 3), with a paragraph explaining why the partial-equilibrium version is still informative (isolates the direct/mechanical channel from the indirect wholesale-price channel; approximates the impact effect over the short window the empirical predictions target).

**What is now proven vs. still assumed.** Both halves are now proven by direct differentiation in named, fully specified models (Bertrand/slack-capacity for Part 1; capacity-constrained Cournot/binding-capacity for Part 2), each restricted to the two-model demand system of Lemma 1. What is *not* claimed: general-demand-system versions of either result (the text says so explicitly before the proposition), and the general-equilibrium version of Part 2 in which `κ` responds to `Δ` through `r*` (flagged as an unsolved fixed point, parallel to the `Λ_L` fixed point the paper already declines to solve in Section 9).

---

## C2 — Proposition 1 / `prop:segment-wta` (~line 358–388)

**(a) Missing participation condition and non-unique `r*` in part 3.** Part 2 now reads: segment `k` is served by `L_k` alone **iff** `v_{L_k,k}(0)>r*` **and** `max_{ℓ≠L_k} v_{ℓk}(0)≤r*`, with an explanatory sentence showing the old one-sided condition is also satisfied when no laboratory serves the segment at all. Part 3 is restated to mirror the aggregate boxed condition of Section 5 directly: `L` absorbs all of `K` iff `v_L(K) ≥ max_k max_{ℓ≠L} v_{ℓk}(0)`, where `v_L(K)≡G_L'(K)` is defined as the common shadow price when `L` optimally allocates `K` across every segment it could serve — avoiding the old non-unique supporting-`r*` selection problem entirely.

**(b) Separability vs. Lemma 1's own microfoundation.** The paragraph introducing segment-level separability (~line 375) now states plainly that separability is doing two jobs — a cross-segment restriction (as before) and a much stronger within-segment restriction that rules out `G_{ℓk}` depending on a rival's allocation. It shows explicitly that Lemma 1's own two-model system violates within-segment separability the moment two labs contest one segment (`MR_L` depends on `y_F` directly). Proposition 1 is now scoped, in its own preamble, to segments served by one active laboratory against passive/inactive rivals. The claim at the old line 389 that the two-model system "delivers this exactly" within Proposition 1 is corrected: the text now says this is *not* an instance of Proposition 1 (it's exactly the nonseparable case Prop 1 sets aside), while noting what the two-model system *does* prove directly and self-sufficiently (Proposition 4's own markup comparative static).

**What is now proven vs. still assumed.** The biconditionals in parts 2–3 are now genuinely biconditional. The separability restriction is not removed (a full nonseparable segment-level proposition is not attempted — that would require redoing Appendix E's aggregate nonseparable condition at the segment level, which the text notes is not done here) but its scope is now honestly stated rather than silently oversold.

---

## C3 — Task-indexed productivity paragraph (~line 316–321, end of `sec:persistent-advantage`)

Rewrote the paragraph to say the opposite of its previous (false) claim: the aggregate winner-take-all condition is **not**, in general, robust to task dispersion, because a follower's `v_ℓ(0)` is governed by its *best* task (`max_k χ_{ℓ,k}`), not the task-weighted average that is normalized to zero — a follower with low average productivity but one strong task can still break aggregate WTA, which is exactly the mechanism Proposition 1 (`prop:segment-wta`) formalizes. Fixed the weighting problem by specifying a single, common, market-wide task weighting `w_k` (e.g., each task's share of aggregate purchaser mass) applied identically to every laboratory, so `α_L` and `α_j` are actually comparable; also flagged, as requested, that the normalization is imposed on log productivity, so `α_ℓ` is a geometric-mean advantage, with a Jensen's-inequality caveat.

**Bundled with this fix:** renamed `β_{ℓ,k}` (task comparative advantage) to `χ_{ℓ,k}`, since it was the newest and least entrenched of the three colliding uses of `β` (see Notation section below) and this paragraph was the only place it appeared.

---

## C4 — Proposition 3 / `prop:segmented-entry` (~line 843–876)

See the detailed explanation in the reply to the user. Summary of the mechanical change: replaced the appeal to "the protected-niche configuration of Proposition [segment-wta]" (which is self-contradictory under the proposition's own symmetric-quality assumption) with an explicit friction-based protection mechanism, giving `s_{imk}` — introduced in Section 6.1 but never previously used in any formal object (review item M6) — a concrete role and a derived minimum magnitude:

```
s ≥ s_min ≡ B·K/a − r*,   r* = (A−b)/a − 2BK/a²
```

derived from the segment demand system and the utility specification `u_{imk}=θ_{ik}Q_{mk}−P_{mk}−s_{imk}` already in the paper. The profit/price results (parts 1–2) are algebraically unchanged (they never depended on *why* rivals stay out, only on the fact that they do), so the S-fold profit result and the square-relationship entry result (part 3) survive intact once the protection condition is stated honestly and satisfied.

Also added, per gap (b): the two capacity-binding thresholds — segmented, `K < a(A−b−ac)/(2B)`, vs. head-on Cournot, `K < aS(A−b−ac)/(B(S+1))` (the latter already in Appendix D, now labeled `eq:cournot-slack-threshold`) — with a proof that the segmented threshold is always the stricter one, and an explicit statement that the proposition's domain is restricted to `K` below the segmented threshold, with the window between the two thresholds flagged as an excluded region where the comparison in parts 1–2 is not meaningful.

Updated `subsec:entry-honesty` (~line 927 region, entry-honesty subsection) to no longer say the segmentation result "is derived" unqualified — it now says the other three entry results are unconditional derivations, while the segmentation result is derived *conditional on* the friction threshold and the capacity-domain restriction, both now stated with explicit checkable magnitudes rather than presumed.

**What is now proven vs. still assumed.** The friction threshold and domain restriction are derived, not assumed. What remains assumed / unmodeled, and is now stated as such: (i) which laboratory is assigned to which segment (taken as a primitive of market structure, no entry-into-segments game), and (ii) whether real-world frictions actually reach `s_min` for any given market (the paper gives the threshold, not an estimate that it is cleared).

---

## M1 — Upstream conduct assumption (competitive vs. bargained)

Added explicit conduct-assumption statements at the point each proposition is first used:
- Before Proposition `prop:capacity-neutrality` (~line 466): states the price-taking-in-`r*` assumption explicitly and gives the bargaining-weight `ζ` reinterpretation of the results (`r*` replaced by the Nash-bargained price of Appendix A; rent-transfer direction survives, magnitude shrinks with `ζ`).
- Before Proposition `prop:free-entry` (~line 802): same statement, tied to `π(n)` being the competitive-upstream profit, noting `n*` becomes a lower bound under bargaining.
- Inside Proposition `prop:segmented-entry`, part 3 (~line 850): parallel note for `π^seg(S)` and `S̄`.
- Appendix A's opening paragraph (~line 952, `app:bargaining`) now back-references these three propositions explicitly, closing the loop the review asked for (a forward/back pointer between Section 7/11 and Appendix A).
- The new Limitations paragraph "A patchwork of conduct assumptions" (~line 927) ties all of this together in one place and states plainly that the paper does not pick one conduct model.

---

## M2 — Unconstrained Bertrand inside a binding-capacity paper

Substantially resolved by the C1 restructuring (Part 2 of Proposition 4 is now a genuinely capacity-constrained Cournot result). In addition:
- Added an explicit scope paragraph at the start of `subsec:price-competition` (~line 481, "Differentiated-price competition," where Bertrand is first used for the markup dynamics), stating that this is a slack-capacity/locally-compute-inclusive-cost analysis, explaining the Edgeworth-problem reason unconstrained Bertrand cannot describe the binding-capacity regime, and pointing to the new capacity-constrained Cournot derivation in Appendix F for the results that need one.
- The new Limitations paragraph (M1, above) restates this so no "no explicit compute endowment constraint" caveat is left sitting uncontradicted next to the fix — the caveat is now resolved and cross-referenced rather than merely disclosed.

---

## Notation collisions

Checked the prior review/followup notes first, per instructions. The `F` (distribution vs. follower, `subsec:two-model-demand`) and `r*` (competitive-benchmark vs. oligopoly-auction, footnote at first oligopoly use) collisions were confirmed already handled by explicit notational-note sentences in the current draft and were used as the template for the rest.

- **β triple duty.** Task-comparative-advantage `β_{ℓ,k}` renamed to `χ_{ℓ,k}` (only one paragraph, ~line 316–321; done as part of C3). `β^s` (hyperscaler discount factor) and `β` (scaling-law curvature) are left as is — both are heavily entrenched (dozens of occurrences across Sections 9–11) and now that the third meaning is gone, only two meanings remain, well separated by context (a superscript-`s` discount factor vs. a curvature exponent in `q_ℓ(G)` laws); no note was judged necessary beyond the rename itself, which the notation table documents.
- **r triple duty.** The discount rate (`V_lead` formula, Section 9; Propositions `prop:free-entry` and `prop:segmented-entry`, Section 11) is renamed to `ρ` throughout (~13 occurrences, all localized to Sections 9 and 11). The wholesale compute price `r`/`r*` is untouched. The resource index `r` in Appendix E (`a_m^r`, `λ_r`, `c_r`) is untouched but flagged in the notation table, since it is always a super/subscript on a different base letter and low-risk.
- **A double duty.** Left as two objects (`A_t` frontier level vs. `A` demand intercept) rather than renamed, since the demand-intercept `A` is threaded through Proposition `prop:capacity-neutrality`, Proposition `prop:free-entry`, Proposition `prop:segmented-entry`, and Appendix D/Cournot — many occurrences, matching the task's own guidance to prefer a disambiguating note over renaming when many sections are touched. Added a footnote at `A`'s first proposition-level use (Proposition `prop:capacity-neutrality`, ~line 471) explicitly distinguishing it from `A_t` and noting the two never co-occur in one expression.
- **G collision flagged too late.** The existing flag ("we write `Γ_ℓ` rather than reusing `G_ℓ`...") at `subsec:entry-cost` is retained, and a new, earlier flag was added at `G_{ℓt}`'s first (previously unflagged) use in Section 10 (~line 703, "Let `G_{ℓt}` denote cumulative effective training investment...), stating the collision with `G_ℓ(x)` explicitly and noting the disambiguation rule (allocation argument vs. time-indexed stock) up front rather than only once `Γ_ℓ` appears three sections later.
- **Table 1 (`tab:notation`)** updated: added `χ_{ℓ,k}` and `ρ` as new rows; the second column was changed to a wrapping `p{4.4in}` column (requiring `\usepackage{array}`) because the added rows overflowed the page width in the original two-`l`-column format; added a new labeled block, "Symbols reused for unrelated objects, disambiguated by context or a note at first use," listing all five collisions (`A_t`/`A`, `G_ℓ(x)`/`G_{ℓt}`, `F`/`F`, `r*`/`r*`, `r`/resource-index `r`) with a pointer to where each is disambiguated.

---

## Build verification

`latexmk -pdf -interaction=nonstopmode -halt-on-error paper-draft-July-14-additions.tex` from `C:\apps\AI-Econ` completes successfully: 47 pages, no undefined references or labels, no LaTeX errors. Remaining warnings are cosmetic overfull-hboxes (line-breaking of long inline math/prose in a few places), pre-existing in style and not indicative of a compilation problem.
