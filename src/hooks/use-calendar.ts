import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { gamificationService } from '@/services/gamification.service'
import { nutritionService } from '@/services/nutrition.service'
import { habitsService } from '@/services/habits.service'
import type { CalendarDaySummary, CalendarDayStatus } from '@/types/models'

export function useCalendarMonth(year: number, month: number) {
  const { user } = useAuthStore()
  const userId = user?.id

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return useQuery<Record<string, CalendarDaySummary>>({
    queryKey: ['calendar-month', userId, year, month],
    enabled: !!userId,
    queryFn: async () => {
      const [sessions, weightLogs, points, prs, challenges, waterLogs, meals, checkins] = await Promise.all([
        workoutService.getSessionsInRange(userId!, startDate, endDate),
        trackingService.getWeightLogsInRange(userId!, startDate, endDate),
        gamificationService.getPointsInRange(userId!, startDate, endDate),
        gamificationService.getPersonalRecords(userId!),
        gamificationService.getChallenges(userId!),
        trackingService.getWaterLogsInRange(userId!, startDate, endDate),
        nutritionService.getMealsInRange(userId!, startDate, endDate),
        habitsService.getCheckinsInRange(userId!, startDate, endDate),
      ])

      const summaries: Record<string, CalendarDaySummary> = {}

      const ensure = (date: string) => {
        if (!summaries[date]) {
          summaries[date] = {
            date,
            statuses: [],
            primaryStatus: 'no_workout',
            pointsEarned: 0,
            hasWorkout: false,
            hasWeightLog: false,
            hasPR: false,
            hasChallengeCompleted: false,
            hasWater: false,
            hasFood: false,
            hasHabit: false,
            activityCount: 0,
          }
        }
        return summaries[date]
      }

      for (const s of sessions) {
        const summary = ensure(s.date)
        summary.hasWorkout = true
        const status: CalendarDayStatus = s.workout_types.includes('stretching') || s.workout_types.includes('mobility') || s.workout_types.includes('yoga') ? 'rest_day' : 'gym_completed'
        if (!summary.statuses.includes(status)) summary.statuses.push(status)
      }

      for (const w of weightLogs) {
        const summary = ensure(w.date)
        summary.hasWeightLog = true
        summary.statuses.push('weight_logged')
      }

      for (const p of points) {
        const summary = ensure(p.date)
        summary.pointsEarned += p.points
      }

      for (const pr of prs) {
        if (pr.achieved_date >= startDate && pr.achieved_date <= endDate) {
          const summary = ensure(pr.achieved_date)
          summary.hasPR = true
          summary.statuses.push('personal_record')
        }
      }

      for (const c of challenges) {
        if (c.is_completed && c.completed_at) {
          const date = c.completed_at.slice(0, 10)
          if (date >= startDate && date <= endDate) {
            const summary = ensure(date)
            summary.hasChallengeCompleted = true
            summary.statuses.push('challenge_completed')
          }
        }
      }

      for (const w of waterLogs) {
        ensure(w.date).hasWater = true
      }
      for (const m of meals) {
        ensure(m.date).hasFood = true
      }
      for (const c of checkins) {
        ensure(c.date).hasHabit = true
      }

      // Determine primary status by priority: PR > challenge > gym > weight > rest > no_workout
      const priority: CalendarDayStatus[] = ['personal_record', 'challenge_completed', 'gym_completed', 'weight_logged', 'rest_day', 'no_workout']
      for (const summary of Object.values(summaries)) {
        summary.primaryStatus = priority.find((p) => summary.statuses.includes(p)) ?? 'no_workout'
        summary.activityCount = [summary.hasWorkout, summary.hasWeightLog, summary.hasWater, summary.hasFood, summary.hasHabit].filter(Boolean).length
      }

      return summaries
    },
  })
}
