import { motion } from 'framer-motion'
import { Flame, Trophy, Footprints, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { DashboardSummary } from '@/types/models'
import { todayStr } from '@/utils/date'
import { dailyQuote } from '@/utils/quotes'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { cn } from '@/lib/utils'

/**
 * Picks a warm, human headline based on what's actually happening today —
 * no arbitrary "level up" framing, just genuine encouragement tied to real
 * signals (streaks, today's activity, points earned).
 */
function pickHeadline(summary: DashboardSummary): string {
  const gymStreak = summary.currentStreaks.find((s) => s.category === 'gym')?.current_streak ?? 0
  const stepsStreak = summary.currentStreaks.find((s) => s.category === 'steps')?.current_streak ?? 0
  const activeToday = summary.weekActivity.find((d) => d.date === todayStr())?.active ?? false

  if (gymStreak >= 5) return `${gymStreak} days strong — you're on fire! 🔥`
  if (gymStreak >= 2) return `${gymStreak} days in a row — keep it going!`
  if (stepsStreak >= 3) return `${stepsStreak} day step streak — nice pace!`
  if (activeToday && summary.pointsToday > 0) return "You've already shown up today 🎉"
  if (activeToday) return 'Great start today — keep the momentum!'
  return "Let's make today count 💪"
}

export function HeroHealthCard({ summary }: { summary: DashboardSummary }) {
  const weightDiff = summary.weightDifferenceKg
  const gymStreak = summary.currentStreaks.find((s) => s.category === 'gym')
  const stepsStreak = summary.currentStreaks.find((s) => s.category === 'steps')
  const today = todayStr()
  const activeDaysThisWeek = summary.weekActivity.filter((d) => d.active).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl gradient-hero p-6 sm:p-8 text-white shadow-2xl"
    >
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full gradient-primary opacity-20 blur-2xl" />
      <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full gradient-secondary opacity-20 blur-2xl" />

      <div className="relative z-10">
        <p className="text-white/60 text-sm font-medium">{summary.greeting} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{pickHeadline(summary)}</h1>
        <p className="text-white/50 text-xs mt-2 italic">“{dailyQuote()}”</p>

        {(summary.currentWeightKg !== null || summary.goalWeightKg !== null) && (
          <div className="flex items-center gap-4 mt-5 text-white/70 text-xs">
            <span>
              Weight <span className="text-white font-semibold">{summary.currentWeightKg?.toFixed(1) ?? '—'} kg</span>
            </span>
            {summary.goalWeightKg !== null && (
              <span>
                Goal <span className="text-white font-semibold">{summary.goalWeightKg.toFixed(1)} kg</span>
              </span>
            )}
            {weightDiff !== null && (
              <span className="text-emerald-300 font-semibold">{Math.abs(weightDiff).toFixed(1)} kg to go</span>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          {/* Points use the app's "fire" accent (amber); streaks use the
              same primary/accent colors as everywhere else in the app
              (gym = primary/emerald, steps = accent/cyan) instead of each
              pill inventing its own one-off color. */}
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/20 px-3 py-1.5">
            <Trophy className="size-4 text-amber-400" />
            <span className="text-sm font-semibold">
              <AnimatedCounter value={summary.pointsToday} /> pts today
            </span>
          </div>
          {gymStreak && gymStreak.current_streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 px-3 py-1.5">
              <Flame className="size-4 text-emerald-400" />
              <span className="text-sm font-semibold">{gymStreak.current_streak} day gym streak</span>
            </div>
          )}
          {stepsStreak && stepsStreak.current_streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-400/20 px-3 py-1.5">
              <Footprints className="size-4 text-sky-400" />
              <span className="text-sm font-semibold">{stepsStreak.current_streak} day step streak</span>
            </div>
          )}
        </div>

        {/* Weekly consistency strip — "did I show up" visual, Mon-Sun */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-white/60 text-xs font-medium">This week</p>
            <p className="text-white/60 text-xs font-medium">{activeDaysThisWeek}/7 active days</p>
          </div>
          <div className="flex items-center gap-2">
            {summary.weekActivity.map((d, i) => {
              const isToday = d.date === today
              const isFuture = d.date > today
              return (
                <motion.div
                  key={d.date}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      'flex h-9 w-full items-center justify-center rounded-xl border transition-all',
                      d.active
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300/40 shadow-md'
                        : isFuture
                          ? 'border-white/10 bg-white/5'
                          : 'border-white/15 bg-white/10',
                      isToday && !d.active && 'ring-2 ring-white/50'
                    )}
                  >
                    {d.active && <Check className="size-4 text-white" strokeWidth={3} />}
                  </div>
                  <span className={cn('text-[10px]', isToday ? 'text-white font-semibold' : 'text-white/50')}>
                    {format(parseISO(d.date), 'EEEEE')}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
