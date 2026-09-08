import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Footprints, Dumbbell, Moon, X } from 'lucide-react'
import { useState } from 'react'
import type { DailyProgress } from '@/types/models'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/utils/haptics'

interface Suggestion {
  id: string
  icon: typeof Droplets
  text: string
  gradient: string
  path: string
}

/**
 * Small, dismissible nudges based on what's still missing today — not
 * nagging notifications, just gentle one-line prompts under Quick Actions.
 * Purely derived from today's already-fetched progress data, no extra
 * network calls.
 */
export function SmartSuggestions({ progress, hasLoggedSleep }: { progress: DailyProgress; hasLoggedSleep?: boolean }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState<string[]>([])

  const suggestions: Suggestion[] = []
  const hour = new Date().getHours()

  if (progress.waterCurrentMl < progress.waterGoalMl * 0.5 && hour >= 12) {
    suggestions.push({
      id: 'water',
      icon: Droplets,
      text: "You're behind on water today — top up?",
      gradient: 'gradient-accent',
      path: '/tracking/water',
    })
  }
  if (!progress.workoutDone && hour >= 17) {
    suggestions.push({
      id: 'workout',
      icon: Dumbbell,
      text: 'No workout logged yet — squeeze one in?',
      gradient: 'gradient-primary',
      path: '/workout/log',
    })
  }
  if (progress.stepsCurrent < progress.stepsGoal * 0.4 && hour >= 15) {
    suggestions.push({
      id: 'steps',
      icon: Footprints,
      text: `${(progress.stepsGoal - progress.stepsCurrent).toLocaleString()} steps left to hit your goal`,
      gradient: 'gradient-secondary',
      path: '/tracking/steps',
    })
  }
  if (hasLoggedSleep === false && hour >= 9) {
    suggestions.push({
      id: 'sleep',
      icon: Moon,
      text: "Didn't log last night's sleep yet",
      gradient: 'gradient-fire',
      path: '/tracking/sleep',
    })
  }

  const visible = suggestions.filter((s) => !dismissed.includes(s.id)).slice(0, 1)
  if (visible.length === 0) return null

  return (
    <AnimatePresence mode="popLayout">
      {visible.map((s) => (
        <motion.button
          key={s.id}
          layout
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          onClick={() => {
            hapticTap()
            navigate(s.path)
          }}
          className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-primary/30 transition-colors"
        >
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', s.gradient)}>
            <s.icon className="size-4 text-white" />
          </div>
          <p className="flex-1 text-sm font-medium">{s.text}</p>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed((d) => [...d, s.id])
            }}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="size-4" />
          </span>
        </motion.button>
      ))}
    </AnimatePresence>
  )
}
