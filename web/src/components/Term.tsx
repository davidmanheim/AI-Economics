import { type ReactNode, useState } from 'react'
import { glossary, type GlossaryTerm } from './glossary'

export function Term({ term, children }: { term: GlossaryTerm; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <span className="term-wrap"><button className="term" onClick={() => setOpen(!open)} aria-expanded={open}>{children}</button>{open && <span className="term-popover" role="tooltip">{glossary[term]}</span>}</span>
}
