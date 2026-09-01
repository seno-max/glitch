import { motion } from 'framer-motion'
import { Flame, Zap, Trophy } from 'lucide-react'
import type { DashboardSummary } from '@/types/models'
import { Progress } from '@/components/ui/progress'
import { formatDisplayDate } from '@/utils/date'

export function HeroHealthCard({ summary }: { summary: DashboardSummary }) {
  const weightDiff = summary.weightDifferenceKg
  const gymStreak = summary.currentStreaks.find((s) => s.category === 'gym')

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
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Let's crush today's goals</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-white/50 text-xs mb-1">Current Weight</p>
            <p className="text-xl font-bold">{summary.currentWeightKg?.toFixed(1) ?? '—'} kg</p>
            {summary.lastWeightLogDate && (
              <p className="text-white/40 text-[11px] mt-0.5">Logged {formatDisplayDate(summary.lastWeightLogDate, 'MMM d')}</p>
            )}
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">Goal Weight</p>
            <p className="text-xl font-bold">{summary.goalWeightKg?.toFixed(1) ?? '—'} kg</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-1">To Go</p>
            <p className="text-xl font-bold text-gradient-primary">
              {weightDiff !== null ? `${Math.abs(weightDiff).toFixed(1)} kg` : '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
            <Zap className="size-4 text-amber-400" />
            <span className="text-sm font-semibold">Lvl {summary.level}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
            <Trophy className="size-4 text-amber-400" />
            <span className="text-sm font-semibold">{summary.pointsToday} pts today</span>
          </div>
          {gymStreak && gymStreak.current_streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Flame className="size-4 text-orange-400" />
              <span className="text-sm font-semibold">{gymStreak.current_streak} day gym streak</span>
            </div>
          )}
        </div>

        <div className="mt-4 max-w-xs">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>XP Progress</span>
            <span>{summary.xpProgressPct}%</span>
          </div>
          <Progress value={summary.xpProgressPct} max={100} trackClass="bg-white/10" />
        </div>
      </div>
    </motion.div>
  )
}
