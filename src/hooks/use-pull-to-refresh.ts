import { useEffect, useRef, useState } from 'react'

/**
 * Lightweight touch-based pull-to-refresh for mobile. Attaches to a
 * scrollable container ref; when the user pulls down past a threshold at
 * scrollTop === 0, it calls onRefresh and shows a small spinner via the
 * returned `pulling`/`refreshing` state.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown> | void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const threshold = 70

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4) {
        startY.current = null
        return
      }
      startY.current = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && window.scrollY <= 0) {
        setPullDistance(Math.min(delta * 0.5, 100))
      }
    }
    const onTouchEnd = async () => {
      if (startY.current === null) return
      startY.current = null
      if (pullDistance > threshold) {
        setRefreshing(true)
        setPullDistance(threshold)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullDistance, refreshing, onRefresh])

  return { containerRef, pullDistance, refreshing }
}
