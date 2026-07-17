# Critical Review: Unstated Assumptions and Mathematical Gaps

**Paper:** "The Future Economics of LLMs: From Hyperscaler GPUs to Consumer Usage" (paper-draft-July-14-additions.tex)
**Scope of this review:** unstated assumptions and mathematical gaps only, ranked by damage to the paper's core claims. Line numbers refer to `paper-draft-July-14-additions.tex`. Issues the paper already discloses (e.g., the separability caveat at line 324, the three hidden assumptions of the leadership-value formula at line 637, the symmetric-linear caveat of Proposition 2 at line 467) are not re-flagged unless the disclosure is incomplete.

---

## Tier 1 — Critical: gaps that undermine a boxed or numbered proposition

### C1. Proposition 4 (`prop:breakthrough`, lines 737–741): the compute-rent half of the proposition is not actually proven, and the elasticity claim is degenerate in the only case solved

**Location:** Proposition statement lines 737–739; claimed proof in Appendix F, lines 1152–1174, especially the paragraph at line 1172.

**The gap.** The proposition asserts two comparative statics: (i) the leader's Lerner markup μ_L is increasing in the quality gap, and (ii) the *differential private value of compute* v̂_L − v̂_F is increasing in the gap. The appendix genuinely proves (i) — but only under the normalization κ_L = κ_F = 0, N = θ̄ = 1. For (ii), the appendix openly concedes that "this reduced Bertrand game has no explicit compute endowment constraint," and then bridges the gap with the sentence:

> "Because π_L in this game is proportional to the value the leader generates per unit of compute-inclusive marginal cost, a marginal relaxation of a binding compute endowment raises π_L in proportion to ∂π_L/∂(Q_L−Q_F), so the marginal value of compute inherits the same comparative-static sign as π_L in the quality gap." (line 1172)

This is not a derivation. π_L being "proportional to the value the leader generates per unit of compute-inclusive marginal cost" is not a defined statement in a game where marginal cost has been normalized to zero, and even if it were, "a relaxation of a constraint raises π_L in proportion to a derivative with respect to quality" is a non sequitur: v̂_ℓ is defined (line 426) as ∂π*_ℓ/∂x_ℓ, a derivative with respect to *compute*, in a game where compute never appears. The object the proposition makes claims about does not exist inside the model used to prove it.

Three subsidiary problems compound this:

1. **The elasticity claim is vacuous in the solved case.** With κ = 0, the Lerner identity forces ε_LL ≡ 1 at every quality gap — the appendix admits this (line 1174: "under the zero-cost normalization ε_LL is pinned at unity"). The elasticity direction is then read off the residual-demand *slope* (a primitive) rather than the equilibrium elasticity. But the proposition's headline sentence ("a breakthrough... lowers the leader's own-price elasticity ε_LL") is a claim about the equilibrium elasticity, which requires the positive-cost case.
2. **The positive-cost case is asserted, not shown.** Line 1174: "With positive constant marginal costs the same comparative-static signs can be verified directly by the same differentiation" — no differentiation is presented, and the follow-on claim that ε_LL = P_L/μ_L "then falls as the gap widens" needs an argument, since P_L and μ_L both rise with the gap and the direction of their ratio is not obvious. (Numerical check: the claimed directions do hold with positive common costs, so this is a rigor gap rather than an error — but a referee will not do that check for you, and "can be verified" is not a proof in a paper that elsewhere distinguishes carefully between derived and conjectured results.)
3. **The proposition holds κ fixed while varying the gap, contradicting the paper's own mechanism.** κ is "compute-inclusive" (it contains r_ℓ), and the paper's central dynamic story (Section 9, Section 12 prediction 4) is that a follower release raises v̂_F and hence r*. So the comparative static that is supposed to describe a follower release is computed holding fixed the very price the paper says the release moves. At minimum this needs a statement that the result is partial-equilibrium in r.

**Why it matters.** Proposition 4 is described as "the headline dynamic prediction" (line 735); it is load-bearing for the common-asymptote commoditization chain (line 684), the continuing-improvement regime (lines 725–741), the segment-level pricing claims (line 389), and empirical predictions 2 and 4. A referee who checks the appendix will find that half the proposition rests on an admittedly-out-of-model analogy, and the abstract's claim that markup/rent cycling is a derived result is then overstated.

