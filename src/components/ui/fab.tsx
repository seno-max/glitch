import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/utils/haptics'

/**
 * A floating action button anchored bottom-right, used for quick one-tap
 * logging entry points (e.g. "Add Exercise" on the workout log page).
 * Sits above the mobile bottom nav via the safe-area aware offset.
 */
export function FAB({
  icon: Icon,
  onClick,
  label,
  className,
}: {
  icon: LucideIcon
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        hapticTap()
        onClick()
      }}
      className={cn(
        'fixed z-30 flex items-center gap-2 rounded-full gradient-primary text-white shadow-lg shadow-emerald-500/30 px-5 h-14',
        'bottom-[calc(5.5rem+var(--safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6',
        className
      )}
    >
      <Icon className="size-5" />
      {label && <span className="text-sm font-semibold pr-0.5">{label}</span>}
    </motion.button>
  )
}
