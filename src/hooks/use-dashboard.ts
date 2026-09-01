import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { gamificationService } from '@/services/gamification.service'
import { nutritionService } from '@/services/nutrition.service'
import { profileService } from '@/services/profile.service'
import { habitsService } from '@/services/habits.service'
import { todayStr, getGreeting, weekRange, monthRange } from '@/utils/date'
import { getLevelForXp } from '@/types/models'
import type { DashboardSummary, HabitProgress, PeriodProgress } from '@/types/models'

export function useDashboard() {
  const { user, profile } = useAuthStore()
  const userId = user?.id

  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', userId],
    enabled: !!userId,
    queryFn: async () => {
      const date = todayStr()
      const week = weekRange()
      const month = monthRange()

      const [
        sessions,
        latestWeight,
        settings,
        waterLogs,
        stepLog,
        meals,
        streaks,
        habits,
        todaysCheckins,
        weekSessions,
        monthSessions,
        weekSteps,
        monthSteps,
        weekWater,
        monthWater,
        weekWeights,
        monthWeights,
      ] = await Promise.all([
        workoutService.getSessionsByDate(userId!, date),
        trackingService.getLatestWeightLog(userId!),
        profileService.getSettings(userId!),
        trackingService.getWaterLogsByDate(userId!, date),
        trackingService.getStepLogByDate(userId!, date),
        nutritionService.getMealsByDate(userId!, date),
        gamificationService.getStreaks(userId!),
        habitsService.getHabits(userId!, true),
        habitsService.getCheckinsForDate(userId!, date),
        workoutService.getSessionsInRange(userId!, week.start, week.end),
        workoutService.getSessionsInRange(userId!, month.start, month.end),
        trackingService.getStepLogsInRange(userId!, week.start, week.end),
        trackingService.getStepLogsInRange(userId!, month.start, month.end),
        trackingService.getWaterLogsInRange(userId!, week.start, week.end),
        trackingService.getWaterLogsInRange(userId!, month.start, month.end),
        trackingService.getWeightLogsInRange(userId!, week.start, week.end),
        trackingService.getWeightLogsInRange(userId!, month.start, month.end),
      ])

      const pointsToday = await gamificationService.getPointsForDate(userId!, date)

      // Weight is logged whenever the user feels like it — "current weight"
      // is simply the most recent log on record, no daily requirement.
      const currentWeight = latestWeight?.weight_kg ?? profile?.current_weight_kg ?? null
      const goalWeight = profile?.goal_weight_kg ?? null
      const weightDifference = currentWeight !== null && goalWeight !== null ? Math.round((currentWeight - goalWeight) * 10) / 10 : null

      const xp = profile?.xp ?? 0
      const { level, progressPct, xpForNextLevel } = getLevelForXp(xp)

      const waterTotal = waterLogs.reduce((s, w) => s + w.amount_ml, 0)
      const caloriesConsumed = meals.reduce((s, m) => s + (m.calories ?? 0), 0)
      const workoutDone = sessions.some((s) => s.is_completed)

      // Build today's habit progress from the user's own custom habit list —
      // no fixed/default tasks. Each habit tracks against its own target_count.
      const checkinsByHabit = new Map<string, number>()
      for (const c of todaysCheckins) {
        checkinsByHabit.set(c.habit_id, (checkinsByHabit.get(c.habit_id) ?? 0) + 1)
      }
      const habitsToday: HabitProgress[] = habits.map((habit) => {
        const checkedCount = checkinsByHabit.get(habit.id) ?? 0
        const completed = checkedCount >= habit.target_count
        return {
          habit,
          checkedCount,
          completed,
          pointsAwardedToday: completed && !!habit.points && habit.points > 0,
        }
      })

      const buildPeriodProgress = (
        label: string,
        periodSessions: typeof sessions,
        periodSteps: typeof weekSteps,
        periodWater: typeof weekWater,
        periodWeights: typeof weekWeights
      ): PeriodProgress => {
        const totalWorkoutMinutes = periodSessions.reduce((s, w) => s + (w.duration_minutes ?? 0), 0)
        const avgSteps = periodSteps.length ? Math.round(periodSteps.reduce((s, w) => s + w.steps, 0) / periodSteps.length) : 0
        const daysWithWater = new Set(periodWater.map((w) => w.date)).size || 1
        const avgWater = Math.round(periodWater.reduce((s, w) => s + w.amount_ml, 0) / daysWithWater)
        const weightChangeKg =
          periodWeights.length >= 2 ? Math.round((periodWeights[periodWeights.length - 1].weight_kg - periodWeights[0].weight_kg) * 10) / 10 : null

        return {
          label,
          workoutsCompleted: periodSessions.filter((s) => s.is_completed).length,
          totalWorkoutMinutes: Math.round(totalWorkoutMinutes),
          avgSteps,
          avgWater,
          weightChangeKg,
        }
      }

      return {
        greeting: getGreeting(),
        date,
        currentWeightKg: currentWeight,
        goalWeightKg: goalWeight,
        weightDifferenceKg: weightDifference,
        lastWeightLogDate: latestWeight?.date ?? null,
        pointsToday,
        level,
        xp,
        xpForNextLevel,
        xpProgressPct: progressPct,
        currentStreaks: streaks,
        habitsToday,
        todaysProgress: {
          stepsCurrent: stepLog?.steps ?? 0,
          stepsGoal: settings?.step_goal ?? 10000,
          waterCurrentMl: waterTotal,
          waterGoalMl: settings?.water_goal_ml ?? 3000,
          caloriesConsumed,
          workoutDone,
        },
        weeklyProgress: buildPeriodProgress('This Week', weekSessions, weekSteps, weekWater, weekWeights),
        monthlyProgress: buildPeriodProgress('This Month', monthSessions, monthSteps, monthWater, monthWeights),
      }
    },
    staleTime: 30_000,
  })
}
