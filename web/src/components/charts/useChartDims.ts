import { useCallback, useRef, useState } from 'react'

export interface ChartDims {
  width: number
  height: number
}

/**
 * Tracks the rendered size of a container element via ResizeObserver, so
 * chart components can stay responsive without hardcoding pixel sizes.
 *
 * Returns a CALLBACK ref (not a RefObject) on purpose: callback refs are
 * assignable to any element's `ref` prop across @types/react versions
 * without the RefObject<T | null> vs RefObject<T> nullability disputes
 * that plague object refs in strict mode. Usage is unchanged either way:
 *   const [ref, dims] = useChartDims<HTMLDivElement>()
 *   <div ref={ref} className="chart-frame">...</div>
 */
export function useChartDims<T extends Element>(
  fallback: ChartDims = { width: 480, height: 320 },
): [(node: T | null) => void, ChartDims] {
  const [dims, setDims] = useState<ChartDims>(fallback)
  const observerRef = useRef<ResizeObserver | null>(null)

  const setRef = useCallback((node: T | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setDims({ width, height })
    })
    observer.observe(node)
    observerRef.current = observer
  }, [])

  return [setRef, dims]
}