---

### C2. Proposition 1 (`prop:segment-wta`, lines 367–377): the "if and only if" in part (2) is false as stated, and the separability assumption contradicts the paper's own microfoundation

**Location:** Proposition statement lines 367–375; separability setup line 365; proof sketch line 377; the claim at line 389 that Lemma 1 applies "exactly" within a segment.

**Gap (a): the biconditional in part (2) is missing a condition.** Part (2) states: "segment k is served by laboratory L_k alone if and only if max_{ℓ≠L_k} v_{ℓk}(0) ≤ r*." The forward direction is fine. The converse fails: the stated condition is also satisfied when *no* laboratory serves segment k at all (i.e., when v_{L_k,k}(0) ≤ r* too — every pair inactive). "Served by L_k alone" requires, in addition, that L_k itself clears the participation threshold, v_{L_k,k}(0) > r*. This is trivially fixable (condition on the segment being served, or add L_k's participation condition), but as written a boxed proposition asserts an equivalence that has counterexamples. A related selection issue affects part (3): when one laboratory absorbs all of K, the supporting r* is not unique (any value between the best excluded pair's v(0) and the leader's marginal value supports the corner), so "the condition holds for that laboratory in every segment" depends on which supporting price is selected; the aggregate boxed condition at line 340 avoids this by comparing v_L(K) directly to rivals' v_ℓ(0), and the segment version should do the same.

**Gap (b): separability across laboratory–segment pairs assumes away within-segment competition — the very thing the proposition is about.** Line 365 assumes lab ℓ's value from segment k is G_{ℓk}(x_{ℓk}), a function of its *own* allocation only, and discloses that this "abstracts from cross-segment demand linkages such as shared subscriptions, bundled enterprise contracts, or reputational spillovers." But the disclosure covers only cross-*segment* linkages. The more serious restriction is cross-*laboratory* dependence *within* a segment: in the paper's own microfounded demand system (Lemma 1 / Appendix F), MR_L depends directly on y_F — G_L cannot be written as a function of x_L alone when two labs serve the same purchaser pool. So the assumption needed for Proposition 1 is inconsistent with the demand system the paper uses to microfound concavity, precisely in the case that determines whether a segment is winner-take-all (two labs contesting one segment). Line 389 then compounds this by claiming that "applied within a single segment, the two-model demand system of Lemma 1 delivers this exactly" — but the two-model system is exactly the case the separability assumption rules out. The nonseparable extension in Appendix E (line 1115) is stated only at the aggregate laboratory level and only as a one-directional dominance check; it does not rescue the segment-level proposition.

**Why it matters.** Proposition 1 is the formal core of the paper's most recently added and most heavily advertised mechanism (segment-level coexistence), and both halves of the problem sit in the proposition itself, not in the surrounding prose. A referee can construct a two-lab, one-contested-segment example straight from the paper's own Lemma 1 in which the G_{ℓk} objects the proposition quantifies over do not exist.

---

### C3. Task-indexed productivity paragraph (lines 307–311): the claim that "the aggregate winner-take-all condition depends only on the task-weighted average" is false, and the β normalization is not well-defined across laboratories

**Location:** Lines 307–311, the paragraph introducing log q_{m,k,t} = A_t + α_{ℓ(m)} + β_{ℓ(m),k} + ε_{m,k,t}.

**The gap.** Two problems:

1. **The averaging claim contradicts the paper's own Proposition 1.** The paragraph justifies working with the scalar η_ℓ through Section 6 "because the aggregate winner-take-all condition depends only on the task-weighted average." This is not derived anywhere, and it is false in the model's own terms: the aggregate WTA condition v_L(K) ≥ max_{ℓ≠L} v_ℓ(0) depends on each follower's *best* initial use of compute, and with task-indexed productivity a follower's v_ℓ(0) is determined by its best segment — i.e., by max_k β_{ℓ,k}, not by the weighted average Σ_k w_k β_{ℓ,k} = 0. A follower with average productivity far below the leader's but a single strong task (large β_{ℓ,k'}) breaks aggregate WTA. That is *exactly* the protected-niche mechanism Proposition 1 formalizes twenty lines later. As written, the sentence asserts the opposite of the section it is introducing.
2. **The normalization Σ_k w_k β_{ℓ,k} = 0 "under task weights w_k" leaves α_ℓ ill-defined for cross-lab comparison.** The text glosses α_ℓ as "laboratory ℓ's average productivity across its task mix." If w_k is lab-specific ("its task mix"), then α_L and α_j are averages over *different* weightings, and the statement "a laboratory with α_L > α_j on average" is not a comparison of like with like — the α/β decomposition is only identified relative to one common weighting. If w_k is common, the text should say whose weights (market-wide compute shares? revenue shares? — these are endogenous). Also, since the normalization is imposed on *log* productivity, α_ℓ is a weighted geometric mean advantage, not "average productivity"; the distinction matters because the objects that enter v are levels, and Jensen's inequality drives a wedge between the two exactly when the β dispersion the paragraph is about is large.

