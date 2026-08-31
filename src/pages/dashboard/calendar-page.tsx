import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCalendarMonth } from '@/hooks/use-calendar'
import { cn } from '@/lib/utils'
import type { CalendarDayStatus } from '@/types/models'

const STATUS_STYLES: Record<CalendarDayStatus, string> = {
  gym_completed: 'bg-emerald-500 text-white',
  rest_day: 'bg-amber-400 text-white',
  no_workout: 'bg-red-400/20 text-red-500 dark:text-red-400',
  weight_logged: 'bg-blue-500 text-white',
  challenge_completed: 'bg-purple-500 text-white',
  personal_record: 'bg-amber-300 text-amber-950 ring-2 ring-amber-400',
}

const LEGEND: { status: CalendarDayStatus; label: string }[] = [
  { status: 'gym_completed', label: 'Gym Completed' },
  { status: 'rest_day', label: 'Rest Day' },
  { status: 'no_workout', label: 'No Workout' },
  { status: 'weight_logged', label: 'Weight Logged' },
  { status: 'challenge_completed', label: 'Challenge Completed' },
  { status: 'personal_record', label: 'Personal Record' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const { data: summaries, isLoading } = useCalendarMonth(year, month)

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const goPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const goNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  const monthLabel = firstDayOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{monthLabel}</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={goPrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={goNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
              const isToday = dateStr === now.toISOString().slice(0, 10)
              const isFuture = new Date(dateStr) > now

              return (
                <motion.button
                  key={dateStr}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => navigate(`/calendar/${dateStr}`)}
                  className={cn(
                    'relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',
                    summary && !isFuture ? STATUS_STYLES[summary.primaryStatus] : 'bg-muted/50 hover:bg-muted',
                    isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    isLoading && 'opacity-50'
                  )}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {summary?.hasPR && <span className="text-[10px]">🏆</span>}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {LEGEND.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', STATUS_STYLES[item.status].split(' ')[0])} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
