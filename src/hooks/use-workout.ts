import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { updateStreak, awardDailyPoints } from '@/services/scoring.engine'
import { gamificationService } from '@/services/gamification.service'
import { todayStr } from '@/utils/date'
import type { WorkoutType, StrengthExercise, CardioSession } from '@/types/database.types'
import toast from 'react-hot-toast'

export function useWorkoutHistory(limit = 20) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['workout-history', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const end = todayStr()
      const start = '2000-01-01'
      const sessions = await workoutService.getSessionsInRange(user!.id, start, end)
      return sessions.slice().reverse().slice(0, limit)
    },
  })
}

export function useStartWorkout() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ types, title }: { types: WorkoutType[]; title?: string }) => {
      if (!user) throw new Error('Not authenticated')
      return workoutService.startSession(user.id, types, title)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
    },
  })
}

export function useEndWorkout() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const session = await workoutService.endSession(sessionId)

      if (user) {
        const date = session.date
        const hour = session.gym_entry_time ? new Date(session.gym_entry_time).getHours() : null
        await updateStreak(user.id, 'gym', date)
        await awardDailyPoints(user.id, date, {
          gymCompleted: true,
          steps: 0,
          waterMl: 0,
          waterGoalMl: 3000,
          mealsLogged: 0,
          sleepHours: null,
          sleepGoalHours: 8,
          weightLogged: false,
          stretchingDone: false,
          moodLogged: false,
          photoLogged: false,
          workoutMinutes: session.duration_minutes ?? undefined,
          workoutStartHour: hour,
        })
      }

      return session
    },
    onSuccess: () => {
      toast.success('Workout completed! 💪')
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
    },
  })
}

export function useAddStrengthExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<StrengthExercise, 'id' | 'created_at' | 'updated_at' | 'volume_kg'>) =>
      workoutService.addStrengthExercise(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['strength-exercises', variables.session_id] })
      checkStrengthPR(variables)
    },
  })
}

async function checkStrengthPR(ex: Omit<StrengthExercise, 'id' | 'created_at' | 'updated_at' | 'volume_kg'>) {
  try {
    const best = await gamificationService.getBestPersonalRecord(ex.user_id, 'highest_weight')
    if (!best || ex.weight_kg > best.value) {
      await gamificationService.recordPersonalRecord({
        user_id: ex.user_id,
        category: 'highest_weight',
        value: ex.weight_kg,
        unit: 'kg',
        context: ex.exercise_name,
        achieved_date: todayStr(),
        meta: {},
      })
      toast.success(`🏆 New PR! ${ex.exercise_name}: ${ex.weight_kg}kg`)
    }
  } catch {
    // Non-critical, ignore
  }
}

export function useAddCardioSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CardioSession, 'id' | 'created_at' | 'updated_at'>) => workoutService.addCardioSession(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cardio-sessions', variables.session_id] })
    },
  })
}

export function useExerciseHistory(exerciseName: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['exercise-history', user?.id, exerciseName],
    enabled: !!user && !!exerciseName,
    queryFn: () => workoutService.getStrengthHistoryForExercise(user!.id, exerciseName),
  })
}

export function useWorkoutTemplates() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['workout-templates', user?.id],
    enabled: !!user,
    queryFn: () => workoutService.getTemplates(user!.id),
  })
}