**Why it matters.** This paragraph is the bridge between the paper's scalar machinery (Sections 5–6) and its segmentation machinery (Section 6.1), and its stated justification for using the scalar is wrong in the direction that matters: it claims aggregate concentration analysis is insensitive to task dispersion, when the paper's own next proposition shows aggregate WTA is broken by a single task-level outlier. A critic quotes these two passages side by side.

---

### C4. Proposition 3 (`prop:segmented-entry`, lines 821–838): the protected-niche configuration contradicts the proposition's own symmetry assumptions, and the binding-capacity assumption is stronger than acknowledged

**Location:** Proposition statement lines 821–832; the "protected in the sense of Proposition 1" sentence at line 834.

**Gap (a): symmetric labs at quality parity cannot have protected niches within the model.** The proposition assumes S *symmetric* segments, entrants at *quality parity* (common F, common a, common demand parameters), each lab the sole provider of one segment, and justifies sole provision by "the protected-niche configuration of Proposition 1... rivals' task-specific quality or frictions keep their marginal value in that segment below the clearing price" (line 834). But under the proposition's own symmetry, rival ℓ's value schedule in segment k is *identical* to the incumbent's, so v_{ℓk}(0) equals the incumbent's v at zero, which strictly exceeds the incumbent's marginal value at its equilibrium allocation r* (v is strictly decreasing). The protection condition v_{ℓk}(0) ≤ r* of Proposition 1 is therefore *violated* for every rival in every segment, by the assumptions of Proposition 3 itself. The configuration is not an equilibrium of any game specified in the paper: what keeps each monopolist unchallenged is either asymmetric task quality (contradicting quality parity) or the frictions s_{imk} — which are never given a magnitude, never enter any G or v function (see M6), and would in any case have to be large enough to absorb the entire gap v_{ℓk}(0) − r*. The one-lab-per-segment assignment itself is also unmodeled (no entry-into-segments stage, no reason two entrants don't pick the same segment).

**Gap (b): "let aggregate capacity bind" is a stronger assumption in the segmented configuration, and the S-fold profit comparison fails in a parameter window.** Segment monopolists restrict output more than head-on Cournot competitors. Capacity binds under S segment monopolists only if K < a(A−b−ac)/(2B), while it binds under head-on Cournot at the laxer threshold K < a·n(A−b−ac)/(B(n+1)) (Appendix D, line 1066). For K between these thresholds, the head-on configuration binds but the segmented one is slack (r* = c), and both part (1)'s "S times" comparison and part (2)'s price-neutrality claim fail. The proposition assumes binding in both without noting that this excludes a nonempty region where the two configurations cannot be compared on its terms.

**Why it matters.** Part (3)'s striking headline — segmentation supports the *square* of the head-on entrant count — is the paper's strongest quantitative claim about market structure. It is computed under a configuration that the paper's own Proposition 1 says cannot arise under the stated symmetry. The honesty subsection (line 843) says the segmentation result is "derived"; it is derived *conditional on a configuration that is internally inconsistent as stated*, which the honesty subsection does not disclose.

