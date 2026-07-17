import katex from 'katex'

interface KatexProps { math: string; display?: boolean }

export function Katex({ math, display = false }: KatexProps) {
  const html = katex.renderToString(math, { displayMode: display, throwOnError: false })
  return <span className={display ? 'math-display' : 'math-inline'} dangerouslySetInnerHTML={{ __html: html }} />
}
