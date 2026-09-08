import type { StreakCategory } from '@/types/database.types'
import { gamificationService } from '@/services/gamification.service'
import { habitsService } from '@/services/habits.service'
import { streakRewardsService } from '@/services/streak-rewards.service'
import { computeStreakFromDates, todayStr } from '@/utils/date'
import { syncGymStreakWidget } from '@/utils/gym-streak-widget'
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
 * Recomputes a streak category from the *complete* set of qualifying dates
 * (e.g. every date the user completed a gym session, or hit their step
 * goal) rather than incrementally mutating a saved counter. This is what
 * makes streaks immune to out-of-order/backdated logging — e.g. logging
 * today's workout and then going back to backfill a workout from last week
 * will correctly leave today's streak untouched, instead of resetting it.
 *
 * `qualifyingDates` should include every date on record for this category,
 * including the one just logged.
 */
export async function updateStreak(
  userId: string,
  category: StreakCategory,
  qualifyingDates: string[],
  streakConfig?: { streakDays: number; streakPoints: number; restDays?: number[] }
): Promise<{ streak: number; bonusAwarded: number }> {
  const asOfDate = todayStr()
  const restDays = streakConfig?.restDays ?? []
  const { current, longest } = computeStreakFromDates(qualifyingDates, asOfDate, restDays)
  const mostRecent = qualifyingDates.slice().sort().at(-1) ?? null

  const existing = await gamificationService.getStreak(userId, category)
  const previousCurrent = existing?.current_streak ?? 0

  await gamificationService.upsertStreak({
    user_id: userId,
    category,
    current_streak: current,
    longest_streak: Math.max(longest, existing?.longest_streak ?? 0),
    last_logged_date: mostRecent,
  })

  // Keep the home-screen "Gym Streak" widget in sync the instant the gym
  // streak changes (workout logged, backfilled, or deleted) instead of
  // waiting for the next dashboard load.
  if (category === 'gym') {
    syncGymStreakWidget(current)
  }

  // Award any *fully user-defined* streak reward for this category whose
  // day count was just newly reached (current crossed it, previousCurrent
  // hadn't). A single backfilled update could cross more than one
  // threshold at once, so award every one that applies, not just the
  // first match.
  let bonus = 0
  const rewards = await streakRewardsService.listForCategory(userId, category)
  for (const reward of rewards) {
    if (reward.points <= 0) continue
    if (current >= reward.streak_days && previousCurrent < reward.streak_days && mostRecent) {
      const reason = `streak_reward_${reward.id}`
      if (!(await gamificationService.hasPointsForReason(userId, mostRecent, reason))) {
        await gamificationService.addPoints(userId, mostRecent, reward.points, reason)
        await gamificationService.addXp(userId, reward.points)
        bonus += reward.points
      }
    }
  }

  // Legacy settings-based gym streak bonus (Settings > Rewards & Points),
  // kept for backward compatibility alongside the newer user-defined
  // streak_rewards above.
  if (category === 'gym' && streakConfig && streakConfig.streakPoints > 0 && streakConfig.streakDays > 0) {
    if (current === streakConfig.streakDays && current > previousCurrent) {
      const reason = `streak_${current}_days_${category}`
      if (!(await gamificationService.hasPointsForReason(userId, mostRecent ?? asOfDate, reason))) {
        await gamificationService.addPoints(userId, mostRecent ?? asOfDate, streakConfig.streakPoints, reason)
        await gamificationService.addXp(userId, streakConfig.streakPoints)
        bonus += streakConfig.streakPoints
      }
    }
  }

  return { streak: current, bonusAwarded: bonus }
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
