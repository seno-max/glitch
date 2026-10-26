import { supabase } from '@/lib/supabase'
import { gamificationService } from '@/services/gamification.service'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { nutritionService } from '@/services/nutrition.service'
import { notificationService } from '@/services/notification.service'
import { todayStr } from '@/utils/date'
import { celebrate } from '@/utils/confetti'
import toast from 'react-hot-toast'

/**
 * Auto-progress engine for custom challenges. Recomputes each ACTIVE
 * challenge's current_value from the user's actual logged history (instead
 * of leaving it at 0 forever) whenever a relevant mutation happens (workout
 * saved, steps logged, water added, weight logged), then completes the
 * challenge and awards its reward XP when the target is reached.
 *
 * Metrics computed per challenge:
 *  - gym_days:          completed workout sessions in the challenge window
 *  - steps_total:       summed steps in the window
 *  - water_daily_goal:  days whose total water met the daily water goal
 *  - weight_loss_kg:    first weight log minus latest weight log in window
 *  - run_distance_km:   summed distance_km of cardio-style exercise logs
 *  - cardio_sessions:   exercise logs with duration/distance in the window
 *  - custom:            left as-is (updated manually)
 */
export async function updateChallengeProgressForUser(
  userId: string,
  settings: { water_goal_ml?: number | null } | null
): Promise<void> {
  const challenges = await gamificationService.getChallenges(userId, true)
  if (challenges.length === 0) return

  const today = todayStr()
  const waterGoal = settings?.water_goal_ml ?? 3000

  // Compute one merged range across all active challenges so the data can
  // be fetched in as few queries as possible, then slice per challenge.
  const rangeStart = challenges.reduce((min, c) => (c.start_date < min ? c.start_date : min), challenges[0].start_date)
  const rangeEnd = challenges.reduce((max, c) => (c.end_date > max ? c.end_date : max), challenges[0].end_date)

  const [sessions, stepLogs, waterLogs, weightLogs] = await Promise.all([
    workoutService.getSessionsInRange(userId, rangeStart, rangeEnd),
    trackingService.getStepLogsInRange(userId, rangeStart, rangeEnd),
    trackingService.getWaterLogsInRange(userId, rangeStart, rangeEnd),
    trackingService.getWeightLogsInRange(userId, rangeStart, rangeEnd),
  ])
  void nutritionService // kept imported so future metrics can use it

  // Cardio-style exercise rows across all sessions in the merged range.
  const sessionIds = sessions.map((s) => s.id)
  let cardioSessionCount = 0
  let cardioDistanceKm = 0
  if (sessionIds.length) {
    const { data } = await supabase
      .from('strength_exercises')
      .select('duration_seconds, distance_km')
      .in('session_id', sessionIds)
    for (const r of (data ?? []) as { duration_seconds: number | null; distance_km: number | null }[]) {
      if (r.duration_seconds || r.distance_km) {
        cardioSessionCount += 1
        if (r.distance_km) cardioDistanceKm += r.distance_km
      }
    }
  }

  for (const challenge of challenges) {
    const end = challenge.end_date < today ? challenge.end_date : today
    let currentValue = challenge.current_value

    switch (challenge.metric) {
      case 'gym_days': {
        currentValue = sessions.filter((s) => s.is_completed && s.date >= challenge.start_date && s.date <= end).length
        break
      }
      case 'steps_total': {
        currentValue = stepLogs.filter((l) => l.date >= challenge.start_date && l.date <= end).reduce((sum, l) => sum + l.steps, 0)
        break
      }
      case 'water_daily_goal': {
        const totalsByDate: Record<string, number> = {}
        for (const w of waterLogs) {
          if (w.date < challenge.start_date || w.date > end) continue
          totalsByDate[w.date] = (totalsByDate[w.date] ?? 0) + w.amount_ml
        }
        currentValue = Object.values(totalsByDate).filter((ml) => ml >= waterGoal).length
        break
      }
      case 'weight_loss_kg': {
        const inRange = weightLogs.filter((w) => w.date >= challenge.start_date && w.date <= end)
        if (inRange.length >= 1) {
          const first = inRange[0].weight_kg
          const last = inRange[inRange.length - 1].weight_kg
          currentValue = Math.max(0, Math.round((first - last) * 10) / 10)
        } else {
          currentValue = 0
        }
        break
      }
      case 'run_distance_km': {
        currentValue = Math.round(cardioDistanceKm * 10) / 10
        break
      }
      case 'cardio_sessions': {
        currentValue = cardioSessionCount
        break
      }
      case 'custom':
      default:
        break
    }

    const targetValue = Number(challenge.target_value)
    const isComplete = currentValue >= targetValue

    if (!isComplete && currentValue === challenge.current_value) continue

    if (currentValue !== challenge.current_value) {
      await gamificationService.updateChallengeProgress(challenge.id, currentValue)
    }

    if (isComplete && !challenge.is_completed) {
      await gamificationService.completeChallenge(challenge.id)
      if (challenge.reward_xp > 0) {
        await gamificationService.addXp(userId, challenge.reward_xp)
      }
      try {
        await notificationService.create(
          userId,
          'achievement_unlocked',
          `🎯 Challenge complete: ${challenge.title}!`,
          `You hit ${currentValue} / ${targetValue}.${challenge.reward_xp > 0 ? ` +${challenge.reward_xp} XP` : ''}`
        )
      } catch {
        /* best-effort */
      }
      celebrate()
      toast.success(`🎯 Challenge complete: ${challenge.title}!`)
    }
  }
}
