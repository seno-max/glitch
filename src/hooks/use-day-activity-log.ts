import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { nutritionService } from '@/services/nutrition.service'
import { habitsService } from '@/services/habits.service'
import type { DayActivityLog } from '@/types/models'

export function useDayActivityLog(date: string) {
  const { user } = useAuthStore()
  const userId = user?.id

  return useQuery<DayActivityLog>({
    queryKey: ['day-activity-log', userId, date],
    enabled: !!userId && !!date,
    queryFn: async () => {
      const [sessions, meals, waterLogs, weightLog, sleepLog, moodLog, stepLog, checkins, habits, routine] = await Promise.all([
        workoutService.getSessionsByDate(userId!, date),
        nutritionService.getMealsByDate(userId!, date),
        trackingService.getWaterLogsByDate(userId!, date),
        trackingService.getWeightLogByDate(userId!, date),
        trackingService.getSleepLogByDate(userId!, date),
        trackingService.getMoodLogByDate(userId!, date),
        trackingService.getStepLogByDate(userId!, date),
        habitsService.getCheckinsForDate(userId!, date),
        habitsService.getHabits(userId!, false),
        trackingService.getDailyRoutine(userId!, date),
      ])

      const workoutSessions = await Promise.all(
        sessions.map(async (session) => {
          const strengthExercises = await workoutService.getStrengthExercisesBySession(session.id)
          return { ...session, strengthExercises }
        })
      )

      const habitById = new Map(habits.map((h) => [h.id, h]))
      const habitCheckins = checkins.map((c) => ({ ...c, habit: habitById.get(c.habit_id) ?? null }))

      return {
        date,
        workoutSessions,
        meals,
        waterLogs,
        weightLog,
        sleepLog,
        moodLog,
        stepLog,
        habitCheckins,
        wakeUpTime: routine?.wake_up_time ?? null,
        sleepTime: routine?.sleep_time ?? null,
        notes: routine?.notes ?? null,
      }
    },
  })
}
