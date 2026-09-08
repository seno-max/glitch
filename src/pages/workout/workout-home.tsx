import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, BookOpen, History, PencilLine, Dumbbell, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FAB } from '@/components/ui/fab'
import { useWorkoutHistory } from '@/hooks/use-workout'
import { format, parseISO } from 'date-fns'
import { ShimmerSkeleton } from '@/components/ui/skeleton'
import { formatDurationHM } from '@/utils/date'
import { DailyHiitSuggestionCard } from '@/components/workout/daily-hiit-suggestion-card'
import { WORKOUT_TYPES } from '@/constants/workout'

const TYPE_GRADIENT = Object.fromEntries(WORKOUT_TYPES.map((t) => [t.type, t.gradient]))

export default function WorkoutHomePage() {
  const navigate = useNavigate()
  const { data: history, isLoading: historyLoading } = useWorkoutHistory(6)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/exercises')}>
            <BookOpen className="size-4" /> Library
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/templates')}>
            <ClipboardList className="size-4" /> Templates
          </Button>
        </div>
      </div>

      <DailyHiitSuggestionCard />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden gradient-primary text-white border-0 shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div>
              <p className="font-bold text-lg flex items-center gap-2">
                <PencilLine className="size-5" /> Log a gym session
              </p>
              <p className="text-sm text-white/80 mt-1 max-w-md">
                Enter your entry &amp; exit time — we'll calculate duration. Add exercises with sets, reps, weight, or timing.
              </p>
            </div>
            <Button variant="secondary" size="lg" onClick={() => navigate('/workout/log')} className="shrink-0 bg-white text-emerald-600 hover:bg-white/90">
              <Plus className="size-5" /> Log Workout
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" /> Recent Workouts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/workout/history')}>
            View all <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {historyLoading ? (
            <>
              <ShimmerSkeleton className="h-20" />
              <ShimmerSkeleton className="h-20" />
            </>
          ) : history && history.length > 0 ? (
            history.map((session, i) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/workout/log/${session.id}`)}
                className="w-full flex items-center gap-3 rounded-2xl border border-border p-3.5 hover:border-primary/30 hover:bg-muted/40 transition-all text-left"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${TYPE_GRADIENT[session.workout_types[0]] ?? 'gradient-primary'}`}>
                  <Dumbbell className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{session.title || session.workout_types.join(', ').replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-muted-foreground">{format(parseISO(session.date), 'MMM d, yyyy')}</p>
                    {session.workout_types.slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground shrink-0">{formatDurationHM(session.duration_minutes)}</span>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-3">
                <Dumbbell className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No workouts logged yet. Log your first one above!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <FAB icon={Plus} label="Log Workout" onClick={() => navigate('/workout/log')} />
    </div>
  )
}
