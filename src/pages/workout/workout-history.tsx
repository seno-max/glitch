import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useWorkoutHistory } from '@/hooks/use-workout'
import { format, parseISO } from 'date-fns'
import { formatDurationHM } from '@/utils/date'

export default function WorkoutHistoryPage() {
  const navigate = useNavigate()
  const { data: sessions, isLoading } = useWorkoutHistory(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/workout')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-bold">Workout History</h1>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card key={session.id} className="card-hover cursor-pointer" onClick={() => navigate(`/workout/log/${session.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{session.title || 'Workout Session'}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(session.date), 'EEEE, MMM d, yyyy')}</p>
                  <div className="flex gap-1 mt-1.5">
                    {session.workout_types.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">{formatDurationHM(session.duration_minutes)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Dumbbell} title="No workouts yet" description="Your workout history will appear here." />
      )}
    </div>
  )
}
