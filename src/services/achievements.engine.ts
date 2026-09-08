import { supabase } from '@/lib/supabase'
import { gamificationService } from '@/services/gamification.service'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { nutritionService } from '@/services/nutrition.service'
import { profileService } from '@/services/profile.service'
import { todayStr } from '@/utils/date'
import { celebrateBig } from '@/utils/confetti'
import toast from 'react-hot-toast'

/**
 * Central achievement-unlock engine. Recomputes every metric the built-in
 * achievement catalog can reference (workout count, cardio sessions,
 * cumulative steps, weight lost, run distance, cardio hours, gym/step
 * streak length, days-with-any-activity) from the user's actual history,
 * then unlocks (idempotently, via gamificationService.unlockAchievement's
 * upsert-with-ignoreDuplicates) any catalog entry whose criteria are now
 * met but wasn't unlocked yet.
 *
 * This is intentionally a full recompute rather than incremental
 * tracking, so it can be called after any relevant mutation (workout
 * saved, steps logged, weight logged, streak updated) without having to
 * reason about exactly which achievements that specific action could
 * affect.
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const start = '2000-01-01'
  const end = todayStr()

  const [catalog, unlockedAlready, sessions, weightLogs, latestWeight, stepLogs, streaks, meals, profile] = await Promise.all([
    gamificationService.getAchievementCatalog(),
    gamificationService.getUserAchievements(userId),
    workoutService.getSessionsInRange(userId, start, end),
    trackingService.getWeightLogsInRange(userId, start, end),
    trackingService.getLatestWeightLog(userId),
    trackingService.getStepLogsInRange(userId, start, end),
    gamificationService.getStreaks(userId),
    nutritionService.getMealsInRange(userId, start, end),
    profileService.getProfile(userId),
  ])

  const alreadyUnlocked = new Set(unlockedAlready.map((u) => u.achievement_code))
  const completedSessions = sessions.filter((s) => s.is_completed)
  const sessionIds = completedSessions.map((s) => s.id)

  // Pull every logged exercise across all sessions in one query to derive
  // cardio-session count / cardio hours / run distance / PR checks.
  let cardioSessionCount = 0
  let cardioHours = 0
  let runDistanceKm = 0
  let benchMaxKg = 0
  let deadliftMaxKg = 0
  if (sessionIds.length) {
    const { data } = await supabase
      .from('strength_exercises')
      .select('exercise_name, weight_kg, duration_seconds, duration_unit, distance_km, sets')
      .in('session_id', sessionIds)
    for (const r of (data ?? []) as {
      exercise_name: string
      weight_kg: number | null
      duration_seconds: number | null
      duration_unit: 'sec' | 'min' | null
      distance_km: number | null
      sets: number | null
    }[]) {
      const isCardioStyle = !!r.duration_seconds || !!r.distance_km
      if (isCardioStyle) {
        cardioSessionCount += 1
        if (r.duration_seconds) {
          cardioHours += r.duration_unit === 'min' ? r.duration_seconds / 60 : (r.duration_seconds * (r.sets || 1)) / 3600
        }
        if (r.distance_km) runDistanceKm += r.distance_km
      }
      const name = r.exercise_name.toLowerCase()
      if (name.includes('bench press') && r.weight_kg) benchMaxKg = Math.max(benchMaxKg, r.weight_kg)
      if (name.includes('deadlift') && r.weight_kg) deadliftMaxKg = Math.max(deadliftMaxKg, r.weight_kg)
    }
  }

  const totalSteps = stepLogs.reduce((s, l) => s + l.steps, 0)

  const startWeight = weightLogs.length ? weightLogs[0].weight_kg : null
  const currentWeight = latestWeight?.weight_kg ?? profile?.current_weight_kg ?? null
  const weightLostKg = startWeight !== null && currentWeight !== null ? Math.max(0, startWeight - currentWeight) : 0

  const gymStreak = streaks.find((s) => s.category === 'gym')
  const stepsStreak = streaks.find((s) => s.category === 'steps')

  // "Days logged" — any day with a workout, step log, weight log, or meal.
  const loggedDates = new Set<string>()
  for (const s of completedSessions) loggedDates.add(s.date)
  for (const l of stepLogs) if (l.steps > 0) loggedDates.add(l.date)
  for (const w of weightLogs) loggedDates.add(w.date)
  for (const m of meals) loggedDates.add(m.date)

  const metrics: Record<string, number> = {
    workouts: completedSessions.length,
    days_logged: loggedDates.size,
    total_steps: totalSteps,
    weight_lost_kg: weightLostKg,
    cardio_sessions: cardioSessionCount,
    run_distance_km: runDistanceKm,
    cardio_hours: cardioHours,
    gym_streak_days: Math.max(gymStreak?.current_streak ?? 0, gymStreak?.longest_streak ?? 0),
    steps_streak_days: Math.max(stepsStreak?.current_streak ?? 0, stepsStreak?.longest_streak ?? 0),
  }

  const newlyUnlocked: string[] = []

  for (const ach of catalog) {
    if (alreadyUnlocked.has(ach.code)) continue
    const criteria = ach.criteria as Record<string, number | { exercise: string; weight_kg: number }>

    let met = true
    for (const [key, requirement] of Object.entries(criteria)) {
      if (key === 'exercise') continue // paired with weight_kg below, not a standalone check
      if (key === 'weight_kg') {
        const exerciseName = (criteria.exercise as unknown as string) ?? ''
        const maxForExercise = exerciseName.toLowerCase().includes('bench') ? benchMaxKg : exerciseName.toLowerCase().includes('deadlift') ? deadliftMaxKg : 0
        if (maxForExercise < (requirement as number)) met = false
        continue
      }
      const actual = metrics[key]
      if (actual === undefined || actual < (requirement as number)) {
        met = false
        break
      }
    }

    if (met) {
      const unlocked = await gamificationService.unlockAchievement(userId, ach.code)
      if (unlocked) newlyUnlocked.push(ach.code)
    }
  }

  if (newlyUnlocked.length > 0) {
    const names = catalog.filter((a) => newlyUnlocked.includes(a.code))
    celebrateBig()
    for (const a of names) {
      toast.success(`${a.icon ?? '🏆'} Achievement unlocked: ${a.name}!`)
    }
  }

  return newlyUnlocked
}
