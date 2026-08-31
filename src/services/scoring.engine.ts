import type { DailyScore, StreakCategory } from '@/types/database.types'
import { HEALTH_SCORE_WEIGHTS, HEALTH_SCORE_MAX, POINTS, getStreakMilestoneBonus } from '@/types/models'
import { gamificationService } from '@/services/gamification.service'
import { isConsecutiveDay } from '@/utils/date'

export interface DayInputsForScoring {
  gymCompleted: boolean
  steps: number
  waterMl: number
  waterGoalMl: number
  mealsLogged: number
  sleepHours: number | null
  sleepGoalHours: number
  weightLogged: boolean
  stretchingDone: boolean
  moodLogged: boolean
  photoLogged: boolean
}

/**
 * Computes the weighted daily health score (0-100 normalized) from raw
 * day inputs. Individual component scores are also returned for display
 * in the breakdown UI, and stored in the daily_scores table.
 */
export function computeDailyScore(inputs: DayInputsForScoring): Omit<DailyScore, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'> {
  const gym_score = inputs.gymCompleted ? HEALTH_SCORE_WEIGHTS.gym : 0
  const steps_score = inputs.steps >= 10000 ? HEALTH_SCORE_WEIGHTS.steps10k : Math.round((inputs.steps / 10000) * HEALTH_SCORE_WEIGHTS.steps10k)
  const water_score = inputs.waterMl >= inputs.waterGoalMl ? HEALTH_SCORE_WEIGHTS.waterGoal : Math.round((inputs.waterMl / inputs.waterGoalMl) * HEALTH_SCORE_WEIGHTS.waterGoal)
  const food_score = inputs.mealsLogged > 0 ? HEALTH_SCORE_WEIGHTS.foodLogged : 0
  const sleep_score =
    inputs.sleepHours !== null && inputs.sleepHours >= inputs.sleepGoalHours
      ? HEALTH_SCORE_WEIGHTS.sleepGoal
      : inputs.sleepHours
        ? Math.round((inputs.sleepHours / inputs.sleepGoalHours) * HEALTH_SCORE_WEIGHTS.sleepGoal)
        : 0
  const weight_score = inputs.weightLogged ? HEALTH_SCORE_WEIGHTS.weightLogged : 0
  const stretching_score = inputs.stretchingDone ? HEALTH_SCORE_WEIGHTS.stretching : 0
  const mood_score = inputs.moodLogged ? HEALTH_SCORE_WEIGHTS.moodLogged : 0
  const photo_score = inputs.photoLogged ? HEALTH_SCORE_WEIGHTS.progressPhoto : 0

  const rawTotal =
    gym_score + steps_score + water_score + food_score + sleep_score + weight_score + stretching_score + mood_score + photo_score
  const total_score = Math.round((rawTotal / HEALTH_SCORE_MAX) * 100)

  return {
    gym_score,
    steps_score,
    water_score,
    food_score,
    sleep_score,
    weight_score,
    stretching_score,
    mood_score,
    photo_score,
    total_score,
  }
}

export interface PointsAwardResult {
  totalPoints: number
  breakdown: { reason: string; points: number }[]
}

/**
 * Awards points for a completed day based on the same inputs used for the
 * health score, plus special bonus conditions (early workout, long workout,
 * no sugary drinks). Persists each entry to the points ledger.
 */
export async function awardDailyPoints(
  userId: string,
  date: string,
  inputs: DayInputsForScoring & {
    workoutMinutes?: number
    workoutStartHour?: number | null
    noSugaryDrinks?: boolean
  }
): Promise<PointsAwardResult> {
  const breakdown: { reason: string; points: number }[] = []

  if (inputs.gymCompleted) breakdown.push({ reason: 'gym_completed', points: POINTS.GYM_COMPLETED })

  if (inputs.steps >= 20000) breakdown.push({ reason: 'steps_20k', points: POINTS.STEPS_20K })
  else if (inputs.steps >= 15000) breakdown.push({ reason: 'steps_15k', points: POINTS.STEPS_15K })
  else if (inputs.steps >= 10000) breakdown.push({ reason: 'steps_10k', points: POINTS.STEPS_10K })

  if (inputs.waterMl >= inputs.waterGoalMl) breakdown.push({ reason: 'water_goal', points: POINTS.WATER_GOAL })
  if (inputs.mealsLogged > 0) breakdown.push({ reason: 'food_logged', points: POINTS.FOOD_LOGGED })
  if (inputs.sleepHours !== null && inputs.sleepHours >= inputs.sleepGoalHours)
    breakdown.push({ reason: 'sleep_goal', points: POINTS.SLEEP_GOAL })
  if (inputs.weightLogged) breakdown.push({ reason: 'weight_logged', points: POINTS.WEIGHT_LOGGED })
  if (inputs.photoLogged) breakdown.push({ reason: 'progress_photo', points: POINTS.PROGRESS_PHOTO })
  if (inputs.workoutMinutes && inputs.workoutMinutes > 90)
    breakdown.push({ reason: 'workout_over_90min', points: POINTS.WORKOUT_OVER_90MIN })
  if (inputs.workoutStartHour !== null && inputs.workoutStartHour !== undefined && inputs.workoutStartHour < 8)
    breakdown.push({ reason: 'workout_before_8am', points: POINTS.WORKOUT_BEFORE_8AM })
  if (inputs.noSugaryDrinks) breakdown.push({ reason: 'no_sugary_drinks', points: POINTS.NO_SUGARY_DRINKS })

  for (const entry of breakdown) {
    await gamificationService.addPoints(userId, date, entry.points, entry.reason)
  }

  const totalPoints = breakdown.reduce((s, e) => s + e.points, 0)
  if (totalPoints > 0) {
    await gamificationService.addXp(userId, totalPoints)
  }

  return { totalPoints, breakdown }
}

/**
 * Updates a streak category after an activity is logged for `date`.
 * Handles consecutive-day detection, longest-streak tracking, and
 * awards milestone bonus points/XP when hit.
 */
export async function updateStreak(userId: string, category: StreakCategory, date: string): Promise<{ streak: number; bonusAwarded: number }> {
  const existing = await gamificationService.getStreak(userId, category)

  let newStreak = 1
  if (existing?.last_logged_date === date) {
    // Already logged today, no change
    return { streak: existing.current_streak, bonusAwarded: 0 }
  }

  if (existing && isConsecutiveDay(existing.last_logged_date, date)) {
    newStreak = existing.current_streak + 1
  } else if (existing?.last_logged_date === date) {
    newStreak = existing.current_streak
  }

  const longest = Math.max(newStreak, existing?.longest_streak ?? 0)

  await gamificationService.upsertStreak({
    user_id: userId,
    category,
    current_streak: newStreak,
    longest_streak: longest,
    last_logged_date: date,
  })

  const bonus = getStreakMilestoneBonus(newStreak)
  if (bonus > 0) {
    await gamificationService.addPoints(userId, date, bonus, `streak_${newStreak}_days_${category}`)
    await gamificationService.addXp(userId, bonus)
  }

  return { streak: newStreak, bonusAwarded: bonus }
}
