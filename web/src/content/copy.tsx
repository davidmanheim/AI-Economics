// All narrative prose for the companion, kept out of components/App.tsx per the
// plan's file-structure rationale. Prose embeds <Term> (glossary) and <Katex> (math),
// so this file is .tsx rather than .ts. Substance is drawn from the current paper
// (paper-draft-July-15.tex); firm names are always generic (Leader / Follower / Hyperscaler).

import { type ReactNode } from 'react'
import { Katex } from '../components/Katex'
import { Term } from '../components/Term'

export const hero = {
  eyebrow: 'Interactive exploration of',
  title: 'Economics for Near-future AI',
  // The motivating question — a concrete thing a reader is already wondering, not a thesis in disguise.
  question:
    "If AI users keep consuming more tokens, demand will outrun the hardware built to serve them, prices will rise, and someone will profit. If it doesn't, labs will compete on price instead. Either way, two questions follow: who collects the extra dollars, and does a single strongest model win, or just the strongest per dollar? Scarcity is a standard problem in economics, and nothing here is a novel tool — just price differentiation, demand curves, oligopoly, cost structure, and profit, applied to a new market.",
  answerLead: "tl;dr?",
  // Central narrative sentence — must appear verbatim (design constraint 7).
  sentence:
    'Scarcity matters, but competition determines who profits, and cost efficiency, relative advantages, and technological progress determines whether market leadership is temporary, persistent, or eventually commoditized.',
}

export const intro: { title: string; body: ReactNode; derivation: ReactNode } = {
  title: 'A model in one page',
  body: (
    <>
      <p>
        The market for large-language-model inference has two economically distinct layers. An{' '}
        <Term term="modelLaboratory">AI lab</Term> builds an AI system and sells its
        outputs; a <Term term="hyperscaler">hyperscaler</Term> owns the datacenters and GPUs. Of course, they can be the same firm, or effectively so — the largest hardware owners hold stakes in the labs they host, and leading labs are contracting for hardware of their own. But the question here is how the money divides between the two layers, and whether NVIDIA, OpenAI or Anthropic, or X is the biggest winner. That's because for the next several years the number of GPUs that will be produced and sold is roughly fixed, while demand for valuable AI output seems to be growing.
      </p>
      <p>
        The gap between costs to run the models and the limited supply (<Term term="scarcity">scarcity</Term>) is what microeconomics studies. AI usage consumes <Term term="compute">compute</Term>, and when it runs short, the labs need to decide what to sell. A more capable model only wins if it squeezes more value from each <Term term="flop">FLOP</Term>{' '} it burns. Previous discussions have focused on which AI company has the best model, but if the scarce thing being rationed is compute itself, the best model may not win. The model answers four questions: how should compute be allocated, how would profits be split between laboratories and hardware owners, whether one laboratory takes the whole market or trailing labs survive, and how model releases and GPU build-out change all of this over time.
      </p>
    </>
  ),
  derivation: (
    <>
      <p>
        AI users will pay some amount, <Katex math="\theta" />, for an output of
        quality <Katex math="Q" /> at a maximum price <Katex math="\theta Q - P" />. The users buy the model giving the best bang for the buck, or what an economist calls highest non-negative utility. And willingness to pay varies across purchasers, so the market sorts itself into quality tiers. We'll relax the assumption of a single global quality value for all tasks below, but for now it's enough.
      </p>
      <p>
        The key quantity is <Term term="qualityAdjustedProductivity">quality-adjusted productivity</Term>, <Katex math="q_m \equiv Q_m / a_m" /> — or value delivered per{' '}<Term term="flop">FLOP</Term>, where <Katex math="a_m" /> is the compute one standardized output requires. What counts as one "output" — a million tokens, a single task, or something else — is only a normalization: Appendix E shows the allocation doesn't depend on it.
      </p>
    </>
  ),
}

export interface Section {
  id: string
  number: string
  title: string
  anchor: string
  body: ReactNode
  derivation?: ReactNode
  chartNote?: { text: string; phase: string }
}

