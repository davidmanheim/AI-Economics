// S9 — Colophon (plan §4.9). The real closing section: the disclaimer and the
// verbatim central narrative sentence (both live in copy.tsx's `s9` entry, echoed
// per design constraint §7.7), plus three things this component owns —
//   1. working downloads for the paper PDF and the Jupyter notebook (both now in
//      web/public/, so root-relative links resolve),
//   2. a note on fixtures.json as the model's numerical test oracle, and
//   3. an index of every derivation drawer on the page, with jump links.
//
// The derivation anchors below were read off S1–S7 and the intro: most drawers
// use the `${anchor}-derivation` id, but S6/S7 use bare `regimes` / `subscriptions`
// and the intro uses `model-setup`. Kept in one list so the index stays in sync.
//
// New prose routes technical terms through <Term> (glossary); descriptions are
// otherwise plain-language to keep the index readable.

import { Term } from '../components/Term'
import { sections } from '../content/copy'
import type { ReactNode } from 'react'

const s9 = sections.find((s) => s.id === 's9')!

interface DerivationEntry {
  id: string
  title: string
  desc: ReactNode
}

// One entry per <Derivation> drawer on the page, in reading order.
const DERIVATIONS: DerivationEntry[] = [
  {
    id: 'model-setup',
    title: 'The model in one page',
    desc: 'The starting setup — how a buyer values quality, and how value-per-chip is defined.',
  },
  {
    id: 'allocation-derivation',
    title: 'S1 · How scarce GPUs are allocated',
    desc: 'The constrained-optimization argument behind the water-filling rule and the scarcity premium λ.',
  },
  {
    id: 'winner-take-most-derivation',
    title: 'S2 · When one model wins everything',
    desc: 'The exact condition for one model to take the whole market — and why a few competitors make that harder.',
  },
  {
    id: 'price-anatomy-derivation',
    title: 'S3 · What a price is made of',
    desc: (
      <>
        How a price splits into physical cost, a scarcity premium, and a competitive{' '}
        <Term term="markup">markup</Term>, with the worked symmetric example and the negotiated split.
      </>
    ),
  },
  {
    id: 'trailing-labs-derivation',
    title: 'S4 · Life behind the frontier',
    desc: 'When a laboratory behind the frontier is still right to keep operating at a loss.',
  },
  {
    id: 'release-race-derivation',
    title: 'S5 · What a lead is worth',
    desc: 'A temporary lead valued as a stream of profit that can end at any moment — and the three assumptions inside that formula.',
  },
  {
    id: 'regimes',
    title: 'S6 · Three technological futures',
    desc: 'The three long-run laws for how quality grows with training, and when a leader’s edge and pricing power survive.',
  },
  {
    id: 'subscriptions',
    title: 'S7 · Why users subscribe to several providers',
    desc: 'Why a user adds another provider, and when a provider can rationally price each use below its own cost.',
  },
]

const S9_CSS = `
.colophon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px; margin: 24px 0 8px; }
.colophon-card { display: flex; flex-direction: column; gap: 6px; padding: 18px 20px;
  border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.colophon-card .kicker { font-size: .72rem; font-weight: 750; text-transform: uppercase;
  letter-spacing: .05em; color: var(--muted); }
.colophon-card a.resource { font-size: 1.05rem; font-weight: 800; letter-spacing: -.01em;
  color: var(--accent); text-decoration: none; }
.colophon-card a.resource:hover { text-decoration: underline; }
.colophon-card p { margin: 0; font-size: .88rem; color: var(--muted); line-height: 1.5; }
.colophon-card a.resource-inline { color: var(--accent); font-weight: 700; text-decoration: underline; }
.oracle-note { margin: 18px 0 8px; padding: 14px 18px; border-left: 3px solid var(--accent);
  background: var(--accent-pale); border-radius: 0 8px 8px 0; }
.oracle-note p { margin: 0; max-width: 680px; line-height: 1.6; font-size: .95rem; }
.oracle-note code { font-size: .86em; background: var(--surface); padding: 1px 5px; border-radius: 4px; }
.deriv-index { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.deriv-index li { padding: 12px 0; border-bottom: 1px solid var(--line); }
.deriv-index li:first-child { border-top: 1px solid var(--line); }
.deriv-index a.jump { font-weight: 700; color: var(--ink); text-decoration: none; }
.deriv-index a.jump:hover { color: var(--accent); text-decoration: underline; }
.deriv-index .deriv-desc { margin: 3px 0 0; font-size: .9rem; color: var(--muted); line-height: 1.5; }
`

export function S9Colophon() {
  return (
    <section className="content-section" id={s9.anchor}>
      <style>{S9_CSS}</style>
      <p className="eyebrow">{s9.number}</p>
      <h2>{s9.title}</h2>
      <div className="section-body">{s9.body}</div>

      {/* Downloads — both artifacts live in web/public/. Prefixed with BASE_URL rather
          than a bare root-absolute path, since this site is deployed under a sub-path
          (see vite.config.ts's `base`), not at its host's domain root. */}
      <div className="colophon-grid">
        <div className="colophon-card">
          <span className="kicker">Read</span>
          <a className="resource" href={`${import.meta.env.BASE_URL}paper.pdf`} target="_blank" rel="noopener noreferrer">
            The paper (PDF) ↗
          </a>
          <p>
            <em>The Future Economics of LLMs: From Hyperscaler GPUs to Consumer Usage.</em> The full
            argument, with every general result this page makes concrete.
          </p>
        </div>
        <div className="colophon-card">
          <span className="kicker">Run</span>
          <a
            className="resource"
            href={`${import.meta.env.BASE_URL}notebook/llm-econ-model.html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            The notebook (view in browser) ↗
          </a>
          <p>
            A self-contained Python notebook (numpy + matplotlib) that produces the paper&rsquo;s
            figures and re-implements every formula on this page. Readable right here, and yours to
            extend: download{' '}
            <a
              className="resource-inline"
              href={`${import.meta.env.BASE_URL}notebook/llm-econ-model.ipynb`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              the .ipynb
            </a>{' '}
            to run it yourself.
          </p>
        </div>
      </div>

      {/* fixtures.json — the numerical test oracle. */}
      <div className="oracle-note">
        <p>
          Every equation lives exactly once, in the site&rsquo;s pure model core, and is checked
          against the notebook. The notebook&rsquo;s final cells write{' '}
          <code>fixtures.json</code> — a table of computed values at known parameters — and the test
          suite asserts the site&rsquo;s TypeScript reproduces each one to within{' '}
          <code>1&times;10⁻⁹</code>. If the two implementations ever disagree, the build fails. That
          file is the single source of numerical truth behind every chart here.
        </p>
      </div>

      {/* Index of every derivation drawer, with jump links. */}
      <h3 style={{ margin: '28px 0 4px', fontSize: '1.05rem' }}>Index of derivations</h3>
      <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--muted)', maxWidth: 680 }}>
        Each section folds its math away in a &ldquo;Show the math&rdquo; drawer. Jump straight to any
        of them:
      </p>
      <ul className="deriv-index">
        {DERIVATIONS.map((d) => (
          <li key={d.id}>
            <a className="jump" href={`#${d.id}`}>
              {d.title} →
            </a>
            <p className="deriv-desc">{d.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
