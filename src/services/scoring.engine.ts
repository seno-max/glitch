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
 * Awards points for a completed day. By design, points are only awarded
 * for two things: completing a gym workout, and hitting 10,000 steps.
 * (A 5-day gym streak bonus is awarded separately via updateStreak.)
 * Everything else the user tracks (water, food, sleep, weight, photos,
 * mood, etc.) is still logged normally, it just doesn't earn points.
 */
export async function awardDailyPoints(
  userId: string,
  date: string,
  inputs: { gymCompleted: boolean; steps: number }
): Promise<PointsAwardResult> {
  const breakdown: { reason: string; points: number }[] = []

  if (inputs.gymCompleted && !(await gamificationService.hasPointsForReason(userId, date, 'gym_completed'))) {
    breakdown.push({ reason: 'gym_completed', points: POINTS.GYM_COMPLETED })
  }
  if (inputs.steps >= 10000 && !(await gamificationService.hasPointsForReason(userId, date, 'steps_10k'))) {
    breakdown.push({ reason: 'steps_10k', points: POINTS.STEPS_10K })
  }

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
 * Handles consecutive-day detection and longest-streak tracking.
 * Only the 'gym' category awards a milestone bonus (5-day streak = 150 pts);
 * other categories (water, sleep, food, weight) are tracked for display only.
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

  const bonus = category === 'gym' ? getStreakMilestoneBonus(newStreak) : 0
  if (bonus > 0) {
    await gamificationService.addPoints(userId, date, bonus, `streak_${newStreak}_days_${category}`)
    await gamificationService.addXp(userId, bonus)
  }

  return { streak: newStreak, bonusAwarded: bonus }
}
