import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/utils/haptics'

/**
 * A checkbox with a satisfying "pop + checkmark draw" completion animation
 * instead of an instant toggle — used for habit/task check-ins.
 */
export function AnimatedCheckbox({
  checked,
  onToggle,
  gradient = 'gradient-primary',
  size = 28,
  disabled,
}: {
  checked: boolean
  onToggle: () => void
  gradient?: string
  size?: number
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={{ scale: 0.85 }}
      onClick={() => {
        hapticTap()
        onToggle()
      }}
      className={cn(
        'relative flex items-center justify-center rounded-full border-2 transition-colors shrink-0',
        checked ? cn(gradient, 'border-transparent') : 'border-muted-foreground/30 bg-transparent'
      )}
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Check className="text-white" strokeWidth={3} style={{ width: size * 0.6, height: size * 0.6 }} />
          </motion.span>
        )}
      </AnimatePresence>
      {checked && (
        <motion.span
          className={cn('absolute inset-0 rounded-full', gradient)}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  )
}
