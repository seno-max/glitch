import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Timer, Square, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StrengthLogger } from '@/components/workout/strength-logger'
import { CardioLogger } from '@/components/workout/cardio-logger'
import { useActiveWorkoutStore } from '@/stores/active-workout.store'
import { useAuthStore } from '@/stores/auth.store'
import { useEndWorkout } from '@/hooks/use-workout'
import { workoutService } from '@/services/workout.service'
import toast from 'react-hot-toast'

function useElapsedTime(startIso: string | null) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startIso) return
    const start = new Date(startIso).getTime()
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [startIso])
  return elapsed
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export default function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isActive, sessionId, gymEntryTime, workoutTypes, draftStrength, draftCardio, reset } = useActiveWorkoutStore()
  const elapsed = useElapsedTime(gymEntryTime)
  const endWorkout = useEndWorkout()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isActive || !sessionId) {
      navigate('/workout', { replace: true })
    }
  }, [isActive, sessionId, navigate])

  const showStrength = workoutTypes.includes('strength')
  const showCardio = workoutTypes.some((t) => t === 'machine_cardio' || t === 'outdoor_cardio')

  const handleFinish = async () => {
    if (!sessionId || !user) return
    setIsSaving(true)
    try {
      // Persist all draft strength exercises
      for (let i = 0; i < draftStrength.length; i++) {
        const ex = draftStrength[i]
        await workoutService.addStrengthExercise({
          session_id: sessionId,
          user_id: user.id,
          exercise_id: null,
          exercise_name: ex.exercise_name,
          equipment: ex.equipment ?? 'barbell',
          weight_kg: ex.weight_kg ?? 0,
          sets: ex.sets ?? 1,
          reps: ex.reps ?? 1,
          rest_seconds: ex.rest_seconds ?? null,
          rpe: ex.rpe ?? null,
          notes: ex.notes ?? null,
          order_index: i,
          performed_at: new Date().toISOString(),
        })
      }

      // Persist all draft cardio sessions
      for (let i = 0; i < draftCardio.length; i++) {
        const c = draftCardio[i]
        await workoutService.addCardioSession({
          session_id: sessionId,
          user_id: user.id,
          mode: c.mode ?? 'machine',
          machine_type: c.machine_type ?? null,
          outdoor_type: c.outdoor_type ?? null,
          duration_minutes: c.duration_minutes ?? 0,
          distance_km: c.distance_km ?? null,
          avg_speed_kmh: c.avg_speed_kmh ?? null,
          max_speed_kmh: c.max_speed_kmh ?? null,
          avg_pace_min_km: c.distance_km && c.duration_minutes ? c.duration_minutes / c.distance_km : null,
          resistance_level: c.resistance_level ?? null,
          incline: c.incline ?? null,
          calories_burned: c.calories_burned ?? null,
          avg_heart_rate: c.avg_heart_rate ?? null,
          max_heart_rate: c.max_heart_rate ?? null,
          rpm: c.rpm ?? null,
          steps: c.steps ?? null,
          floors_climbed: c.floors_climbed ?? null,
          route_data: null,
          notes: c.notes ?? null,
          order_index: i,
          performed_at: new Date().toISOString(),
        })
      }

      await endWorkout.mutateAsync(sessionId)
      reset()
      navigate('/workout')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workout')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isActive) return null

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-hero text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full gradient-primary opacity-20 blur-2xl" />
          <CardContent className="relative z-10 flex items-center justify-between p-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Timer className="size-4 text-white/60" />
                <span className="text-white/60 text-sm">Workout in progress</span>
              </div>
              <p className="text-4xl font-bold tabular-nums">{formatDuration(elapsed)}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {workoutTypes.map((t) => (
                  <Badge key={t} className="bg-white/10 text-white border-white/20">
                    {t.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Dumbbell className="size-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showStrength && <StrengthLogger />}
      {showCardio && <CardioLogger />}

      <Button variant="destructive" size="lg" className="w-full" onClick={handleFinish} disabled={isSaving}>
        <Square className="size-4" /> {isSaving ? 'Saving...' : 'Finish Workout'}
      </Button>
    </div>
  )
}
