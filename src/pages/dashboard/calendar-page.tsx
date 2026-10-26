import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flame, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCalendarMonth } from '@/hooks/use-calendar'
import { useDashboard } from '@/hooks/use-dashboard'
import { cn } from '@/lib/utils'
import { hapticTap } from '@/utils/haptics'
import { todayStr } from '@/utils/date'
import type { CalendarDayStatus } from '@/types/models'

const STATUS_RING: Record<CalendarDayStatus, string> = {
  gym_completed: 'from-emerald-400 to-teal-500',
  rest_day: 'from-amber-300 to-amber-500',
  no_workout: '',
  weight_logged: 'from-violet-400 to-purple-500',
  challenge_completed: 'from-fuchsia-400 to-purple-600',
  personal_record: 'from-amber-300 to-yellow-500',
}

const STATUS_LABEL: Record<CalendarDayStatus, string> = {
  gym_completed: 'Workout',
  rest_day: 'Rest day',
  no_workout: 'No activity',
  weight_logged: 'Weight logged',
  challenge_completed: 'Challenge completed',
  personal_record: 'Personal record',
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const { data: summaries, isLoading } = useCalendarMonth(year, month)
  const { data: dashboard } = useDashboard()
  const gymStreak = dashboard?.currentStreaks.find((s) => s.category === 'gym')?.current_streak ?? 0

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const goPrevMonth = () => {
    hapticTap()
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const goNextMonth = () => {
    hapticTap()
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  const monthLabel = firstDayOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const activeDaysThisMonth = summaries ? Object.values(summaries).filter((s) => s.activityCount > 0).length : 0
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const goToday = () => {
    hapticTap()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) goNextMonth()
    else if (info.offset.x > 60) goPrevMonth()
  }

  return (
    <div className="space-y-6">
      {gymStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl gradient-primary p-4 text-white shadow-lg"
        >
          <Flame className="size-6" />
          <div>
            <p className="font-bold text-lg leading-none">{gymStreak} day streak</p>
            <p className="text-xs text-white/80 mt-0.5">Keep showing up to grow it</p>
          </div>
        </motion.div>
      )}

      <Card weight="flat">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <LegendItem colorClass="from-emerald-400 to-teal-500" label="Workout" />
          <LegendItem colorClass="from-amber-300 to-amber-500" label="Rest day" />
          <LegendItem colorClass="from-violet-400 to-purple-500" label="Weight logged" />
          <LegendItem colorClass="from-fuchsia-400 to-purple-600" label="Challenge completed" />
          <LegendItem colorClass="from-amber-300 to-yellow-500" label="Personal record" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={goPrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="min-w-[9rem] text-center sm:text-left">{monthLabel}</CardTitle>
            <Button variant="outline" size="icon-sm" onClick={goNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="ghost" size="sm" onClick={goToday} className="hidden sm:flex">
                <CalendarDays className="size-3.5" /> Today
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd} className="cursor-grab active:cursor-grabbing">
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const summary = summaries?.[dateStr]
                // String comparisons against today's LOCAL date — the old
                // checks (now.toISOString().slice(0,10) / new Date(dateStr) >
                // now) were UTC-based, which marked the wrong day as "today"
                // or "future" outside UTC.
                const isToday = dateStr === todayStr()
                const isFuture = dateStr > todayStr()

                // For the streak "chain" visual: whether the previous/next
                // calendar cell is also a completed gym day, so we can draw
                // a connecting bar between consecutive days.
                const prevDay = day > 1 ? cells[i - 1] : null
                const nextDay = cells[i + 1]
                const prevDateStr = prevDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}` : null
                const nextDateStr = nextDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}` : null
                const isGymDay = summary?.primaryStatus === 'gym_completed'
                const chainToPrev = isGymDay && prevDateStr && summaries?.[prevDateStr]?.primaryStatus === 'gym_completed'
                const chainToNext = isGymDay && nextDateStr && summaries?.[nextDateStr]?.primaryStatus === 'gym_completed'

                return (
                  <motion.button
                    key={dateStr}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      hapticTap()
                      navigate(`/calendar/${dateStr}`)
                    }}
                    title={summary ? STATUS_LABEL[summary.primaryStatus] : undefined}
                    className={cn(
                      'relative aspect-square rounded-xl flex items-center justify-center transition-all bg-muted/40 hover:bg-muted',
                      isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      isFuture && 'opacity-40',
                      isLoading && 'opacity-50'
                    )}
                  >
                    {/* Streak chain connectors */}
                    {chainToPrev && <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-1.5 w-3 bg-gradient-to-r from-orange-400 to-amber-500 z-0" />}
                    {chainToNext && <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-1.5 w-3 bg-gradient-to-r from-amber-500 to-orange-400 z-0" />}
                    {summary && summary.primaryStatus !== 'no_workout' && !isFuture && (
                      <div className={cn('absolute inset-0 rounded-xl bg-gradient-to-br opacity-90 z-[1]', STATUS_RING[summary.primaryStatus])} />
                    )}
                    <span className={cn('relative z-10 text-sm font-semibold', summary?.primaryStatus !== 'no_workout' && !isFuture && 'text-white')}>{day}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-4">{activeDaysThisMonth} active days this month</p>
        </CardContent>
      </Card>
    </div>
  )
}

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('inline-block size-3 rounded-full bg-gradient-to-br', colorClass)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
