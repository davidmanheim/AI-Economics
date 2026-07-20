# The Future Economics of LLMs

Source for *The Future Economics of LLMs: From Hyperscaler GPUs to Consumer
Usage* (David Manheim) and its interactive web companion.

- **Live site:** https://davidmanheim.com/AI-Economics/
- **Paper (PDF):** [`paper.pdf`](paper.pdf)

The paper models the LLM inference market as two economically distinct
layers — model laboratories and hyperscalers — and works out how scarce GPU
capacity gets allocated, how the resulting rents split between labs and
hardware owners, when a frontier leader can (and can't) take the whole
market, and how model releases, GPU investment, and long-run technological
regimes change that picture over time.

This is a working draft, not a final version — see the watermark.

The model, paper, and web application were codeveloped with Anthropic's
Fable 5 and Sonnet 5.

## What's in here

- **`paper.tex`, `paper.bib`** — the current LaTeX
  source and bibliography. Compiles with `latexmk -pdf` (requires a
  standard TeX distribution; the preamble uses `microtype`, `draftwatermark`,
  `natbib`, and a few other common packages).
- **`notebook/`** — a companion Jupyter notebook working through the model
  numerically.
- **`web/`** — the interactive companion site: a Vite + React + TypeScript
  single-page app. Each numbered section (S1–S9) pairs the paper's narrative
  with a small interactive chart driven by the same closed-form math as the
  paper, implemented independently in `web/src/model/`.
- **`web-demo-implementation-plan.md`** — the phase-by-phase plan the web app
  was built from.

## Running the web app

```bash
cd web
npm install
npm run dev      # local dev server
npm run build     # static build to web/dist
npx vitest run    # test suite for web/src/model
```

## Extending this

Everything here — the model, the derivations, the chart code — is meant to
be picked apart and built on. If you want to extend the economic model, add
a new interactive section, or just poke at the assumptions, cloning this
repo and handing it to whichever LLM you like to work with should be enough
context to get started: the paper states its assumptions explicitly, and the
web app's `src/model/` directory is pure, dependency-free TypeScript mirroring
the paper's equations directly, with a test suite alongside it.

## License

This repository — the paper text, the LaTeX source, the notebook, and the
web application code — is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See
[`LICENSE`](LICENSE).
