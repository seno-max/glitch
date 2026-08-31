import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { gamificationService } from '@/services/gamification.service'
import { nutritionService } from '@/services/nutrition.service'
import { profileService } from '@/services/profile.service'
import { todayStr, getGreeting, weekRange, monthRange } from '@/utils/date'
import { getLevelForXp } from '@/types/models'
import type { DashboardSummary, TaskItem, PeriodProgress } from '@/types/models'

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
        weightLog,
        latestWeight,
        settings,
        waterLogs,
        stepLog,
        meals,
        sleepLog,
        dailyScore,
        streaks,
        weekSessions,
        monthSessions,
        weekSteps,
        monthSteps,
        weekWater,
        monthWater,
        weekScores,
        monthScores,
        weekWeights,
        monthWeights,
      ] = await Promise.all([
        workoutService.getSessionsByDate(userId!, date),
        trackingService.getWeightLogByDate(userId!, date),
        trackingService.getLatestWeightLog(userId!),
        profileService.getSettings(userId!),
        trackingService.getWaterLogsByDate(userId!, date),
        trackingService.getStepLogByDate(userId!, date),
        nutritionService.getMealsByDate(userId!, date),
        trackingService.getSleepLogByDate(userId!, date),
        gamificationService.getDailyScore(userId!, date),
        gamificationService.getStreaks(userId!),
        workoutService.getSessionsInRange(userId!, week.start, week.end),
        workoutService.getSessionsInRange(userId!, month.start, month.end),
        trackingService.getStepLogsInRange(userId!, week.start, week.end),
        trackingService.getStepLogsInRange(userId!, month.start, month.end),
        trackingService.getWaterLogsInRange(userId!, week.start, week.end),
        trackingService.getWaterLogsInRange(userId!, month.start, month.end),
        gamificationService.getDailyScoresInRange(userId!, week.start, week.end),
        gamificationService.getDailyScoresInRange(userId!, month.start, month.end),
        trackingService.getWeightLogsInRange(userId!, week.start, week.end),
        trackingService.getWeightLogsInRange(userId!, month.start, month.end),
      ])

      const pointsToday = await gamificationService.getPointsForDate(userId!, date)

      const currentWeight = weightLog?.weight_kg ?? latestWeight?.weight_kg ?? profile?.current_weight_kg ?? null
      const goalWeight = profile?.goal_weight_kg ?? null
      const weightDifference = currentWeight !== null && goalWeight !== null ? Math.round((currentWeight - goalWeight) * 10) / 10 : null

      const xp = profile?.xp ?? 0
      const { level, progressPct, xpForNextLevel } = getLevelForXp(xp)

      const waterTotal = waterLogs.reduce((s, w) => s + w.amount_ml, 0)
      const caloriesConsumed = meals.reduce((s, m) => s + (m.calories ?? 0), 0)
      const workoutDone = sessions.some((s) => s.is_completed)

      const todaysTasks: TaskItem[] = [
        { id: 'workout', label: 'Complete a workout', completed: workoutDone, icon: 'Dumbbell', points: 100, href: '/workout' },
        {
          id: 'steps',
          label: 'Hit 10,000 steps',
          completed: (stepLog?.steps ?? 0) >= 10000,
          icon: 'Footprints',
          points: 50,
          href: '/tracking/steps',
        },
        {
          id: 'water',
          label: `Drink ${((settings?.water_goal_ml ?? 3000) / 1000).toFixed(1)}L water`,
          completed: waterTotal >= (settings?.water_goal_ml ?? 3000),
          icon: 'Droplets',
          href: '/tracking/water',
        },
        { id: 'food', label: 'Log your meals', completed: meals.length > 0, icon: 'UtensilsCrossed', href: '/nutrition' },
        { id: 'weight', label: 'Log today\'s weight', completed: !!weightLog, icon: 'Scale', href: '/tracking/weight' },
        {
          id: 'sleep',
          label: `Sleep ${settings?.sleep_goal_hours ?? 8}h`,
          completed: (sleepLog?.hours_slept ?? 0) >= (settings?.sleep_goal_hours ?? 8),
          icon: 'Moon',
          href: '/tracking/sleep',
        },
      ]

      const buildPeriodProgress = (
        label: string,
        periodSessions: typeof sessions,
        periodSteps: typeof weekSteps,
        periodWater: typeof weekWater,
        periodScores: typeof weekScores,
        periodWeights: typeof weekWeights
      ): PeriodProgress => {
        const totalWorkoutMinutes = periodSessions.reduce((s, w) => s + (w.duration_minutes ?? 0), 0)
        const avgSteps = periodSteps.length ? Math.round(periodSteps.reduce((s, w) => s + w.steps, 0) / periodSteps.length) : 0
        const daysWithWater = new Set(periodWater.map((w) => w.date)).size || 1
        const avgWater = Math.round(periodWater.reduce((s, w) => s + w.amount_ml, 0) / daysWithWater)
        const avgScore = periodScores.length ? Math.round(periodScores.reduce((s, w) => s + w.total_score, 0) / periodScores.length) : 0
        const weightChangeKg =
          periodWeights.length >= 2 ? Math.round((periodWeights[periodWeights.length - 1].weight_kg - periodWeights[0].weight_kg) * 10) / 10 : null

        return {
          label,
          workoutsCompleted: periodSessions.filter((s) => s.is_completed).length,
          totalWorkoutMinutes: Math.round(totalWorkoutMinutes),
          avgSteps,
          avgWater,
          avgScore,
          weightChangeKg,
        }
      }

      return {
        greeting: getGreeting(),
        date,
        currentWeightKg: currentWeight,
        goalWeightKg: goalWeight,
        weightDifferenceKg: weightDifference,
        healthScoreToday: dailyScore?.total_score ?? 0,
        pointsToday,
        level,
        xp,
        xpForNextLevel,
        xpProgressPct: progressPct,
        currentStreaks: streaks,
        todaysTasks,
        todaysProgress: {
          stepsCurrent: stepLog?.steps ?? 0,
          stepsGoal: settings?.step_goal ?? 10000,
          waterCurrentMl: waterTotal,
          waterGoalMl: settings?.water_goal_ml ?? 3000,
          caloriesConsumed,
          workoutDone,
          sleepHours: sleepLog?.hours_slept ?? null,
          sleepGoalHours: settings?.sleep_goal_hours ?? 8,
        },
        weeklyProgress: buildPeriodProgress('This Week', weekSessions, weekSteps, weekWater, weekScores, weekWeights),
        monthlyProgress: buildPeriodProgress('This Month', monthSessions, monthSteps, monthWater, monthScores, monthWeights),
      }
    },
    staleTime: 30_000,
  })
}
