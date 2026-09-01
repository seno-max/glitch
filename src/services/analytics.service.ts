import { supabase } from '@/lib/supabase'
import type { AnalyticsSummary } from '@/types/models'
import { workoutService } from './workout.service'
import { trackingService } from './tracking.service'
import { gamificationService } from './gamification.service'
import { nutritionService } from './nutrition.service'
import { weekRange, monthRange } from '@/utils/date'

export const analyticsService = {
  async getSummary(userId: string, startDate: string, endDate: string): Promise<AnalyticsSummary> {
    const [sessions, cardioSessions, weightLogs, pointsEntries, waterLogs, stepLogs, meals] = await Promise.all([
      workoutService.getSessionsInRange(userId, startDate, endDate),
      workoutService.getCardioSessionsInRange(userId, startDate, endDate),
      trackingService.getWeightLogsInRange(userId, startDate, endDate),
      gamificationService.getPointsInRange(userId, startDate, endDate),
      trackingService.getWaterLogsInRange(userId, startDate, endDate),
      trackingService.getStepLogsInRange(userId, startDate, endDate),
      nutritionService.getMealsInRange(userId, startDate, endDate),
    ])

    // Strength volume: sum across sessions in range
    const sessionIds = sessions.map((s) => s.id)
    let strengthVolumeKg = 0
    if (sessionIds.length) {
      const { data } = await supabase.from('strength_exercises').select('volume_kg').in('session_id', sessionIds)
      strengthVolumeKg = (data ?? []).reduce((sum: number, r: { volume_kg: number | null }) => sum + (r.volume_kg ?? 0), 0)
    }

    const workoutMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
    const cardioMinutes = cardioSessions.reduce((sum, c) => sum + (c.duration_minutes ?? 0), 0)
    const cardioDistanceKm = cardioSessions.reduce((sum, c) => sum + (c.distance_km ?? 0), 0)

    const avgSteps = stepLogs.length ? stepLogs.reduce((s, l) => s + l.steps, 0) / stepLogs.length : 0
    const avgWaterMl = waterLogs.length
      ? Object.values(
          waterLogs.reduce<Record<string, number>>((acc, l) => {
            acc[l.date] = (acc[l.date] ?? 0) + l.amount_ml
            return acc
          }, {})
        ).reduce((a, b) => a + b, 0) / new Set(waterLogs.map((l) => l.date)).size
      : 0

    const daysInRange = new Set([
      ...sessions.map((s) => s.date),
      ...stepLogs.map((s) => s.date),
      ...waterLogs.map((s) => s.date),
      ...meals.map((s) => s.date),
      ...weightLogs.map((s) => s.date),
    ]).size || 1

    const daysWithFood = new Set(meals.map((m) => m.date)).size
    const foodLoggingRatePct = Math.round((daysWithFood / daysInRange) * 100)

    const weightTrend = weightLogs.map((w) => ({ date: w.date, weight: w.weight_kg }))

    // Points earned per day, from the points ledger (each row already has a date + points value).
    const pointsByDate: Record<string, number> = {}
    for (const p of pointsEntries) pointsByDate[p.date] = (pointsByDate[p.date] ?? 0) + p.points
    const pointsTrend = Object.entries(pointsByDate)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, points]) => ({ date, points }))

    const thisWeek = weekRange()
    const thisMonth = monthRange()
    const weeklyPoints = pointsEntries
      .filter((p) => p.date >= thisWeek.start && p.date <= thisWeek.end)
      .reduce((s, p) => s + p.points, 0)
    const monthlyPoints = pointsEntries
      .filter((p) => p.date >= thisMonth.start && p.date <= thisMonth.end)
      .reduce((s, p) => s + p.points, 0)

    // Heatmap: count of activities per day
    const heatmapMap: Record<string, number> = {}
    for (const s of sessions) heatmapMap[s.date] = (heatmapMap[s.date] ?? 0) + 1
    const workoutHeatmap = Object.entries(heatmapMap).map(([date, count]) => ({ date, count }))

    const mostActiveDay = workoutHeatmap.length
      ? workoutHeatmap.reduce((max, cur) => (cur.count > max.count ? cur : max)).date
      : null

    // best week / best month by workout count
    const weekCounts: Record<string, number> = {}
    for (const s of sessions) {
      const wk = weekRange(new Date(s.date)).start
      weekCounts[wk] = (weekCounts[wk] ?? 0) + 1
    }
    const bestWeek = Object.keys(weekCounts).length
      ? Object.entries(weekCounts).reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0]
      : null

    const monthCounts: Record<string, number> = {}
    for (const s of sessions) {
      const mo = s.date.slice(0, 7)
      monthCounts[mo] = (monthCounts[mo] ?? 0) + 1
    }
    const bestMonth = Object.keys(monthCounts).length
      ? Object.entries(monthCounts).reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0]
      : null

    return {
      workoutHours: Math.round((workoutMinutes / 60) * 10) / 10,
      strengthVolumeKg: Math.round(strengthVolumeKg),
      cardioHours: Math.round((cardioMinutes / 60) * 10) / 10,
      cardioDistanceKm: Math.round(cardioDistanceKm * 10) / 10,
      avgWorkoutMinutes: sessions.length ? Math.round(workoutMinutes / sessions.length) : 0,
      avgSteps: Math.round(avgSteps),
      avgWaterMl: Math.round(avgWaterMl),
      foodLoggingRatePct,
      weightTrend,
      weeklyPoints,
      monthlyPoints,
      pointsTrend,
      workoutHeatmap,
      mostActiveDay,
      bestWeek,
      bestMonth,
    }
  },
}
