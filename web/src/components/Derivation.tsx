import { type ReactNode } from 'react'

export function Derivation({ id, children }: { id: string; children: ReactNode }) {
  return <details className="derivation" id={id}><summary>Show the math</summary><div>{children}</div></details>
}
