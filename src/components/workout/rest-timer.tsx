import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play, RotateCcw } from 'lucide-react'
import { Ring } from '@/components/ui/ring'
import { hapticSuccess, hapticTap } from '@/utils/haptics'

/**
 * A small floating rest-timer popup — tap "Start Rest" on an exercise to
 * count down its rest_seconds, with a gentle haptic + sound-free "ding"
 * (pulse animation) when it hits zero.
 */
export function RestTimerPopup({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (paused || done) return
    if (remaining <= 0) {
      setDone(true)
      hapticSuccess()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, paused, done])

  const pct = ((seconds - remaining) / seconds) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9 }}
      className="fixed z-40 bottom-[calc(6rem+var(--safe-area-inset-bottom))] left-1/2 -translate-x-1/2 lg:bottom-8"
    >
      <div className="flex items-center gap-4 rounded-2xl bg-card border border-border shadow-2xl px-5 py-3">
        <Ring pct={pct} size={56} strokeWidth={5} colorFrom={done ? '#10b981' : '#f59e0b'} colorTo={done ? '#059669' : '#ef4444'}>
          <span className={done ? 'text-emerald-500 font-bold text-xs' : 'font-bold text-sm tabular-nums'}>
            {done ? 'GO' : `${remaining}s`}
          </span>
        </Ring>
        <div>
          <p className="text-sm font-semibold">{done ? 'Rest complete!' : 'Resting...'}</p>
          <p className="text-xs text-muted-foreground">{done ? 'Time for your next set' : 'Take a breather'}</p>
        </div>
        <div className="flex items-center gap-1">
          {!done && (
            <button
              onClick={() => {
                hapticTap()
                setPaused((p) => !p)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          )}
          <button
            onClick={() => {
              setRemaining(seconds)
              setDone(false)
              setPaused(false)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export function RestTimerHost({ activeSeconds, onClose }: { activeSeconds: number | null; onClose: () => void }) {
  return (
    <AnimatePresence>{activeSeconds !== null && <RestTimerPopup key={activeSeconds} seconds={activeSeconds} onClose={onClose} />}</AnimatePresence>
  )
}
