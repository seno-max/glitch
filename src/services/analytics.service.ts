import { supabase } from '@/lib/supabase'
import type { AnalyticsSummary } from '@/types/models'
import { parseISO } from 'date-fns'
import { workoutService } from './workout.service'
import { trackingService } from './tracking.service'
import { gamificationService } from './gamification.service'
import { nutritionService } from './nutrition.service'
import { weekRange, monthRange } from '@/utils/date'

export const analyticsService = {
  async getSummary(userId: string, startDate: string, endDate: string): Promise<AnalyticsSummary> {
    const [sessions, weightLogs, pointsEntries, waterLogs, stepLogs, meals] = await Promise.all([
      workoutService.getSessionsInRange(userId, startDate, endDate),
      trackingService.getWeightLogsInRange(userId, startDate, endDate),
      gamificationService.getPointsInRange(userId, startDate, endDate),
      trackingService.getWaterLogsInRange(userId, startDate, endDate),
      trackingService.getStepLogsInRange(userId, startDate, endDate),
      nutritionService.getMealsInRange(userId, startDate, endDate),
    ])

    // Strength volume + cardio hours/distance: all exercises are logged in
    // one unified table now (strength_exercises). A cardio-style entry is
    // simply one where duration_seconds and/or distance_km were filled in
    // (e.g. "5km Run", "Treadmill Intervals") rather than weight x reps.
    const sessionIds = sessions.map((s) => s.id)
    let strengthVolumeKg = 0
    let cardioMinutes = 0
    let cardioDistanceKm = 0
    if (sessionIds.length) {
      const { data } = await supabase
        .from('strength_exercises')
        .select('volume_kg, duration_seconds, duration_unit, distance_km, sets')
        .in('session_id', sessionIds)
      for (const r of (data ?? []) as {
        volume_kg: number | null
        duration_seconds: number | null
        duration_unit: 'sec' | 'min' | null
        distance_km: number | null
        sets: number | null
      }[]) {
        strengthVolumeKg += r.volume_kg ?? 0
        if (r.duration_seconds) {
          // duration_seconds is stored in whatever unit the user picked at
          // entry time (duration_unit). Machine cardio logged in minutes is
          // a single total duration (no sets multiplier); timed bodyweight
          // sets logged in seconds are "per set" and get multiplied by sets.
          cardioMinutes += r.duration_unit === 'min' ? r.duration_seconds : (r.duration_seconds * (r.sets || 1)) / 60
        }
        if (r.distance_km) cardioDistanceKm += r.distance_km
      }
    }

    const workoutMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

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

    // Steps & water trends for charting (one point per day that has data).
    const stepsTrend = stepLogs
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((s) => ({ date: s.date, steps: s.steps }))

    const waterByDate: Record<string, number> = {}
    for (const w of waterLogs) waterByDate[w.date] = (waterByDate[w.date] ?? 0) + w.amount_ml
    const waterTrend = Object.entries(waterByDate)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, ml]) => ({ date, ml }))

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
    // NOTE: use parseISO (local-timezone) rather than new Date(str), which
    // parses date-only strings as UTC midnight — in UTC-negative timezones
    // that shifts the week bucket a day.
    const weekCounts: Record<string, number> = {}
    for (const s of sessions) {
      const wk = weekRange(parseISO(s.date)).start
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

    // Weekly comparison — workouts + total minutes per week across the
    // range, for a simple "this week vs last week" style bar chart.
    const weekBuckets: Record<string, { workouts: number; minutes: number }> = {}
    for (const s of sessions) {
      const wk = weekRange(parseISO(s.date)).start
      if (!weekBuckets[wk]) weekBuckets[wk] = { workouts: 0, minutes: 0 }
      weekBuckets[wk].workouts += 1
      weekBuckets[wk].minutes += s.duration_minutes ?? 0
    }
    const weeklyComparison = Object.entries(weekBuckets)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([weekStart, v]) => ({ weekStart, workouts: v.workouts, minutes: Math.round(v.minutes) }))

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
      stepsTrend,
      waterTrend,
      weeklyPoints,
      monthlyPoints,
      pointsTrend,
      workoutHeatmap,
      weeklyComparison,
      mostActiveDay,
      bestWeek,
      bestMonth,
    }
  },
}
