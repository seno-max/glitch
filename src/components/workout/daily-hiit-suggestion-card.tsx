import { useNavigate } from 'react-router-dom'
import { Flame, Shuffle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailyHiitSuggestion } from '@/hooks/use-daily-hiit-suggestion'

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * "Try these 4 HIIT cardio exercises today" suggestion card, shown on
 * weekdays (Mon-Fri) on the Workout home page. Purely a suggestion — the
 * user can always pick something else from the Exercise Library instead.
 */
export function DailyHiitSuggestionCard() {
  const navigate = useNavigate()
  const dayOfWeek = new Date().getDay() // 0 = Sun ... 6 = Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const { suggestion, isLoading, shuffle } = useDailyHiitSuggestion()

  if (!isWeekday) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden relative border-0">
        <div className="absolute inset-0 gradient-fire opacity-95" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Flame className="size-5" /> Try these 4 HIIT cardio today
            </CardTitle>
            <Badge className="bg-white/15 text-white border-white/25">{WEEKDAY_LABELS[dayOfWeek]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl bg-white/10" />
              ))}
            </div>
          ) : suggestion.length === 0 ? (
            <p className="text-white/80 text-sm">No cardio exercises found in the library yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {suggestion.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/workout/exercises/${encodeURIComponent(ex.name)}`)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors px-3 py-2.5 text-left"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-white text-sm font-medium leading-tight">{ex.name}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-white/70 text-xs">Prefer something else? Pick any exercise from the library instead.</p>

          <div className="flex gap-2">
            <Button variant="glass" size="sm" className="text-white border-white/25 bg-white/10 hover:bg-white/20" onClick={shuffle}>
              <Shuffle className="size-3.5" /> Shuffle
            </Button>
            <Button
              variant="glass"
              size="sm"
              className="text-white border-white/25 bg-white/10 hover:bg-white/20 flex-1"
              onClick={() => navigate('/workout/exercises')}
            >
              Browse Library <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
