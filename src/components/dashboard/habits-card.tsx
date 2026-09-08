import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ListChecks, PartyPopper } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
import { useCheckInHabit, useUncheckHabit } from '@/hooks/use-habits'
import { celebrateBig } from '@/utils/confetti'
import type { HabitProgress } from '@/types/models'

// Rotating palette so habit tiles feel lively even before a user picks a
// custom color — cycles deterministically by position.
const HABIT_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-cyan-400 to-teal-600',
  'from-fuchsia-400 to-purple-600',
]

/**
 * Dashboard widget: check off today's habits. Habits themselves are
 * created/edited/deleted in Settings, not here — this card is purely for
 * daily check-ins.
 */
export function HabitsCard({ habitsToday }: { habitsToday: HabitProgress[] }) {
  const navigate = useNavigate()
  const checkIn = useCheckInHabit()
  const uncheck = useUncheckHabit()
  const allDone = habitsToday.length > 0 && habitsToday.every((h) => h.completed)
  // Tracks whether we've already fired the celebration for *this specific*
  // all-done moment. Initialized from the current state (not `false`) so
  // reopening the app after habits were already completed earlier does
  // NOT replay the confetti — it only fires the instant the last habit is
  // actually checked off during this session.
  const wasAllDone = useRef(allDone)
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      // Skip the transition check on the very first render — allDone here
      // reflects whatever was already true/false on load, not a fresh
      // completion.
      hasMounted.current = true
      wasAllDone.current = allDone
      return
    }
    if (allDone && !wasAllDone.current) {
      celebrateBig()
    }
    wasAllDone.current = allDone
  }, [allDone])

  return (
    <Card className={cn('relative overflow-hidden transition-colors', allDone && 'ring-1 ring-emerald-400/40')}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {allDone ? <PartyPopper className="size-4 text-emerald-500" /> : <ListChecks className="size-4" />} My Habits
        </CardTitle>
        {habitsToday.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Plus className="size-4" /> Manage
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-1.5"
          >
            <PartyPopper className="size-4" /> All habits done for today!
          </motion.p>
        )}
        {habitsToday.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No habits yet"
            description="Add your own habits in Settings, then check them off here each day."
            actionLabel="Go to Settings"
            onAction={() => navigate('/settings')}
          />
        ) : (
          habitsToday.map((hp, i) => (
            <motion.div
              key={hp.habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted transition-colors"
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-lg shadow-md bg-gradient-to-br',
                  HABIT_GRADIENTS[i % HABIT_GRADIENTS.length]
                )}
              >
                {hp.habit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', hp.completed && 'text-success')}>{hp.habit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hp.checkedCount}/{hp.habit.target_count} today
                  {hp.habit.points ? ` · +${hp.habit.points} pts` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {hp.checkedCount > 0 && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => uncheck.mutate(hp.habit.id)}
                    disabled={uncheck.isPending}
                    title="Remove one check"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                )}
                <AnimatedCheckbox
                  checked={hp.completed}
                  onToggle={() => checkIn.mutate(hp.habit)}
                  disabled={checkIn.isPending || hp.checkedCount >= hp.habit.target_count}
                  gradient={HABIT_GRADIENTS[i % HABIT_GRADIENTS.length].replace('from-', 'bg-gradient-to-br from-')}
                  size={30}
                />
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
