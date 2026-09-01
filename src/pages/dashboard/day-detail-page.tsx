import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell, UtensilsCrossed, Droplets, Scale, Moon, Smile, Footprints, Clock, StickyNote, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useDayActivityLog } from '@/hooks/use-day-activity-log'
import { formatDisplayDate, formatDurationHM } from '@/utils/date'
import { format } from 'date-fns'

const MOOD_EMOJI: Record<string, string> = {
  excellent: '😀',
  good: '🙂',
  average: '😐',
  bad: '😞',
  very_bad: '😫',
}

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useDayActivityLog(date!)

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  const totalCalories = data.meals.reduce((s, m) => s + (m.calories ?? 0), 0)
  const totalWater = data.waterLogs.reduce((s, w) => s + w.amount_ml, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/calendar')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{formatDisplayDate(date!)}</h1>
          {data.habitCheckins.length > 0 && (
            <p className="text-sm text-muted-foreground">{data.habitCheckins.length} habit check-in{data.habitCheckins.length === 1 ? '' : 's'}</p>
          )}
        </div>
      </div>

      {/* Routine summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" /> Daily Routine
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoBlock label="Wake Up" value={data.wakeUpTime ? format(new Date(data.wakeUpTime), 'h:mm a') : '—'} />
          <InfoBlock label="Sleep" value={data.sleepTime ? format(new Date(data.sleepTime), 'h:mm a') : '—'} />
          <InfoBlock label="Steps" value={data.stepLog?.steps.toLocaleString() ?? '—'} icon={Footprints} />
          <InfoBlock label="Mood" value={data.moodLog ? `${MOOD_EMOJI[data.moodLog.mood]} ${data.moodLog.mood}` : '—'} icon={Smile} />
        </CardContent>
      </Card>

      {/* Workouts */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="size-4" /> Workouts
          </CardTitle>
          <Badge>{data.workoutSessions.length} sessions</Badge>
        </CardHeader>
        <CardContent>
          {data.workoutSessions.length === 0 ? (
            <EmptyState icon={Dumbbell} title="No workout logged" description="Nothing recorded for this day." />
          ) : (
            <div className="space-y-4">
              {data.workoutSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/workout/log/${session.id}`)}
                  className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{session.title || session.workout_types.join(', ')}</p>
                    <span className="text-sm text-muted-foreground">{formatDurationHM(session.duration_minutes)}</span>
                  </div>
                  {(session.gym_entry_time || session.gym_exit_time) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {session.gym_entry_time ? format(new Date(session.gym_entry_time), 'h:mm a') : '—'}
                      {' → '}
                      {session.gym_exit_time ? format(new Date(session.gym_exit_time), 'h:mm a') : '—'}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {session.workout_types.map((t) => (
                      <Badge key={t} variant="outline">
                        {t.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  {session.strengthExercises.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {session.strengthExercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between text-sm text-muted-foreground">
                          <span>{ex.exercise_name}</span>
                          <span>
                            {ex.duration_seconds
                              ? `${ex.duration_seconds}s × ${ex.sets} sets`
                              : `${ex.weight_kg ? `${ex.weight_kg}kg × ` : ''}${ex.sets}×${ex.reps}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habits */}
      {data.habitCheckins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(
              data.habitCheckins.reduce<Record<string, { name: string; icon: string; count: number }>>((acc, c) => {
                const key = c.habit_id
                if (!acc[key]) acc[key] = { name: c.habit?.name ?? 'Deleted habit', icon: c.habit?.icon ?? '⭐', count: 0 }
                acc[key].count += 1
                return acc
              }, {})
            ).map(([habitId, info]) => (
              <div key={habitId} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span className="font-medium">{info.name}</span>
                </span>
                <span className="text-muted-foreground">Checked {info.count}x</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nutrition */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-4" /> Nutrition
          </CardTitle>
          <Badge>{totalCalories} kcal</Badge>
        </CardHeader>
        <CardContent>
          {data.meals.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="No meals logged" />
          ) : (
            <div className="space-y-2">
              {data.meals.map((meal) => (
                <div key={meal.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="font-medium">{meal.food_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs uppercase">{meal.meal_type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-muted-foreground">{meal.calories ? `${meal.calories} kcal` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Water & Weight */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="size-4" /> Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalWater / 1000).toFixed(2)}L</p>
            <p className="text-sm text-muted-foreground">{data.waterLogs.length} logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4" /> Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.weightLog?.weight_kg ?? '—'} kg</p>
            {data.weightLog?.body_fat_pct && <p className="text-sm text-muted-foreground">Body Fat: {data.weightLog.body_fat_pct}%</p>}
          </CardContent>
        </Card>
      </div>

      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="size-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Moon }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