---

## Tier 2 — Major: unstated assumptions that shift between sections or unproven load-bearing assertions

### M1. The upstream conduct assumption silently changes between the propositions and the bargaining appendix

**Location:** Proposition 2 (lines 460–467), Appendix D (lines 1033–1068), Proposition 5 (lines 792–806), versus Appendix A (lines 918–953).

**The gap.** Propositions 2, 5, and 6 all require laboratories to be *price takers in the compute market* while playing Cournot downstream (a Cournot–Walras structure: labs choose quantities taking r as given; r adjusts to clear capacity). This conduct assumption is never stated as an assumption. Appendix A, and the main text at line 953, argue at length that "a market with few laboratories and few hyperscalers is... a bilateral oligopoly" with oligopsony power. The two are inconsistent: if labs internalize their effect on r* (as Appendix A says few labs will), the flow profit is not π(n) = BK²/(a²n²) — labs restricting demand for compute capture part of the scarcity rent, π(n) is larger, and n* in Proposition 5 is larger. The rent-transfer statement in Proposition 2 ("raising n... transferr[s] fixed-capacity rent from laboratories to hyperscalers") is likewise specific to competitive upstream conduct. Neither proposition statement flags this; Proposition 5 in particular presents n* as following from "machinery already in the paper" when Appendix A's machinery would change it.

**Why it matters.** The free-entry count, the natural-monopoly window, and the market-growth reversal (Section 11) all inherit the competitive-upstream assumption. Under Nash bargaining with ζ > 0 — the case the paper itself argues is realistic — every one of those expressions changes. A referee will ask which conduct assumption the paper actually believes, since it uses both.

### M2. Bertrand price competition without capacity constraints, inside a paper whose maintained assumption is binding capacity

**Location:** Proposition 4 and Appendix F (Bertrand, "no explicit compute endowment constraint," line 1172); the maintained scarcity assumption (lines 172–182); Kreps–Scheinkman cited at line 63.

**The gap.** The paper's maintained regime is that capacity binds. But its price-competition results (Prop 4, the Lerner conditions of Section 7.2, the segment-level markup claims at line 389) are derived in unconstrained Bertrand. Price competition *under binding capacity constraints* is the Edgeworth problem: pure-strategy price equilibria generically fail to exist, which is precisely why Kreps–Scheinkman (which the paper cites in its literature review) study capacity-then-price competition and get Cournot outcomes. The paper never states as an assumption that its Bertrand analysis applies only in the slack-capacity regime, nor reconciles the Prop 4 comparative statics with the binding-capacity regime where its main story lives. The two conduct models (Cournot when capacity binds, Bertrand for the markup dynamics) are used in different sections without a stated rule for when each applies.

**Why it matters.** Empirical prediction 2 (markup compression on rival releases) is asserted for periods when "inference demand exceeds capacity" — i.e., exactly the regime where the Bertrand analysis behind it is on shakiest ground.

### M3. The "aggregate versus within-segment concentration" implication (line 381) is labeled a direct consequence of Proposition 1 but is not one, and its comparison is ill-defined

**Location:** Paragraph at line 381; the classification sentence at line 379 ("the first two are direct consequences of Proposition 1").

**The gap.** The claim: "aggregate concentration is weakly lower than a one-quality model calibrated to the same aggregate value schedules would predict." No definition of "calibrated to the same aggregate value schedules" is given, and under the natural calibration the claim is vacuous: if the one-quality model is given each laboratory's indirect value function G_ℓ(x) ≡ max over splits of Σ_k G_{ℓk}(x_{ℓk}), it reproduces *exactly* the same equilibrium allocation and concentration — equality always, never "lower." For the claim to have content, the one-quality comparison model must be constructed some other way (e.g., collapsing task-level quality to a weighted average), and then the direction needs a proof, which is not supplied. As stated, a "direct consequence of Proposition 1" is either vacuous or unproven.

**Why it matters.** This paragraph carries the subsection's main "testable form" (within-use-case concentration exceeds aggregate concentration). The testable form itself is fine for fully segment-monopolized markets, but the general claim it is hung on does not follow from the proposition it cites.

