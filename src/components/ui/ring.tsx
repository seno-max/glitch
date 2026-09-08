import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Reusable animated progress ring — the core visual language for "today"
 * metrics across Home, Water, Steps, etc. Replaces flat progress bars with
 * the Apple Fitness / Google Fit ring pattern.
 */
export function Ring({
  pct,
  size = 88,
  strokeWidth = 8,
  colorFrom,
  colorTo,
  trackClassName,
  children,
  animateFrom,
}: {
  pct: number
  size?: number
  strokeWidth?: number
  colorFrom: string
  colorTo: string
  trackClassName?: string
  children?: React.ReactNode
  /** Optional starting % for the fill animation (defaults to 0 → pct). */
  animateFrom?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, pct))
  const gradientId = `ring-${colorFrom.replace('#', '')}-${colorTo.replace('#', '')}`

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className={cn('stroke-muted', trackClassName)} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference * (1 - (animateFrom ?? 0) / 100) }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
