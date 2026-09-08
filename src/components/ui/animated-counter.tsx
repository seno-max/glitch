import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

/**
 * Animates numeric changes with a smooth count-up/count-down tween instead
 * of an instant jump — used for points, streaks, and other counters that
 * change after a logging action, so the update feels alive.
 */
export function AnimatedCounter({ value, className, formatter }: { value: number; className?: string; formatter?: (v: number) => string }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.6 })
  const [display, setDisplay] = useState(0)
  const rounded = useTransform(spring, (v) => Math.round(v))
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      spring.set(value)
      setDisplay(value)
      first.current = false
      return
    }
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return unsub
  }, [rounded])

  return <motion.span className={className}>{formatter ? formatter(display) : display.toLocaleString()}</motion.span>
}
