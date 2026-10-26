import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, UtensilsCrossed, Droplets, Scale, Moon, Smile, Footprints, Clock, StickyNote, CheckCircle2, Trash2, Snowflake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { useDayActivityLog } from '@/hooks/use-day-activity-log'
import { useDeleteWaterLog, useSaveDailyNote, useRestDayLogs, useToggleRestDay } from '@/hooks/use-tracking'
import { useDeleteMeal } from '@/hooks/use-nutrition'
import { useSingleFlight, useKeyedSingleFlight } from '@/hooks/use-single-flight'
import { formatDisplayDate, formatDurationHM, isWithinEditWindow, todayStr } from '@/utils/date'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const MOOD_EMOJI: Record<string, string> = {
  excellent: '😀',
  good: '🙂',
  average: '😐',
  bad: '😞',
  very_bad: '😫',
}

function formatExerciseSummary(ex: {
  distance_km: number | null
  duration_seconds: number | null
  duration_unit?: 'sec' | 'min' | null
  sets: number
  reps: number
  weight_kg: number
}): string {
  const unit = ex.duration_unit ?? 'sec'
  const durationLabel = ex.duration_seconds
    ? unit === 'min'
      ? `${ex.duration_seconds}min`
      : `${ex.duration_seconds}s`
    : null

  if (ex.distance_km) {
    return `${ex.distance_km}km${durationLabel ? ` · ${durationLabel}` : ''}`
  }
  if (durationLabel && !ex.sets) {
    return durationLabel
  }
  if (ex.duration_seconds) {
    return `${durationLabel} × ${ex.sets} sets`
  }
  return `${ex.weight_kg ? `${ex.weight_kg}kg × ` : ''}${ex.sets}×${ex.reps}`
}

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useDayActivityLog(date!)
  const deleteWater = useDeleteWaterLog()
  const deleteMeal = useDeleteMeal()
  const saveNote = useSaveDailyNote()
  const { data: restDays } = useRestDayLogs()
  const toggleRestDay = useToggleRestDay()
  const [noteDraft, setNoteDraft] = useState('')
  const [editingNote, setEditingNote] = useState(false)

  useEffect(() => {
    if (data) setNoteDraft(data.notes ?? '')
  }, [data])

  const isFrozen = (restDays ?? []).some((r) => r.date === date)

  const [handleToggleRestDay, togglingRestDay] = useSingleFlight(async () => {
    await toggleRestDay.mutateAsync({ date: date!, freeze: !isFrozen })
  })
  const [handleDeleteMeal, isDeletingMeal] = useKeyedSingleFlight(async (id: string) => {
    await deleteMeal.mutateAsync(id)
  })
  const [handleDeleteWater, isDeletingWater] = useKeyedSingleFlight(async (id: string) => {
    await deleteWater.mutateAsync(id)
  })
  const [handleSaveNote, savingNote] = useSingleFlight(async () => {
    await saveNote.mutateAsync({ date: date!, notes: noteDraft })
    setEditingNote(false)
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  const editable = isWithinEditWindow(date!)
  const totalWater = data.waterLogs.reduce((s, w) => s + w.amount_ml, 0)
  const sectionsLogged = [
    data.workoutSessions.length > 0,
    data.meals.length > 0,
    data.waterLogs.length > 0,
    !!data.weightLog,
    data.habitCheckins.length > 0,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/calendar')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{formatDisplayDate(date!)}</h1>
          <p className="text-sm text-muted-foreground">
            {sectionsLogged > 0 ? `${sectionsLogged} area${sectionsLogged === 1 ? '' : 's'} logged` : 'Nothing logged this day'}
          </p>
        </div>
      </div>

      {/* Rest day freeze — lets the user mark an unwell/skipped day so the
          gym streak bridges over it instead of breaking. */}
      {date! <= todayStr() && (
        <Card className={cn(isFrozen && 'border-sky-400/40 bg-sky-500/5')}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', isFrozen ? 'bg-sky-500/15' : 'bg-muted')}>
                <Snowflake className={cn('size-4', isFrozen ? 'text-sky-400' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="text-sm font-semibold">{isFrozen ? 'Frozen rest day' : 'Mark as rest day'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFrozen
                    ? 'Your streak bridges over this day — it won’t break while you recover.'
                    : 'Unwell or taking a recovery day? Freeze the streak so it doesn’t break.'}
                </p>
              </div>
            </div>
            <Button
              variant={isFrozen ? 'outline' : 'gradient'}
              size="sm"
              onClick={handleToggleRestDay}
              disabled={toggleRestDay.isPending || togglingRestDay}
            >
              {isFrozen ? 'Unfreeze' : 'Freeze Streak'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Routine summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChip icon={Clock} gradient="from-indigo-400 to-indigo-700" size="sm" /> Daily Routine
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <InfoBlock
            label="Slept At"
            value={data.sleepLog?.sleep_time ? format(new Date(data.sleepLog.sleep_time), 'h:mm a') : data.sleepTime ? format(new Date(data.sleepTime), 'h:mm a') : '—'}
            icon={Moon}
            onClick={editable ? () => navigate(`/tracking/sleep?date=${date}`) : undefined}
          />
          <InfoBlock
            label="Woke Up"
            value={data.sleepLog?.wake_time ? format(new Date(data.sleepLog.wake_time), 'h:mm a') : data.wakeUpTime ? format(new Date(data.wakeUpTime), 'h:mm a') : '—'}
            onClick={editable ? () => navigate(`/tracking/sleep?date=${date}`) : undefined}
          />
          <InfoBlock
            label="Hours Slept"
            value={data.sleepLog?.hours_slept ? `${data.sleepLog.hours_slept.toFixed(1)}h` : '—'}
            onClick={editable ? () => navigate(`/tracking/sleep?date=${date}`) : undefined}
          />
          <InfoBlock
            label="Steps"
            value={data.stepLog?.steps.toLocaleString() ?? '—'}
            icon={Footprints}
            onClick={editable ? () => navigate(`/tracking/steps?date=${date}`) : undefined}
          />
          <InfoBlock
            label="Mood"
            value={data.moodLog ? `${MOOD_EMOJI[data.moodLog.mood]} ${data.moodLog.mood}` : '—'}
            icon={Smile}
            onClick={editable ? () => navigate(`/tracking/mood?date=${date}`) : undefined}
          />
        </CardContent>
      </Card>

      {/* Workouts */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconChip icon={Dumbbell} gradient="from-emerald-400 to-teal-600" size="sm" /> Workouts
          </CardTitle>
          {data.workoutSessions.length > 0 && <Badge>{data.workoutSessions.length} sessions</Badge>}
        </CardHeader>
        <CardContent>
          {data.workoutSessions.length === 0 ? (
            editable ? (
              <Button variant="outline" className="w-full" onClick={() => navigate(`/workout/log?date=${date}`)}>
                <Dumbbell className="size-4" /> Log a workout for this day
              </Button>
            ) : (
              <EmptyState icon={Dumbbell} title="No workout logged" description="Nothing recorded for this day." />
            )
          ) : (
            <div className="space-y-4">
              {data.workoutSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={editable ? () => navigate(`/workout/log/${session.id}`) : undefined}
                  className={cn(
                    'w-full text-left rounded-xl border border-border p-4 transition-colors',
                    editable ? 'cursor-pointer hover:border-primary/30 hover:bg-muted/30' : 'opacity-90'
                  )}
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
                          <span>{formatExerciseSummary(ex)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {editable && (
                <Button variant="outline" className="w-full" onClick={() => navigate(`/workout/log?date=${date}`)}>
                  <Dumbbell className="size-4" /> Log another workout for this day
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habits */}
      {data.habitCheckins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChip icon={CheckCircle2} gradient="from-fuchsia-400 to-purple-600" size="sm" /> Habits
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
      <Card
        className={cn(editable && 'cursor-pointer hover:border-primary/30 transition-colors')}
        onClick={editable ? () => navigate(`/nutrition?date=${date}`) : undefined}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChip icon={UtensilsCrossed} gradient="from-orange-400 to-red-500" size="sm" /> Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.meals.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="No meals logged" description="Nothing recorded for this day." />
          ) : (
            <div className="space-y-2">
              {data.meals.map((meal) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0 group"
                >
                  <div>
                    <span className="font-medium">{meal.food_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs uppercase">{meal.meal_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meal.quantity && <span className="text-muted-foreground text-xs">{meal.quantity}</span>}
                    {editable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMeal(meal.id)
                        }}
                        disabled={isDeletingMeal(meal.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Water & Weight */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          className={cn(editable && 'cursor-pointer hover:border-primary/30 transition-colors')}
          onClick={editable ? () => navigate(`/tracking/water?date=${date}`) : undefined}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChip icon={Droplets} gradient="from-sky-400 to-blue-600" size="sm" /> Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalWater / 1000).toFixed(2)}L</p>
            <p className="text-sm text-muted-foreground mb-2">{data.waterLogs.length} logs</p>
            {data.waterLogs.length > 0 && (
              <div className="space-y-1">
                {data.waterLogs.map((w) => (
                  <div key={w.id} className="flex justify-between items-center text-xs text-muted-foreground group">
                    <span>{format(new Date(w.logged_at), 'h:mm a')}</span>
                    <div className="flex items-center gap-2">
                      <span>{w.amount_ml}ml</span>
                      {editable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteWater(w.id)
                          }}
                          disabled={isDeletingWater(w.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity disabled:opacity-50"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card
          className={cn(editable && 'cursor-pointer hover:border-primary/30 transition-colors')}
          onClick={editable ? () => navigate(`/tracking/weight?date=${date}`) : undefined}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChip icon={Scale} gradient="from-violet-400 to-purple-600" size="sm" /> Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.weightLog?.weight_kg ?? '—'} kg</p>
            {data.weightLog?.body_fat_pct && <p className="text-sm text-muted-foreground">Body Fat: {data.weightLog.body_fat_pct}%</p>}
          </CardContent>
        </Card>
      </div>

      {(data.notes || editingNote) ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="size-4" /> Reflection
            </CardTitle>
            {!editingNote && editable && (
              <Button variant="ghost" size="sm" onClick={() => setEditingNote(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="How did today go? Any wins, challenges, or thoughts..."
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingNote(false); setNoteDraft(data.notes ?? '') }}>
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={saveNote.isPending || savingNote}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
            )}
          </CardContent>
        </Card>
      ) : editable ? (
        <Button variant="outline" className="w-full" onClick={() => setEditingNote(true)}>
          <StickyNote className="size-4" /> Add a reflection for this day
        </Button>
      ) : null}
    </div>
  )
}

function InfoBlock({ label, value, icon: Icon, onClick }: { label: string; value: string; icon?: typeof Moon; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer rounded-lg -m-1 p-1 hover:bg-muted/60 transition-colors')}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function IconChip({ icon: Icon, gradient, size = 'md' }: { icon: typeof Moon; gradient: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('flex items-center justify-center rounded-lg bg-gradient-to-br shadow-sm shrink-0', gradient, size === 'sm' ? 'h-6 w-6' : 'h-8 w-8')}>
      <Icon className={cn('text-white', size === 'sm' ? 'size-3.5' : 'size-4')} />
    </div>
  )
}