### M4. v̂_ℓ ≤ v_ℓ asserted "in general" without proof

**Location:** Line 428: "Because additional oligopoly output reduces the price earned on the laboratory's inframarginal units, v̂_ℓ ≤ v_ℓ in general."

**The gap.** v̂_ℓ ≡ ∂π*_ℓ/∂x_ℓ is an *equilibrium* derivative: extra compute for lab ℓ changes rivals' equilibrium outputs and prices. The cannibalization argument given covers only the own-output effect; the strategic effect (rivals contract when ℓ expands, raising ℓ's price) works in the *opposite* direction and can in principle dominate under strong strategic substitutability. The inequality is plausibly true in the linear workhorse but "in general" is a claim about arbitrary demand systems, offered with a one-line intuition. This inequality is then used qualitatively throughout (labs "bid less aggressively," line 450; the welfare misallocation argument, line 535).

### M5. r* ≃ max{c, v̂_F}: a single-block auction intuition applied to divisible capacity with downward-sloping value schedules

**Location:** Lines 434–441; reused at line 890 (empirical prediction 4) and line 925 (Appendix A outside option).

**The gap.** With divisible capacity and strictly decreasing v̂ schedules, every active laboratory is both an inframarginal winner and a marginal loser: the clearing price is the *common marginal* value at the equilibrium allocation (as in Section 6's own r*), not "the best losing laboratory's" value, and "the best losing laboratory" is not well-defined when all labs are partially served. The formula implicitly assumes capacity is allocated as one indivisible block to a single winner — a special case that contradicts the coexistence outcomes the paper emphasizes. The footnote at line 434 flags that this r* is a different object from Section 6's, but not that the determination rule stated for it only makes sense in the winner-take-all corner. The decomposition v̂_L − c = (v̂_L − v̂_F) + (v̂_F − c) inherits the problem: at an interior allocation v̂_L = v̂_F = r* and the "differential rent" term at the margin is zero, so the decomposition is really about inframarginal rents, which the marginal notation obscures.

### M6. The frictions s_{imk} are introduced in the utility function and then never enter any formal object

**Location:** Introduced at line 361–363; invoked to "absorb the third mechanism" (line 363), to protect niches (line 379), to explain persistent multi-homing (line 383), and to protect the Proposition 3 configuration (line 834).

**The gap.** After the utility specification, s_{imk} never appears again in any equation: the reduced-form G_{ℓk} of line 365 is not derived from the friction-augmented utility, no aggregation result maps the distribution of s over purchasers into properties of v_{ℓk}, and nothing establishes that frictions can generate v_{ℓk}(0) > r* for a niche holder (as opposed to merely shifting demand levels). Every substantive claim attributed to frictions — niche protection, non-consolidation of routing, the entire equilibrium plausibility of Proposition 3's configuration — therefore rests on a parameter that does formal work nowhere. A model in which s is purchaser-specific also raises an aggregation question (segment demand depends on the joint distribution of θ_ik and s_imk) that the concavity assumption on G_{ℓk} quietly resolves by fiat.

### M7. The paper's stated justification for the multiplicative specification is inconsistent with two of its three long-run regimes

**Location:** Lines 281–289 (the additive-vs-multiplicative argument); Sections 10.1–10.2 (lines 664–712).

**The gap.** The argument for modeling persistent advantage multiplicatively is that "a fixed additive increment becomes asymptotically negligible relative to an exponentially advancing frontier" (abstract, line 36; formalized at line 287 via A_t → ∞). That argument requires the frontier to grow without bound. In the common-asymptote and firm-specific-asymptote regimes of Section 10 — two of the paper's three candidate futures — q is bounded and A_t does *not* diverge, so a fixed additive increment does not vanish and the stated reason for preferring the multiplicative form evaporates. In the common-asymptote regime the multiplicative advantage η_ℓ is *also* asymptotically irrelevant (the paper says so at line 678), so within that regime the two specifications the paper contrasts behave identically. The multiplicative choice may still be defensible (scale-invariance, log-normal shocks), but the defense the paper actually gives is only valid under the continuing-improvement regime, and this is nowhere acknowledged.

---

## Tier 3 — Moderate: unstated assumptions and unhandled cases in supporting analysis

### Mo1. Unit demand per purchaser is load-bearing and undisclosed

**Location:** Line 104 (each purchaser chooses one model), line 197 ("Because each purchaser buys one output, y_m = D_m"); nowhere in Section 13 (Limitations).

Every microfounded demand object in the paper (Lemma 1, the free-entry demand parameters of Prop 5(4), the complete-dominance price at line 522) assumes each purchaser buys exactly one standardized output of one model. Real inference demand is overwhelmingly intensive-margin (how much a given purchaser buys) and multi-model even within a purchaser (which the paper's own subscription appendix models, inconsistently with the baseline). Downward-sloping demand here comes entirely from heterogeneity in θ across single-unit buyers. The limitation is never stated; a referee will note that the elasticities and concavity properties driving Props 2, 4, 5, 6 could look quite different with intensive-margin demand (e.g., constant-elasticity individual demands).

### Mo2. Lemma 1(2) is a fixed-quantity partial derivative doing equilibrium work

**Location:** Lemma statement line 209 ("holding output quantities fixed"); the chain at lines 296–299 (η_L↑ ⇒ q_L↑ ⇒ v_L↑ ⇒ "persistent advantage in the market for scarce compute").

The lemma establishes ∂v_m/∂q_m > 0 *holding all quantities fixed*. The economic conclusion drawn — a more productive lab receives more compute in equilibrium — is a statement about the reallocation after all quantities and the clearing price adjust. Under the separable-concave structure of Section 6 the conclusion does follow (an upward shift of one lab's v schedule raises its equilibrium x), but that argument is never made; the text moves directly from the fixed-quantity derivative to the equilibrium claim. Also note the lemma's condition (served mass < N/2) is specific to the uniform distribution; the paper takes the inequality "as a maintained assumption more generally" (disclosed), but does not note that even in its own microfounded system the inequality *reverses* for the follower when served mass exceeds N/2 — i.e., the maintained assumption is not merely unverified elsewhere, it is violated inside the workhorse in the slack-capacity region that Sections 7.1 and 10 also analyze.

### Mo3. Empirical prediction 3's ordering requires an unstated assumption about a_m

**Location:** Line 888 ("subscription share ≫ usage share ≫ compute share"); Appendix C.

Appendix C shows subscription, usage, and compute shares are conceptually distinct, but derives no ordering. Usage share (outputs) and compute share (FLOPs) differ only through relative a_m: a trailing lab's usage share exceeds its compute share iff its FLOPs-per-output are below the usage-weighted average. That is an assumption about trailing labs running cheaper models — plausible, but nowhere stated, and the prediction is presented as following from the appendix ("(Appendix app:subscriptions)"). Similarly "subscription share ≫ usage share" requires trailing-lab subscribers to route most traffic elsewhere, which holds in the mechanism but is a property of an example, not a derived inequality.

### Mo4. The free-entry propositions ignore the training/inference capacity split the paper itself imposes

**Location:** Prop 5 flow profit (line 793) uses full K; Section 9 defines inference capacity K_t^I = K_t − Σ_ℓ g_{ℓt} (line 621); entry cost F prices training FLOPs at c + λ (line 767).

In Section 9, training and inference compete for the same K, and the paper is proud of pricing training compute at c + λ. But in Section 11 the entrant pays F = (c+λ)·Γ(q) for training compute *and* the incumbents' flow profits are computed with the entire K available for inference. The entry episode both consumes capacity (raising λ and hence F, and lowering K^I and hence π) and is priced as if it did not. For n* this is second-order if training runs are small relative to K, but the paper elsewhere argues training demand is large enough to matter (line 603: "training demand can outpace the construction of new capacity"), and no consistency condition is stated.

### Mo5. Proposition 5's regime consistency and its use of Λ are both looser than the statement suggests

**Location:** Lines 792–806.

(a) The proposition assumes "capacity binds at the resulting number of entrants," but binding is n-dependent (Appendix D threshold, line 1066), and no check is offered that the n* produced by the binding formula is itself in the binding region — for some parameters the binding formula yields an n* at which capacity would be slack and vice versa, leaving neither expression self-consistent. (b) The displacement hazard Λ is applied as a pure additional discount on a *symmetric* flow profit π(n). But displacement means someone else takes the displaced lab's profits: with n symmetric labs facing hazard Λ each, the market does not become an (n−1)-lab market for the survivors' profits, and the displaced lab's continuation value is not zero (Section 9 makes exactly this point about the leadership formula, line 637). The same criticism the paper levels at its own V_lead approximation applies, unacknowledged, to the entry condition built on it.

### Mo6. The wholesale contract space is silently restricted to linear per-FLOP prices

**Location:** Price decomposition (boxed, line 420); κ_ℓ = b_ℓ + a_ℓ·r_ℓ (line 404); Appendix A.

The three-component decomposition identifies "hyperscaler scarcity rent" with a_ℓ(r_ℓ − c), which presumes compute is sold at a linear price r_ℓ. With two-part or committed-capacity contracts — the realistic case, and the natural outcome of the Nash bargaining the paper itself invokes in Appendix A, since efficient bilateral contracts set marginal price at opportunity cost and move rents through the fixed fee — the marginal r_ℓ no longer measures the hyperscaler's rent, and the decomposition's middle term is not identified from prices. The paper notes for *vertical integration* that transfer prices need not reveal shadow values (line 875) but never notes the same problem for arms-length nonlinear contracts.

### Mo7. In the model race, the common frontier A_t advances exogenously while releases are the only modeled innovation

**Location:** Lines 611–617: conditional on a release, log q^new = A_{t+1} + α_ℓ + ν.

The candidate quality of a release is centered on A_{t+1}, an exogenous process: the frontier advances whether or not anyone invests, and no lab's release moves A_t. This is inconsistent with the quality-ladder framing (Section 2 invokes Grossman–Helpman/Aghion–Howitt, where innovation *is* the frontier's advance) and has substantive consequences: it removes the channel by which a slowdown in investment slows the frontier, which matters directly for the Section 10 regime comparison and for the claim that follower investment responds to V_lead. The assumption is never flagged.

### Mo8. The hyperscaler investment condition assumes price-taking in λ, and indexes the scarcity rent by h

**Location:** Lines 597–601.

The Euler condition C_h'(H) = E[Σ β^s λ_{h,t+s} ∂K/∂H] treats the future scarcity rent as unaffected by hyperscaler h's own investment. For the actual industry — three to five hyperscalers, each large relative to K — a hyperscaler internalizes that adding capacity depresses λ, and underinvests relative to this condition; Besanko–Doraszelski (cited at line 69 for exactly this point) is about strategic capacity investment. Also, λ is indexed λ_{h,t+s} even though FLOPs are homogeneous and there is a single clearing rent per period in the model; nothing in the model generates hyperscaler-specific λ until the heterogeneous-supplier extension of Section 15, so the notation implies a heterogeneity the model doesn't contain.

### Mo9. Welfare subsection: the misallocation direction is asserted, not derived

**Location:** Line 535: "compute is drawn toward laboratories with smaller markups relative to the surplus-maximizing allocation."

The wedge argument (v̂_ℓ understates social marginal value by lab-specific amounts) is right in spirit, but the mapping from "smaller markup" to "smaller wedge" to "over-allocated compute" is not established: the social marginal value of a lab's output includes marginal consumer surplus, which also varies across labs with demand curvature, and no proposition or example verifies the direction. The sentence reads as a result but is a conjecture; unlike similar statements elsewhere (e.g., line 385's "we flag this as plausible rather than proven"), it carries no such flag.

---

## Tier 4 — Minor: notation collisions and local inconsistencies

### N1. β does triple duty
- β^s: hyperscaler discount factor (line 601);
- β: scaling-law curvature exponent (lines 668, 696, 723, 774–776);
- β_{ℓ,k}: task-level comparative advantage (line 309).
The discount-factor and curvature uses are two sections apart; the curvature and comparative-advantage uses are *both live in the segmentation discussion*. None of the three is flagged, unlike the F and r* collisions which are.

### N2. r does triple duty
- r: wholesale compute price (Section 7 onward, r_ℓ, r*);
- r: discount rate (line 633, V_lead; lines 790–806, Prop 5 and 6, where "(r+Λ)·F" sits in the same expressions as formulas derived from wholesale-price Cournot profits);
- r: resource index in Appendix E (a_m^r, λ_r, c_r).
In Proposition 5 the discount-rate r appears in the same formula as B and K derived from a game in which r meant the compute price. A footnote-level fix, but a referee will trip on it.

### N3. A does double duty
A_t is the log frontier level (line 265); A is the demand intercept (Prop 2, line 462; Prop 5(4) sets A = θ̄·Q). Both are used in main-text propositions.

### N4. The subscription appendix drops task-specific valuations the main text relies on
Appendix C's routing value is V_imk = θ_i·Q_mk − ρ_m (line 985): a single θ_i per purchaser, whereas Section 6.1 (line 361) introduced θ_{ik} varying across use cases and the multi-homing discussion at line 383 leans on the segmentation structure. The appendix mechanism thus generates multi-homing only through Q_mk variation, not through the valuation heterogeneity the main text cites it for; the two primitives should match, or the difference be noted.

### N5. G collision is flagged too late
G_ℓ(x) is gross operating value (line 316); G_{ℓt} is cumulative training compute (line 656). The clash is acknowledged only in Section 11.1 (line 765) when Γ is introduced, but the two uses coexist unflagged from Section 10 onward (e.g., ψ_ℓ·G at line 668 versus G_ℓ' at line 318).

### N6. λ appears as capacity shadow price (line 228), per-hyperscaler rent λ_{h,t+s} (line 601), per-resource shadow price λ_r (line 1109), and period multiplier λ_t (line 647) — internally consistent in intent but the h-indexed use is unexplained (see Mo8).

---

## Completeness check on the paper's two self-assessments

The task asked specifically whether Section 13 (Limitations) and Section 11.4 (What is derived and what is conjectured) are complete. They are good by the standards of the genre, but each omits items surfaced above:

**Section 13 (Limitations) omits:**
1. Unit demand / no intensive margin (Mo1) — arguably as consequential as the listed items, since it shapes every elasticity in the paper.
2. The conduct-regime patchwork: Cournot when capacity binds, Bertrand for markup dynamics, competitive upstream in the propositions vs. bargaining in the appendix (M1, M2) — nowhere is there a statement of which conduct model applies when.
3. Linear wholesale pricing / no nonlinear compute contracts (Mo6).
4. Perfect observability of quality by purchasers (only obliquely touched via the Nelson citation in the literature review and the evaluation cost E_ij in Appendix C).
5. Exogenous common frontier in the race model (Mo7).

**Section 11.4 (honesty subsection) omits:**
1. That every "derived" entry-count expression is conditional on price-taking upstream conduct that Appendix A argues against (M1).
2. That the segmentation entry result is derived under a configuration that is not an equilibrium and is inconsistent with the quality-parity assumption (C4) — the subsection says the segmentation result "is derived," full stop.
3. The regime-consistency check for n* (Mo5a) and the symmetric-Λ shortcut (Mo5b).

---

## Summary count

| Severity | Count | Items |
|---|---|---|
| Critical (undermines a numbered/boxed proposition) | 4 | C1–C4 |
| Major | 7 | M1–M7 |
| Moderate | 9 | Mo1–Mo9 |
| Minor / notation | 6 | N1–N6 |

**Most damaging single issue:** C1 — Proposition 4's claim about v̂_L − v̂_F is not proven; the proof game contains no compute, the appendix admits it, and the bridging paragraph (line 1172) is not a valid argument. Because Proposition 4 is the paper's "headline dynamic prediction" and feeds Sections 10, 6.1, and two of the four empirical predictions, this is the first place a hostile referee lands. Close behind: C3, where a single sentence asserts the opposite of what the adjacent Proposition 1 shows.
