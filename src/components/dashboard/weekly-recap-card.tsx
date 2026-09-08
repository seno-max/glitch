import { motion } from 'framer-motion'
import { Sparkles, Dumbbell, Footprints, Scale } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { PeriodProgress } from '@/types/models'
import type { Streak } from '@/types/database.types'
import { cn } from '@/lib/utils'

const MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 75, 100, 150, 200, 365]

function nextMilestoneMessage(streaks: Streak[]): string | null {
  const gym = streaks.find((s) => s.category === 'gym')
  if (gym && MILESTONES.includes(gym.current_streak)) {
    return `🎉 Milestone unlocked — ${gym.current_streak} day gym streak!`
  }
  return null
}

/**
 * A light "recap" strip summarizing this week's activity so far, plus a
 * one-off milestone celebration line when a streak hits a notable number
 * (3, 5, 7, 10, 14, 21, 30...) — engagement nudges without any arbitrary
 * "leveling" system.
 */
export function WeeklyRecapCard({ progress, streaks }: { progress: PeriodProgress; streaks: Streak[] }) {
  const milestone = nextMilestoneMessage(streaks)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn('overflow-hidden', milestone && 'ring-2 ring-amber-400/50')}>
        {milestone && (
          <div className="gradient-fire text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4" /> {milestone}
          </div>
        )}
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Week So Far</p>
          <div className="flex items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="size-3.5 text-emerald-500" /> <strong>{progress.workoutsCompleted}</strong> workouts
            </span>
            <span className="flex items-center gap-1.5">
              <Footprints className="size-3.5 text-orange-500" /> <strong>{progress.avgSteps.toLocaleString()}</strong> avg steps
            </span>
            {progress.weightChangeKg !== null && (
              <span className="flex items-center gap-1.5">
                <Scale className="size-3.5 text-violet-500" /> <strong>{progress.weightChangeKg > 0 ? '+' : ''}{progress.weightChangeKg}kg</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
