import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, BookOpen, History, PencilLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkoutHistory } from '@/hooks/use-workout'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDurationHM } from '@/utils/date'
import { DailyHiitSuggestionCard } from '@/components/workout/daily-hiit-suggestion-card'

export default function WorkoutHomePage() {
  const navigate = useNavigate()
  const { data: history, isLoading: historyLoading } = useWorkoutHistory(5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/exercises')}>
            <BookOpen className="size-4" /> Exercise Library
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/workout/templates')}>
            <ClipboardList className="size-4" /> Templates
          </Button>
        </div>
      </div>

      <DailyHiitSuggestionCard />

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <PencilLine className="size-4 text-primary" /> Log a gym session
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your entry &amp; exit time and we'll calculate the duration. Add exercises with sets, reps, weight, or timing.
            </p>
          </div>
          <Button variant="gradient" size="lg" onClick={() => navigate('/workout/log')} className="shrink-0">
            <Plus className="size-5" /> Log Workout
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" /> Recent Workouts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/workout/history')}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {historyLoading ? (
            <>
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </>
          ) : history && history.length > 0 ? (
            history.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/workout/log/${session.id}`)}
                className="w-full flex items-center justify-between rounded-xl bg-muted/40 p-3 hover:bg-muted transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{session.title || session.workout_types.join(', ').replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{format(parseISO(session.date), 'MMM d, yyyy')}</p>
                    {session.workout_types.slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">{formatDurationHM(session.duration_minutes)}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No workouts logged yet. Log your first one above!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
