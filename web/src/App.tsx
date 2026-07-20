import { type ComponentType, useEffect, useState } from 'react'
import { Derivation } from './components/Derivation'
import { HeroDiagram } from './components/HeroDiagram'
import { hero, intro, sections } from './content/copy'
import { S1Allocation } from './sections/S1Allocation'
import { S2WinnerTakeMost } from './sections/S2WinnerTakeMost'
import { S3PriceAnatomy } from './sections/S3PriceAnatomy'
import { S4TrailingLabs } from './sections/S4TrailingLabs'
import { S5ReleaseRace } from './sections/S5ReleaseRace'
import { S6Regimes } from './sections/S6Regimes'
import { S7Subscriptions } from './sections/S7Subscriptions'
import { S9Colophon } from './sections/S9Colophon'
import { S8Explorer } from './sections/S8Explorer'

// Sections with a finished interactive module render their own dedicated
// component (each renders its own <section> wrapper, prose, and derivation
// drawer). Sections without one yet (S8 explorer, S9 colophon) fall through
// to the generic placeholder loop below.
const builtSections: Partial<Record<string, ComponentType>> = {
  s1: S1Allocation,
  s2: S2WinnerTakeMost,
  s3: S3PriceAnatomy,
  s4: S4TrailingLabs,
  s5: S5ReleaseRace,
  // S6/S7 swapped on display order: subscriptions now shows first (id 's6'),
  // regimes second (id 's7') — see each component's own note on this.
  s6: S7Subscriptions,
  s7: S6Regimes,
  s8: S8Explorer,
  s9: S9Colophon,
}

// Compact scroll-spy rail: one entry per built section (S1–S9), each linking to
// its DOM anchor. The number is the visible label; the full title rides along as
// a tooltip / accessible name so the terse "S4" still has context.
const NAV_ITEMS = sections.map((s) => ({ anchor: s.anchor, number: s.number, title: s.title }))
// Stable module-level array so the observer effect's dependency never changes.
const NAV_ANCHORS = NAV_ITEMS.map((item) => item.anchor)

/**
 * Track which section is currently in view via IntersectionObserver (not
 * scroll-position math — no scroll listener, no layout thrash). The rootMargin
 * collapses the observer's viewport to a thin band ~45% down the screen, so at
 * any moment the one section straddling that band reports as intersecting and
 * becomes active. Before the reader reaches S1 (hero/intro on screen) nothing
 * matches and no nav item is highlighted, which is the intended resting state.
 */
function useActiveSection(anchors: string[]): string {
  const [active, setActive] = useState('')
  useEffect(() => {
    const els = anchors
      .map((a) => document.getElementById(a))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [anchors])
  return active
}

export function App() {
  const active = useActiveSection(NAV_ANCHORS)
  return <>
    <header className="site-header">
      <a className="wordmark" href="#top">LLM economics</a>
      <nav className="section-nav" aria-label="Page navigation">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.anchor}
            href={`#${item.anchor}`}
            title={item.title}
            aria-label={`${item.number}: ${item.title}`}
            aria-current={active === item.anchor ? 'true' : undefined}
            className={active === item.anchor ? 'active' : undefined}
          >
            {item.number}
          </a>
        ))}
      </nav>
    </header>
    <main id="top">
      <section className="hero">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        <p className="lede">{hero.question}</p>
        <p className="eyebrow">{hero.answerLead}</p>
        <p className="lede">{hero.sentence}</p>
        <HeroDiagram />
      </section>

      <section className="intro">
        <h2>{intro.title}</h2>
        {intro.body}
        <Derivation id="model-setup">{intro.derivation}</Derivation>
      </section>

      {sections.map((section) => {
        const Built = builtSections[section.id]
        if (Built) return <Built key={section.id} />
        return (
          <section className="content-section" id={section.anchor} key={section.id}>
            <p className="eyebrow">{section.number}</p>
            <h2>{section.title}</h2>
            <div className="section-body">{section.body}</div>
            {section.chartNote && (
              <div className="module-placeholder">
                <p>{section.chartNote.text}</p>
                <span>{section.chartNote.phase}</span>
              </div>
            )}
            {section.derivation && <Derivation id={`${section.anchor}-derivation`}>{section.derivation}</Derivation>}
          </section>
        )
      })}
    </main>
    <footer>Interactive companion to <em>The Future Economics of LLMs</em>.</footer>
  </>
}
