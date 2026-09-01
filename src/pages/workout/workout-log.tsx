import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Dumbbell, LogIn, LogOut, Hourglass, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ExerciseLogger } from '@/components/workout/exercise-logger'
import { useWorkoutLogStore } from '@/stores/workout-log.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSaveWorkoutLog, useWorkoutSessionDetail, useDeleteWorkoutSession } from '@/hooks/use-workout'
import { WORKOUT_TYPES } from '@/constants/workout'
import { cn } from '@/lib/utils'
import { formatDurationHM, todayStr } from '@/utils/date'
import type { WorkoutType } from '@/types/database.types'
import toast from 'react-hot-toast'

function toHHMM(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function computeDurationLabel(date: string, entryTime: string, exitTime: string): string | null {
  if (!entryTime || !exitTime) return null
  const entry = new Date(`${date}T${entryTime}:00`)
  let exit = new Date(`${date}T${exitTime}:00`)
  if (exitTime < entryTime) exit = new Date(exit.getTime() + 24 * 60 * 60 * 1000)
  const minutes = (exit.getTime() - entry.getTime()) / 60000
  if (minutes <= 0) return null
  return formatDurationHM(minutes)
}

export default function WorkoutLogPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user } = useAuthStore()
  const isEditing = !!sessionId

  const { date, entryTime, exitTime, workoutTypes, title, exercises, setDate, setEntryTime, setExitTime, setTitle, toggleWorkoutType, reset, loadFromSession } =
    useWorkoutLogStore()

  const { data: sessionDetail, isLoading: loadingSession } = useWorkoutSessionDetail(sessionId)
  const saveWorkoutLog = useSaveWorkoutLog()
  const deleteWorkoutSession = useDeleteWorkoutSession()
  const [loaded, setLoaded] = useState(!isEditing)

  useEffect(() => {
    if (!isEditing) {
      reset()
      setLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  useEffect(() => {
    if (isEditing && sessionDetail?.session && !loaded) {
      const s = sessionDetail.session
      loadFromSession({
        date: s.date,
        entryTime: toHHMM(s.gym_entry_time),
        exitTime: toHHMM(s.gym_exit_time),
        workoutTypes: s.workout_types,
        title: s.title ?? '',
        exercises: sessionDetail.exercises.map((ex) => ({
          tempId: ex.id,
          exercise_name: ex.exercise_name,
          equipment: ex.equipment,
          weight_kg: ex.weight_kg || null,
          sets: ex.sets,
          reps: ex.reps || null,
          duration_seconds: ex.duration_seconds,
          distance_km: ex.distance_km,
          rest_seconds: ex.rest_seconds,
          rpe: ex.rpe,
          notes: ex.notes,
        })),
      })
      setLoaded(true)
    }
  }, [isEditing, sessionDetail, loaded, loadFromSession])

  const durationLabel = computeDurationLabel(date, entryTime, exitTime)

  const canSave = date && entryTime && exitTime && workoutTypes.length > 0 && !!durationLabel

  const handleSave = async () => {
    if (!user || !canSave) {
      if (!durationLabel) toast.error('Exit time must be after entry time')
      return
    }
    try {
      await saveWorkoutLog.mutateAsync({ sessionId, date, entryTime, exitTime, workoutTypes, title, exercises })
      reset()
      navigate(`/calendar/${date}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workout')
    }
  }

  if (isEditing && loadingSession && !loaded) {
    return <p className="text-sm text-muted-foreground text-center py-12">Loading workout...</p>
  }

  const handleDelete = async () => {
    if (!sessionId) return
    await deleteWorkoutSession.mutateAsync(sessionId)
    reset()
    navigate('/workout')
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-hero text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full gradient-primary opacity-20 blur-2xl" />
          <CardContent className="relative z-10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="size-5 text-white/80" />
                <h1 className="text-lg font-bold">{isEditing ? 'Edit Workout Log' : 'Log Workout'}</h1>
              </div>
              {durationLabel && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <Hourglass className="size-4" />
                  <span className="font-semibold tabular-nums">{durationLabel}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/70">Date</label>
                <Input
                  type="date"
                  max={todayStr()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 flex items-center gap-1">
                  <LogIn className="size-3" /> Entry Time
                </label>
                <Input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 flex items-center gap-1">
                  <LogOut className="size-3" /> Exit Time
                </label>
                <Input
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>What did you train?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WORKOUT_TYPES.map((wt) => {
              const selected = workoutTypes.includes(wt.type)
              return (
                <button
                  key={wt.type}
                  onClick={() => toggleWorkoutType(wt.type)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all',
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', wt.gradient)}>
                    <wt.icon className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center">{wt.label}</span>
                </button>
              )
            })}
          </div>
          <Input placeholder="Title (optional, e.g. Push Day)" value={title} onChange={(e) => setTitle(e.target.value)} />
          {workoutTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workoutTypes.map((t: WorkoutType) => (
                <Badge key={t}>{t.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExerciseLogger />

      <div className="flex gap-3">
        {isEditing && (
          <Button variant="outline" size="lg" onClick={handleDelete} disabled={deleteWorkoutSession.isPending}>
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
        <Button variant="gradient" size="lg" className="flex-1" onClick={handleSave} disabled={!canSave || saveWorkoutLog.isPending}>
          <Save className="size-4" /> {saveWorkoutLog.isPending ? 'Saving...' : isEditing ? 'Update Workout' : 'Save Workout'}
        </Button>
      </div>
    </div>
  )
}
