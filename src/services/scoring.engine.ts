import type { StreakCategory } from '@/types/database.types'
import { gamificationService } from '@/services/gamification.service'
import { habitsService } from '@/services/habits.service'
import { isConsecutiveDay } from '@/utils/date'
import type { Habit, HabitCheckin } from '@/types/database.types'

export interface PointsAwardResult {
  totalPoints: number
  breakdown: { reason: string; points: number }[]
}

/**
 * Awards points for a completed day. Unlike the old fixed system, the
 * point values themselves are configurable per-user (see Settings:
 * gym_points, steps_points) — a value of 0 disables points for that
 * activity entirely while the activity remains fully trackable.
 */
export async function awardDailyPoints(
  userId: string,
  date: string,
  inputs: { gymCompleted?: boolean; steps?: number },
  config: { gymPoints: number; stepsPoints: number; stepGoal: number }
): Promise<PointsAwardResult> {
  const breakdown: { reason: string; points: number }[] = []

  if (
    inputs.gymCompleted &&
    config.gymPoints > 0 &&
    !(await gamificationService.hasPointsForReason(userId, date, 'gym_completed'))
  ) {
    breakdown.push({ reason: 'gym_completed', points: config.gymPoints })
  }
  if (
    inputs.steps !== undefined &&
    config.stepsPoints > 0 &&
    inputs.steps >= config.stepGoal &&
    !(await gamificationService.hasPointsForReason(userId, date, 'steps_goal'))
  ) {
    breakdown.push({ reason: 'steps_goal', points: config.stepsPoints })
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
 * The gym streak's milestone bonus length and reward are configurable
 * (settings.gym_streak_days / gym_streak_points) rather than fixed.
 */
export async function updateStreak(
  userId: string,
  category: StreakCategory,
  date: string,
  streakConfig?: { streakDays: number; streakPoints: number }
): Promise<{ streak: number; bonusAwarded: number }> {
  const existing = await gamificationService.getStreak(userId, category)

  if (existing?.last_logged_date === date) {
    // Already logged today, no change
    return { streak: existing.current_streak, bonusAwarded: 0 }
  }

  let newStreak = 1
  if (existing && isConsecutiveDay(existing.last_logged_date, date)) {
    newStreak = existing.current_streak + 1
  }

  const longest = Math.max(newStreak, existing?.longest_streak ?? 0)

  await gamificationService.upsertStreak({
    user_id: userId,
    category,
    current_streak: newStreak,
    longest_streak: longest,
    last_logged_date: date,
  })

  let bonus = 0
  if (category === 'gym' && streakConfig && streakConfig.streakPoints > 0 && streakConfig.streakDays > 0) {
    if (newStreak === streakConfig.streakDays) {
      bonus = streakConfig.streakPoints
    }
  }
  if (bonus > 0) {
    await gamificationService.addPoints(userId, date, bonus, `streak_${newStreak}_days_${category}`)
    await gamificationService.addXp(userId, bonus)
  }

  return { streak: newStreak, bonusAwarded: bonus }
}

/**
 * Records a check-in against a custom habit for `date`. If this check-in
 * brings the habit's checked count up to its own target_count for the day,
 * and the habit has an (optional) points value set, awards those points
 * exactly once per day (idempotent via hasPointsForReason).
 */
export async function checkInHabit(userId: string, habit: Habit, date: string): Promise<{ checkin: HabitCheckin; pointsAwarded: number }> {
  const checkin = await habitsService.addCheckin(habit.id, userId, date)

  const todaysCheckins = await habitsService.getCheckinsForDate(userId, date)
  const countForHabit = todaysCheckins.filter((c) => c.habit_id === habit.id).length

  let pointsAwarded = 0
  if (habit.points && habit.points > 0 && countForHabit >= habit.target_count) {
    const reason = `habit_${habit.id}`
    if (!(await gamificationService.hasPointsForReason(userId, date, reason))) {
      await gamificationService.addPoints(userId, date, habit.points, reason)
      await gamificationService.addXp(userId, habit.points)
      pointsAwarded = habit.points
    }
  }

  return { checkin, pointsAwarded }
}