export const sections: Section[] = [
  {
    id: 's1',
    number: 'S1',
    title: 'How scarce GPUs are allocated',
    anchor: 'allocation',
    body: (
      <>
        <p>
          Suppose each company has a fixed amount of compute, but earns different quantity and
          quality of output from it. Firms split that compute by a simple rule: send each
          unit wherever it earns the most money right now. This gives us typical downward-sloping
          demand, since the first place they sell is the most profitable. So we can picture every
          firm's value-per-FLOP as a downward slope, and we pour in the fixed amount of compute,{' '}
          <Katex math="K" />, and the water settles at a common line.
        </p>
        <p>
          That water line is a price. It's what economists call the{' '}
          <Term term="shadowPrice">shadow price</Term> of capacity, <Katex math="\lambda" />. It's
          the going rate a unit of compute earns when there isn't enough to go around. Every company
          still in the game gets served up to the point where its value from one more{' '}
          <Term term="flop">FLOP</Term> equals <Katex math="c + \lambda" />: the physical cost plus
          the scarcity premium. Companies whose best use never clears the line get nothing. And the
          height of <Katex math="\lambda" /> is pure <Term term="scarcityRent">scarcity rent</Term>.
          It exists only because the hardware is limited, and it's the one number this whole site
          keeps coming back to.
        </p>
        <p>
          Now suppose capacity doubled overnight. The water line falls: <Katex math="\lambda" />{' '}
          drops toward zero, uses that were only priced out by scarcity get served, and the rent
          shrinks. What doesn't move is the ranking. That ranking — which company earns the most
          per FLOP — is a fact about the models, not about how much hardware exists. So capacity
          sets how high the rents are, but it doesn't reorder who gets served first. That's why
          building GPUs and picking winners are two separate questions. We get to both below.
        </p>
        <p>
          You'd guess the most capable model gets the chips first. It doesn't. It only gets them
          if its extra value per FLOP is bigger — so a cheaper model that keeps most of the quality
          on a fraction of the compute can beat a flashier one. This is the intro's point again:
          capability only matters if it raises{' '}
          <Term term="qualityAdjustedProductivity">quality-adjusted productivity</Term>, value per
          FLOP.
        </p>
      </>
    ),
    chartNote: {
      text: 'The flagship chart — each firm’s marginal-value schedule stacked against a capacity line of width K, with a draggable K slider (drop K, watch the water line rise) and a purchaser-segmentation strip beneath it — is built in a later phase. The narrative and math above are complete.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>The benchmark maximizes joint operating profit subject to the capacity constraint:</p>
        <Katex
          display
          math="\max_{\mathbf y \ge 0}\ R(\mathbf y;\mathbf Q) - \sum_m b_m y_m - c\sum_m a_m y_m \quad \text{s.t.} \quad \sum_m a_m y_m \le K."
        />
        <p>
          Let <Katex math="\lambda \ge 0" /> be the multiplier on the constraint. Every model with a
          positive allocation satisfies a first-order condition that rearranges to the boxed
          allocation rule:
        </p>
        <Katex
          display
          math="v_m \equiv \frac{MR_m - b_m}{a_m} = c + \lambda, \qquad \text{inactive: } v_m \le c + \lambda."
        />
        <p>
          When one more output can be sold without much moving the price, marginal revenue is
          roughly the price, <Katex math="MR_m \simeq P_m" />, so{' '}
          <Katex math="v_m \simeq p_m - b_m/a_m" />. That's the sense in which firms maximize dollars
          per FLOP. Strictly, what governs the allocation is marginal net revenue per constrained
          FLOP. Average revenue is only an approximation to it.
        </p>
        <p className="drawer-fine">
          Fine print: the paper states these results for a general revenue function{' '}
          <Katex math="R(\mathbf y;\mathbf Q)" />. The interactive pictures use the simplest demand
          consistent with the paper's Section 3: uniform willingness to pay and vertical
          differentiation. That's the demo's concretization of the paper's general primitive.
        </p>
      </>
    ),
  },
  {
    id: 's2',
    number: 'S2',
    title: 'Can one model win everything?',
    anchor: 'winner-take-most',
    body: (
      <>
        <p>
          Could one model take the entire market? You might think the best model wins
          everything. Turn that hunch into a mathematical condition, though, and it looks a lot
          less likely. Winner-take-all means the leader buys every unit of compute — not just most
          of it — and no one buys from anyone else. Fall short of that and the market splits:
          several labs coexist, what the model calls{' '}
          <Term term="winnerTakeMost">winner-take-most</Term>. Either outcome turns on the same
          test: whether the leader's value for the very last available unit still beats every
          follower's value for its first unit.
        </p>
        <Katex display math="v_L(K) \ge \max_{j \ne L} v_j(0)." />
        <p>
          That's a demanding test: the leader's least valuable funded use has to beat the
          runner-up's most valuable one. Whether it holds depends on curvature — how fast value
          falls off as a firm expands — and that's an empirical question the model leaves open.
          We make no claim that dominance is unlikely, only that it requires a specific condition.
          The sliders let you see exactly how it could happen.
        </p>
        <p>
          When the condition fails, several companies can profitably coexist, and the paper gives five separate
          routes there: labs can differ in how much value they get per FLOP; a lab can be strong on
          some tasks or customers and weak on others; models can differ in ways that aren't
          better-or-worse at all — language, latency, privacy, integration; labs can be on different
          compute-contract terms; or different labs can run several tiers, each serving a different slice of
          demand. Only the first, productivity differences, is simulated in the model here — the paper proves the task-and-segment route formally.
        </p>
        <p>
          The proof shows that quality can be measured task by task. Coding, enterprise agents,
          low-latency queries, a given language — each carries its own score. That means running the same
          winner-take-all test inside each segment, one at a time. The lab that wins one segment need
          not win the next. One can lead coding while another leads low-latency queries, both at
          the same clearing price for compute. Global winner-take-all then needs a single lab to win every segment at once.
          If any rival holds a segment of its own, no monopoly emerges. A single leader can still appear —
          it's just no longer guaranteed. The model gives the exact condition, one segment at a time.
        </p>
      </>
    ),
    chartNote: {
      text: 'This reuses the allocation chart with a WINNER-TAKE-ALL / COEXISTENCE banner that flips as the sliders move, plus a "find the tipping point" button that raises leader quality until the condition flips. Those interactions come in a later phase.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>
          The concentration result uses a reduced form: let <Katex math="G_\ell(x_\ell)" /> be the
          value laboratory <Katex math="\ell" /> generates from <Katex math="x_\ell" /> FLOPs, with{' '}
          <Katex math="G_\ell' > 0" /> and <Katex math="G_\ell'' < 0" /> (diminishing returns). Its
          marginal value is <Katex math="v_\ell = G_\ell'" />. Compute clears at a common wholesale
          value <Katex math="r^*" />, and the leader takes everything exactly when{' '}
          <Katex math="v_L(K) \ge \max_{j \ne L} v_j(0)" />.
        </p>
        <p>
          The concavity assumption <Katex math="G_\ell'' < 0" /> is just that, an assumption, and the
          paper says so plainly. Appendix E works out the version where a laboratory's marginal value
          depends directly on rivals' allocations. Under oligopoly, dominance gets
          harder, not easier: each firm bids its private value <Katex math="\widehat v_\ell" />, which
          sits below the benchmark <Katex math="v_\ell" />, because it holds back output to protect
          its own inframarginal prices.
        </p>
        <p>
          The paper's newest result carries this same test to task-indexed quality. Index use cases
          by <Katex math="k" /> (coding, enterprise agents, low-latency queries, a language). A
          purchaser's utility from model <Katex math="m" /> on use case <Katex math="k" /> is
        </p>
        <Katex display math="u_{imk} = \theta_{ik}\, Q_{mk} - P_{mk} - s_{imk}," />
        <p>
          where <Katex math="\theta_{ik}" /> lets the taste for quality vary by use case and{' '}
          <Katex math="s_{imk} \ge 0" /> is a per-purchaser friction: an integration cost, latency, a
          privacy cost, a switching cost, or a contract term. Write <Katex math="v_{\ell k}" /> for
          lab <Katex math="\ell" />'s marginal value per FLOP in segment <Katex math="k" />.
        </p>
        <p>
          <strong>Proposition 1 (segment-level winner-take-all).</strong> Assume each lab's value is
          separable across segments, <Katex math="\sum_k G_{\ell k}(x_{\ell k})" /> with{' '}
          <Katex math="G_{\ell k}' > 0" />, <Katex math="G_{\ell k}'' < 0" />, and compute fungible
          across segments so <Katex math="\sum_\ell \sum_k x_{\ell k} \le K" />. Let{' '}
          <Katex math="r^*" /> be the value of a FLOP that clears that market. Then segment{' '}
          <Katex math="k" /> is served by one lab <Katex math="L_k" /> alone if and only if
        </p>
        <Katex display math="v_{L_k,k}(0) > r^* \quad\text{and}\quad \max_{\ell \ne L_k} v_{\ell k}(0) \le r^*," />
        <p>
          the boxed condition restated inside a segment, with <Katex math="r^*" /> in the role of the
          leader's value for the last FLOP. The first clause isn't decoration: without it, a segment
          nobody serves at all — including <Katex math="L_k" /> — would also pass the test on rivals
          alone. The identity of <Katex math="L_k" /> can differ across <Katex math="k" />, and one lab
          takes all of <Katex math="K" /> only if it clears this test in every served segment at once.
        </p>
        <p>
          The separability assumption is a real restriction, doing two separate jobs here: across
          segments it sets aside links like shared subscriptions or a strong position in one segment
          lifting demand in another, same as before, one level down. Within a segment it also assumes
          a lab's value there doesn't depend on a rival's allocation in that same segment — which is
          exactly what breaks the moment two labs actively contest one segment (the two-model system a
          few paragraphs up is that exact case). So this proposition is scoped to segments with one
          active lab and passive or inactive rivals; two labs slugging it out over the same segment is
          the harder case the model doesn't close here. Within that scope, a purchaser whose tasks span
          segments led by different labs rationally pays several providers, the{' '}
          <Term term="multiHoming">multi-homing</Term> of the subscriptions section below. The paper
          offers two further points as plausible readings rather than theorems: that displacement
          moves in smaller steps, and that a lab's advantage is really a portfolio of segment
          positions.
        </p>
      </>
    ),
  },
  {
    id: 's3',
    number: 'S3',
    title: 'What a price is made of',
    anchor: 'price-anatomy',
    body: (
      <>
        <p>So what is a purchaser actually paying for? The model splits every price into three pieces:</p>
        <Katex
          display
          math="P_\ell = \underbrace{b_\ell + a_\ell c}_{\text{physical cost}} + \underbrace{a_\ell (r_\ell - c)}_{\text{hyperscaler scarcity rent}} + \underbrace{\mu_\ell}_{\text{lab markup}}."
        />
        <p>
          The first piece is real resource cost. The second is the{' '}
          <Term term="scarcityRent">scarcity rent</Term> the hyperscaler collects when compute is
          tight. The third is the lab's <Term term="markup">markup</Term>: the extra it can charge
          because its model isn't a perfect substitute for anyone else's. The markup exists because
          each of a handful of labs holds output back a little. Flooding the market would cut the
          price on everything a lab sells, including what it's already selling, so nobody floods the
          market.
        </p>
        <p>
          When capacity is <Term term="bindingVsSlack">binding</Term>, adding more labs leaves the
          consumer price completely unchanged. It moves money from lab markup to hyperscaler
          rent. Building more GPUs is what actually lowers the price. These are two different levers,
          and they do two different jobs:
        </p>
        <ul>
          <li>
            <strong>Add more labs</strong> (with capacity binding): total output is pinned by{' '}
            <Katex math="K" />, so the height of the price bar doesn't move; the split shifts from
            markup toward scarcity rent.
          </li>
          <li>
            <strong>Build more GPUs</strong> (past the binding threshold): the scarcity piece
            collapses to zero, but the markup piece stays. Abundant hardware alone doesn't guarantee
            low prices.
          </li>
        </ul>
        <p>
          These three pieces are not the same kind of thing. Physical cost is a real resource cost,
          and nobody objects to paying it. The
          scarcity rent is a pure transfer: with capacity fixed it destroys nothing, but nobody earns
          it by being better. It goes to whoever happens to own hardware during the shortage. Its one
          defense is dynamic: it's exactly the signal that pays for the next round of GPUs. The
          markup is different. It actually burns value. When hardware is slack, outputs that should
          have sold don't. When hardware binds, it can't cut total output, since that's pinned by{' '}
          <Katex math="K" />. So instead it distorts allocation: it pulls compute toward the labs
          with smaller markups and away from the highest-value uses. The result is the wrong models
          getting served. Total output doesn't fall.
        </p>
        <p>
          The scarcity rent goes to whoever can walk away. If labs bid against each other for
          hardware, the hyperscaler keeps the rent. If terms are negotiated instead, labs can claw
          some back — especially when only a few big labs are buying, since then they can credibly
          threaten to buy less.
        </p>
      </>
    ),
    chartNote: {
      text: 'The stacked price bar (with a quality-adjusted twin), a shares-of-surplus bar labeled SHARES not levels, a binding-vs-slack phase plot, and the two scripted presets above ("Add more labs", "Build more GPUs") become interactive in a later phase.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>
          <Term term="cournot">Cournot</Term>'s first-order condition,{' '}
          <Katex math="P_\ell + y_\ell\,\partial P_\ell/\partial y_\ell = b_\ell + a_\ell r_\ell" />,
          rearranges directly into the three-part decomposition once you define the markup{' '}
          <Katex math="\mu_\ell \equiv -y_\ell\,\partial P_\ell/\partial y_\ell" />.
        </p>
        <p>
          The symmetric example makes the neutrality exact. With <Katex math="n" /> identical labs,
          linear demand <Katex math="P = A - BY" />, and binding capacity <Katex math="aY = K" />:
        </p>
        <Katex
          display
          math="P^* = A - \frac{BK}{a}, \qquad \mu_\ell = \frac{BK}{a\,n}, \qquad \Pi^{\text{labs}} = \frac{BK^2}{a^2 n}."
        />
        <p>
          Look at <Katex math="P^*" />: there's no <Katex math="n" /> in it. More labs shrink each
          markup and push the wholesale price up, so the rent moves to the hyperscalers. But the
          consumer price doesn't budge until entry finally makes capacity slack.
        </p>
        <p>
          The rent split can also be bargained. With laboratory{' '}
          <Term term="nashBargaining">Nash bargaining</Term> weight <Katex math="\zeta" />, the
          negotiated wholesale price is <Katex math="r = \zeta\,\bar v_h + (1-\zeta)\,\widehat v_\ell" />.
          The competitive auction is the corner case where the hyperscaler's outside option
          approaches the best losing bidder's value, <Katex math="r^* \simeq \max\{c, \widehat v_F\}" />.
          That auction story is the corner. In the interior, every active lab's value equals{' '}
          <Katex math="r^*" />.
        </p>
      </>
    ),
  },
  {
    id: 's4',
    number: 'S4',
    title: 'Life behind the frontier',
    anchor: 'trailing-labs',
    body: (
      <>
        <p>
          Not every lab is at the frontier, but plenty of them keep operating anyway. That's not
          automatically irrational. The model gives three situations, ranked from ordinary to
          alarming, by how a trailing lab's price <Katex math="p_j" /> compares with its own costs
          and with what its compute would fetch on the open market, <Katex math="r^*" />.
        </p>
        <ul>
          <li>
            <strong>Below average total cost:</strong> the price covers cash costs but not the
            historical training runs and overhead. Each sale still helps pay down fixed costs. This
            is ordinary for a young firm.
          </li>
          <li>
            <strong>Cash-positive but wasting the hardware:</strong> the lab makes money on every
            sale, but less than it would make renting the same compute to the leader. Economists call
            the gap an opportunity cost. It only stings on paper if the hardware genuinely can't be
            rented out or resold.
          </li>
          <li>
            <strong>Below marginal cash cost:</strong> losing money on every single output. This is
            loss-leading, and it's only rational if staying in the game pays off later.
          </li>
        </ul>
        <p>
          One test decides whether a lab is viable at all: whether its very first unit of
          compute clears the market price. If <Katex math="v_j(0) < r^*" />, it can't profitably buy
          even one FLOP at the going rate. Then it has to specialize, lock in cheaper contracted
          compute, or leave the general-purpose market. There's one escape hatch: becoming a
          secondary subscription provider. We get to it in S6.
        </p>
        <p>
          There's an earlier question sitting under all of this. Before asking how a trailing lab
          survives, ask how many labs the market can support at all. Training a frontier model is a
          large <Term term="fixedCost">fixed cost</Term>, paid once before any revenue arrives.
          Serving one more unit of inference afterward is cheap. That combination is the textbook
          setup for a <Term term="naturalOligopoly">natural monopoly or a small natural
          oligopoly</Term>. How many labs the market can support depends on how many can expect to
          recover the cost of showing up equipped to compete. The model doesn't name a real-world number - it gives a
          condition and a threshold instead.
        </p>
        <p>
          Two results come out of it. There's a break-even count of labs the profit pool can
          carry, with a natural monopoly window: a band of training costs where the arithmetic works
          for one lab and a second one falls short. And if labs specialize into different task
          segments rather than fighting head-on for the whole market, each one only has to recover
          its fixed cost from its own segment, so the same market can support many more labs, at the
          same price purchasers paid before. This is the segment-level dominance from S2,
          now read one level up: it changes how rents split, and it changes how many labs can exist.
          The paper works the count and the segmentation result out formally, and the derivation
          states them.
        </p>
      </>
    ),
    chartNote: {
      text: 'A price-ladder diagram for a trailing firm — rungs at its own cash cost, the market value of compute, and average total cost, with its price draggable across the three regimes — arrives in a later phase.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>
          Whether to keep operating at a loss is a dynamic problem. With a strategic state{' '}
          <Katex math="s" /> (customers, data, reputation, the odds of a future frontier model) and
          value function <Katex math="V_j" />, operating at <Katex math="x > 0" /> beats shutting down
          when
        </p>
        <Katex
          display
          math="\pi_j(s,x) - \pi_j(s,0) + \delta\big[\mathbb E V_j(s' \mid x) - \mathbb E V_j(s' \mid 0)\big] \ge 0."
        />
        <p>
          If today's incremental profit is negative, operating only makes sense when the discounted
          gain in continuation value more than covers it. And the paper stresses these future
          benefits shouldn't be assumed: if serving inference does little for future model
          quality, spending the same resources on research may simply be better. The subscription
          route to survival is worked out in S6.
        </p>
        <p>
          Step back to the entry question. A lab pays the fixed training cost{' '}
          <Katex math="\mathcal F" /> only if the profits that follow cover it. Take the symmetric
          binding-capacity market of S3: with <Katex math="n" /> labs, each earns flow profit
        </p>
        <Katex display math="\pi(n) = \frac{B K^2}{a^2 n^2}." />
        <p>
          This falls like <Katex math="1/n^2" />, not <Katex math="1/n" />, because each entrant both
          splits the labs' profit pool and shrinks it, since competition pushes fixed-capacity rent
          upstream to the hyperscalers. Discount at the interest rate plus any displacement{' '}
          <Term term="hazard">hazard</Term>, <Katex math="\rho + \Lambda" /> (written{' '}
          <Katex math="\rho" /> here rather than the compute price <Katex math="r" /> it would
          otherwise collide with). Free entry then pins down the count of labs the market supports:
        </p>
        <Katex display math="n^* = \left\lfloor \frac{K}{a}\sqrt{\frac{B}{(\rho+\Lambda)\,\mathcal F}} \right\rfloor." />
        <p>
          <strong>Proposition 4 (free entry).</strong> There's a natural monopoly window where one
          lab clears the bar and a second wouldn't. Since <Katex math="\pi(1)/\pi(2) = 4" />, it's a
          fourfold band of fixed costs:
        </p>
        <Katex display math="\frac{B K^2}{4 a^2} < (\rho+\Lambda)\,\mathcal F \le \frac{B K^2}{a^2}." />
        <p>
          One twist runs against textbook intuition. In the usual free-entry story a bigger market
          supports more firms. Here that holds only while capacity is slack. While GPUs bind, total
          output is pinned at <Katex math="K/a" />, so a larger purchaser mass raises the scarcity
          value of compute, which flows to hyperscalers as wholesale price, while the Cournot markup
          that actually repays training shrinks. So <Katex math="n^*" /> can fall as demand grows:
          market growth ends up funding hyperscalers more than it funds entry.
        </p>
        <p>
          <strong>Proposition 5 (segmented entry).</strong> Split the market into{' '}
          <Katex math="S" /> segments, each with one lab as sole intended provider, all at exact
          quality parity. Quality can't be what protects a niche here: S2's condition needs a
          rival's value at zero to sit at or below the market rate, and an identical-quality rival
          clears that bar exactly. What protects the niche instead is a purchaser friction{' '}
          <Katex math="s" />. It has to be the <em>recurring</em> kind — latency, a privacy cost,
          per-task compliance overhead, paid on every purchase — not a one-time cost to evaluate or
          integrate a new provider. Work the recurring friction backward from S2's own protection
          condition, keeping the units straight (a per-output margin isn't a per-FLOP price). That
          gives a minimum size it has to clear:
        </p>
        <Katex display math="s \ge s_{\min} \equiv \frac{BK}{a}." />
        <p>
          That's exactly the segment's markup from part (1): a same-quality rival produces at the same
          cost, so the friction has to absorb the entire margin the niche pays out — nothing less will
          do. Below that threshold a same-quality rival can profitably undercut and invade; at or
          above it, each lab's flow profit becomes
        </p>
        <Katex display math="\pi^{\text{seg}}(S) = \frac{B K^2}{a^2 S}," />
        <p>
          which is <Katex math="S" /> times the head-on figure, because a segment leader prices
          against its own residual demand rather than as one of <Katex math="n" /> Cournot rivals —
          this part of the math doesn't care why rivals stay out, only that they do.
        </p>
        <p>
          But that friction test only bites against rivals who already have a quality-parity model —
          in practice, the other <Katex math="S-1" /> assigned labs, whose training cost is sunk and
          who can redeploy compute into a neighboring segment for free. A lab that hasn't trained a
          frontier model yet faces a different wall: it has to pay the full fixed cost{' '}
          <Katex math="\mathcal F" /> just to contest one segment, and for large enough{' '}
          <Katex math="\mathcal F" /> that alone keeps it out, no friction required. Fresh entrants are
          kept out by <Katex math="\mathcal F" />; the labs already in the game are kept out by
          friction alone. Free entry then supports up to
        </p>
        <Katex display math="\bar S = \left\lfloor \frac{B K^2}{a^2 (\rho+\Lambda)\,\mathcal F} \right\rfloor" />
        <p>
          labs, the square of the head-on count <Katex math="n^*" />. The purchaser-facing price{' '}
          <Katex math="A - BK/a" /> is unchanged, so segmentation only moves rent from hyperscalers
          to labs. The exact square is special to the symmetric linear case, but the direction is
          general: defensible niches raise how many labs a given profit pool can carry past the
          fixed-cost bar. That requires two things to hold: the friction actually clears{' '}
          <Katex math="s_{\min}" />, and capacity actually binds under the segmented configuration —
          which takes strictly less capacity than binding under head-on competition among the same
          labs would.
        </p>
        <p>
          Two things this result does <em>not</em> show. First, <Katex math="\bar S" /> is a ceiling
          on what the profit pool can carry, not a prediction that <Katex math="S" /> separate labs
          actually form. Nothing stops one lab from paying <Katex math="\mathcal F" /> once, holding
          the friction-free assigned slot in every segment, and collecting all <Katex math="S" />{' '}
          segments' profit itself. That configuration is just as stable and strictly more profitable
          for whichever lab gets there first, and the model has no reason built in for why acquiring a
          segment should cost anything <em>per segment</em>. Second, the protection assumes purchasers
          stick to one segment. S6 below shows a purchaser whose needs span several segments rationally
          subscribes to more than one lab. That's exactly the multi-homing that, once it happens,
          extinguishes the one-time part of a purchaser's friction and leaves only the recurring part
          still working.
          The fixed cost <Katex math="\mathcal F" /> here counts compute alone, leaving out talent,
          data, and failed runs. It also leaves open the entry-quality escalation and any cross-segment
          economies of scope.
        </p>
      </>
    ),
  },
  {
    id: 's5',
    number: 'S5',
    title: 'What happens after a new model release',
    anchor: 'release-race',
    body: (
      <>
        <p>
          Leadership in this market doesn't come with a deed — it's more like a lease. A successful
          release lifts a laboratory's value schedule and can hand it a discrete jump in compute and
          market share, at least until a rival ships a strong enough substitute. So how much is a
          lead worth? One compact formula:
        </p>
        <Katex display math="V_L^{\text{lead}} \simeq \frac{\Delta\pi_L}{\rho + \Lambda_L}." />
        <p>
          Read it plainly: profit-while-ahead, divided by the interest rate plus{' '}
          <Katex math="\Lambda" />, the odds per year that a rival catches up. Catch-up risk works
          exactly like extra impatience. A lead that could end any
          month is worth far less than the same profits guaranteed. And the structure feeds on itself:
          each leader's profits are both the prize the last release was chasing and the target the
          next one aims at.
        </p>
        <p>
          But the prize <Katex math="\Delta\pi" /> and the hazard <Katex math="\Lambda" /> are not two
          separate dials. Treating them as if they were is the biggest mistake to make with this
          formula: a fatter prize attracts more challenger spending, more challenger spending raises
          the catch-up odds, and higher catch-up odds shrink what the prize is worth. So the formula
          is a snapshot of where that feedback settles, not two dials you can turn
          independently.
        </p>
      </>
    ),
    chartNote: {
      text: 'A seeded release-race timeline — quality steps, compute-share areas, and a rent-split strip showing labs gaining after breakthroughs and hyperscalers during catch-up — plus a leadership-value calculator whose Δπ is derived from the current market state, arrive in a later phase.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>
          Over a short interval the leader collects <Katex math="\Delta\pi_L\,dt" /> and keeps the
          lead with probability <Katex math="1 - \Lambda_L\,dt" />, so{' '}
          <Katex math="V = \Delta\pi\,dt + (1 - \rho\,dt)(1 - \Lambda\,dt)V" />. Drop the second-order
          term and you get the boxed perpetuity. Three assumptions hide inside it: the flow premium{' '}
          <Katex math="\Delta\pi_L" /> is constant, the hazard <Katex math="\Lambda_L" /> is constant
          (displacement is a Poisson event), and losing the lead is for good. That last one is the
          strongest. It ignores the option to regain the lead, so it overstates the cost of being
          displaced.
        </p>
        <p>
          Followers invest hard because a release moves them from thin margins to temporary
          leadership. They'd be replacing a rival's rents rather than cannibalizing their own, which
          is the replacement effect of Arrow. The leader invests both to advance and to raise the bar
          a follower has to clear, a preemption motive. And because the private return includes
          business-stealing, race investment can be socially excessive (duplicated effort chasing
          temporary rents) or insufficient (consumer benefits nobody captures).
        </p>
      </>
    ),
  },
  {
    id: 's6',
    number: 'S6',
    title: 'Why users subscribe to several providers',
    anchor: 'subscriptions',
    body: (
      <>
        <p>
          Why do people pay for several AI providers at once? Start with what a subscription
          is: a flat fee to get in, then cheap per use. It's the same deal a gym or a warehouse club
          offers. And if usage is cheap enough, there's no reason to be loyal. You keep a few
          subscriptions and route each task to whichever provider happens to be best at it.
        </p>
        <p>
          This is also a survival route for trailing labs. A second-tier provider doesn't need to be
          anyone's favorite overall. It just needs to be clearly better at <em>something</em> to
          justify its fee. A purchaser adds provider <Katex math="j" /> when the extra value it
          brings, added up over the tasks where it wins, covers the fee <Katex math="\phi_j" />.
        </p>
        <p>
          This splits apart three shares that get conflated all the time: the share of people who
          subscribe to you, the share of tasks that route to you, and the share of compute you
          actually burn. And they fall in that order. So a trailing provider can hold a broad
          subscriber base while drawing only a sliver of real inference traffic. That ordering is
          something you could check against usage data, and the paper says so.
        </p>
      </>
    ),
    chartNote: {
      text: 'A task-routing widget — five task types against provider subscriptions you toggle on and off, highlighting where each task routes and computing each provider’s three shares — arrives in a later phase.',
      phase: 'Interactive widget · later phase',
    },
    derivation: (
      <>
        <p>
          With the best available value for task <Katex math="k" /> from portfolio{' '}
          <Katex math="S" /> written <Katex math="B_{ik}(S)" />, the incremental value of adding
          provider <Katex math="j" /> is
        </p>
        <Katex
          display
          math="\Omega_{ij}(S) = \sum_k T_{ik}\,[\theta_i Q_{jk} - \rho_j - B_{ik}(S)]_+ - E_{ij},"
        />
        <p>
          That sums, task by task, only the amount by which <Katex math="j" /> beats the incumbent
          best (the <Katex math="[\cdot]_+" /> keeps just the wins), net of an evaluation cost{' '}
          <Katex math="E_{ij}" />. The purchaser subscribes when <Katex math="\Omega_{ij} \ge \phi_j" />.
          Pay it once, though, and it's gone: <Katex math="E_{ij}" /> is a one-time cost of adding a
          provider, not the recurring per-purchase friction S4's segment-protection result needs.
          That's exactly why multi-homing, once it clears, stops protecting anyone's niche.
        </p>
        <p>
          A provider can even set its per-use price below its own marginal cost,{' '}
          <Katex math="\rho_m < \kappa_m" />, as long as fixed subscription revenue covers the
          subsidy: <Katex math="\phi_m n_m \ge (\kappa_m - \rho_m)Y_m + C_m" />. The flat fee harvests
          value the metered price leaves on the table.
        </p>
      </>
    ),
  },
  {
    id: 's7',
    number: 'S7',
    title: 'Three possible technological futures',
    anchor: 'regimes',
    body: (
      <>
        <p>
          So where does all this end up? The model gives three long-run futures, and what separates
          them is not whether progress stops, but whether the leader–follower gap survives, and
          whether anyone can still charge above cost once it closes.
        </p>
        <ul>
          <li>
            <strong>Common ceiling:</strong> everyone approaches the same quality,{' '}
            <Katex math="q_L/q_F \to 1" />. The rents from being more productive vanish; markups can
            still hang around if competition stays weak.
          </li>
          <li>
            <strong>Firm-specific ceilings:</strong> some labs can simply reach higher,{' '}
            <Katex math="q_L/q_F \to \eta_L/\eta_F > 1" />. A durable frontier premium survives even
            when compute becomes abundant.
          </li>
          <li>
            <strong>Continuing improvement:</strong> no ceiling in sight. Shares and rents cycle
            around releases. Labs gain after breakthroughs, hyperscalers gain during catch-up.
          </li>
        </ul>
        <p>
          That last cycle is a proven result, not just a plausible story: under the paper's
          two-model demand system, a breakthrough that widens the quality gap raises the leader's
          markup and differential rent, and a follower catching up compresses them and improves the
          hyperscaler's position.
        </p>
        <p>
          The central warning here is about when models become commodities: interchangeable, priced
          at cost. Equal quality alone does <em>not</em> get you there. You need all three together:
          converging quality, enough competing model sellers, and enough hardware. Only when{' '}
          <Katex math="q_L - q_F \to 0" />, <Katex math="\mu_\ell \to 0" />, and{' '}
          <Katex math="r - c \to 0" /> hold together do{' '}
          <Term term="qualityAdjustedPrice">quality-adjusted prices</Term> approach physical cost.
          Miss any one and a wedge remains.
        </p>
      </>
    ),
    chartNote: {
      text: 'A three-tab regime explorer — quality paths and their ratio on top, a stacked price-component area and quality-adjusted price line below, with end-state summary cards per regime — arrives in a later phase.',
      phase: 'Interactive chart · later phase',
    },
    derivation: (
      <>
        <p>
          The three regimes are three laws for productivity as a function of cumulative training
          compute <Katex math="G" />:
        </p>
        <Katex
          display
          math="q_\ell(G) = \bar q - d_\ell(\psi_\ell G)^{-\beta}, \quad q_\ell(G) = \eta_\ell \bar q - d_\ell G^{-\beta}, \quad q_\ell(G) = \eta_\ell G^{\beta}."
        />
        <p>
          The first two share a ceiling; the third grows without one. In the common-ceiling case{' '}
          <Katex math="q_L/q_F \to 1" />; in the firm-specific case the ratio tends to{' '}
          <Katex math="\eta_L/\eta_F > 1" />.
        </p>
        <p>
          One caution about the markup-compression arrows: quality convergence raises own-price
          elasticity, which shrinks the markup. They aren't free-floating. In a general demand system
          they don't have to hold, because prices adjust too. The paper proves them for its two-model
          demand system, the proposition on breakthroughs and catch-up, and the demo inherits exactly
          that specification. So the arrows here are scoped to it, rather than claimed in general.
        </p>
        <p>
          And note the compute bill: closing the gap to a ceiling by a fixed proportion takes a
          multiplicative increase in training compute. So proportional gains need exponentially more
          compute. That's the "ideas getting harder to find" pattern documented by Bloom and
          coauthors.
        </p>
      </>
    ),
  },
  {
    id: 's8',
    number: 'S8',
    title: 'Explore the full model',
    anchor: 'explorer',
    body: (
      <>
        <p>
          For readers comfortable with the full machinery, this tool puts every parameter in one
          panel: market, firms, dynamics, regime. Every chart on this page renders live off the same
          shared state. Everything above is this page with training wheels.
        </p>
        <p>
          It also lets you save a configuration. Export the current parameters as JSON, or copy a
          shareable link that encodes them, so a specific scenario can be reproduced or handed to
          someone else.
        </p>
      </>
    ),
    chartNote: {
      text: 'The full parameter dashboard, preset manager, JSON export, and shareable-URL state arrive in a later phase, once the individual module charts exist.',
      phase: 'Explorer · later phase',
    },
  },
  {
    id: 's9',
    number: 'S9',
    title: 'Paper, derivations, and notebook',
    anchor: 'sources',
    body: (
      <>
        <p>
          This is an interactive companion to a draft paper on <em>The Future Economics of LLMs</em>. It uses generic
          firm names (Lab 1, Lab 2, Lab 3, Hyperscaler) and normalized units throughout,
          so readers argue about the mechanism rather than about any real company's calibration.
        </p>
        <p>
          The one-sentence version, restated: <em>{hero.sentence}</em>
        </p>
        <p>
          Where an Illustrative calibration option appears, it uses round numbers chosen for
          readability. They're illustrative, never estimated. The sources, the notebook, and an index
          of every derivation on the page are collected below.
        </p>
      </>
    ),
  },
]
