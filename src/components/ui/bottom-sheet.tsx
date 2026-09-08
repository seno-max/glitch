import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/**
 * A bottom sheet used in place of a full page/dialog for lightweight,
 * quick-logging interactions (e.g. quick-add water amount, quick habit
 * check-in details) — feels faster and more native than a centered modal.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-lg rounded-t-3xl bg-card border-t border-x border-border shadow-2xl pb-[calc(1.25rem+var(--safe-area-inset-bottom))]',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="sheet-handle" />
            {title && <h2 className="text-lg font-bold px-6 pt-2 pb-3">{title}</h2>}
            <div className="px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
