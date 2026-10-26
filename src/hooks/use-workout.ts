import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { workoutService } from '@/services/workout.service'
import { trackingService } from '@/services/tracking.service'
import { updateStreak, awardDailyPoints } from '@/services/scoring.engine'
import { gamificationService } from '@/services/gamification.service'
import { profileService } from '@/services/profile.service'
import { checkAndUnlockAchievements } from '@/services/achievements.engine'
import { updateChallengeProgressForUser } from '@/services/challenge-progress.engine'
import { todayStr } from '@/utils/date'
import { celebrateBig } from '@/utils/confetti'
import type { WorkoutType, StrengthExercise } from '@/types/database.types'
import type { DraftExercise } from '@/stores/workout-log.store'
import toast from 'react-hot-toast'

export function useWorkoutHistory(limit = 20) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['workout-history', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const end = todayStr()
      const start = '2000-01-01'
      const sessions = await workoutService.getSessionsInRange(user!.id, start, end)
      return sessions.slice().reverse().slice(0, limit)
    },
  })
}

/**
 * Loads a single workout session plus its logged exercises, keyed by
 * session id. Used to prefill the manual log editor when re-opening a
 * previously logged workout (e.g. from the calendar day-detail page).
 */
export function useWorkoutSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['workout-session-detail', sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const [session, exercises] = await Promise.all([
        workoutService.getSessionById(sessionId!),
        workoutService.getStrengthExercisesBySession(sessionId!),
      ])
      return { session, exercises }
    },
  })
}

interface SaveWorkoutLogInput {
  sessionId?: string // present when editing an existing log
  date: string
  entryTime: string // "HH:mm"
  exitTime: string // "HH:mm"
  workoutTypes: WorkoutType[]
  title: string
  exercises: DraftExercise[]
}

/**
 * Saves (creates or updates) a manually-logged workout: a gym entry/exit
 * time pair (duration auto-calculated by the DB trigger) plus a list of
 * exercises (strength and/or timed cardio-style). Awards gym-completion
 * points + updates the gym streak, same as before, but without any live
 * timer flow.
 */
export function useSaveWorkoutLog() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveWorkoutLogInput) => {
      if (!user) throw new Error('Not authenticated')
      const gymEntryTime = new Date(`${input.date}T${input.entryTime}:00`).toISOString()
      let exitDate = input.date
      // If exit time is earlier than entry time, assume it rolled past midnight.
      if (input.exitTime < input.entryTime) {
        const next = new Date(`${input.date}T00:00:00`)
        next.setDate(next.getDate() + 1)
        exitDate = next.toISOString().slice(0, 10)
      }
      const gymExitTime = new Date(`${exitDate}T${input.exitTime}:00`).toISOString()

      const session = input.sessionId
        ? await workoutService.updateSessionTimes(input.sessionId, {
            date: input.date,
            gymEntryTime,
            gymExitTime,
            workoutTypes: input.workoutTypes,
            title: input.title || null,
          })
        : await workoutService.createSession({
            userId: user.id,
            date: input.date,
            gymEntryTime,
            gymExitTime,
            workoutTypes: input.workoutTypes,
            title: input.title || null,
          })

      const settings = await profileService.getSettings(user.id)

      // Per-date rest days (streak freeze) the user has marked, bridged over
      // by the gym streak alongside the repeating weekday rest-day pattern.
      const restDayLogs = await trackingService.getRestDayLogs(user.id)
      const frozenDates = restDayLogs.map((r) => r.date)

      // Replace exercises: delete existing (if editing) then re-insert.
      if (input.sessionId) {
        const existing = await workoutService.getStrengthExercisesBySession(input.sessionId)
        await Promise.all(existing.map((e) => workoutService.deleteStrengthExercise(e.id)))
      }

      const savedExercises: StrengthExercise[] = []
      for (let i = 0; i < input.exercises.length; i++) {
        const ex = input.exercises[i]
        const saved = await workoutService.addStrengthExercise({
          session_id: session.id,
          user_id: user.id,
          exercise_id: null,
          exercise_name: ex.exercise_name,
          equipment: ex.equipment,
          weight_kg: ex.weight_kg ?? 0,
          sets: ex.sets ?? 0,
          reps: ex.reps ?? 0,
          rest_seconds: ex.rest_seconds,
          rpe: ex.rpe,
          duration_seconds: ex.duration_seconds,
          duration_unit: ex.duration_unit,
          distance_km: ex.distance_km,
          notes: ex.notes,
          order_index: i,
          performed_at: gymEntryTime,
        })
        savedExercises.push(saved)
      }

      await updateStreak(
        user.id,
        'gym',
        (await workoutService.getSessionsInRange(user.id, '2000-01-01', todayStr())).filter((s) => s.is_completed).map((s) => s.date),
        {
          streakDays: settings?.gym_streak_days ?? 5,
          streakPoints: settings?.gym_streak_points ?? 0,
          restDays: settings?.rest_days ?? [],
          frozenDates,
        }
      )
      await awardDailyPoints(
        user.id,
        input.date,
        { gymCompleted: true },
        { gymPoints: settings?.gym_points ?? 0, stepsPoints: 0, stepGoal: settings?.step_goal ?? 10000 }
      )

      for (const ex of savedExercises) {
        await checkStrengthPR(ex, input.date)
      }

      await checkAndUnlockAchievements(user.id)

      // Auto-progress any active custom challenges (gym_days / cardio
      // metrics) and complete + reward them when targets are reached.
      await updateChallengeProgressForUser(user.id, settings)

      return {
        session,
        summary: {
          durationMinutes: session.duration_minutes ?? 0,
          exerciseCount: savedExercises.length,
          workoutTypes: input.workoutTypes,
          date: input.date,
        },
      }
    },
    onSuccess: () => {
      celebrateBig()
      toast.success('Workout saved! 💪')
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      queryClient.invalidateQueries({ queryKey: ['workout-session-detail'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
    },
  })
}

export function useDeleteWorkoutSession() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Capture the session's date before deleting — needed to revoke the
      // points that were awarded for completing a workout on that day.
      const session = await workoutService.getSessionById(sessionId)
      await workoutService.deleteSession(sessionId)
      return { date: session?.date ?? null }
    },
    onSuccess: async ({ date }) => {
      toast.success('Workout deleted')
      if (user) {
        // Recompute the gym streak from what's actually left after the
        // deletion, in case the deleted session was part of the current
        // or longest streak.
        const settings = await profileService.getSettings(user.id)
        const restDayLogs = await trackingService.getRestDayLogs(user.id)

        // Revoke the points earned for completing a workout on the deleted
        // session's date: the gym_completed award itself plus any gym
        // streak bonus/streak-reward entries keyed to that date (the bonus
        // only stands if the workout that crossed the threshold does).
        if (date) {
          const ledgerEntries = await gamificationService.getPointsInRange(user.id, date, date)
          const revocable = ledgerEntries.filter(
            (e) => e.reason === 'gym_completed' || e.reason.startsWith('streak_reward_') || /^streak_\d+_days_gym$/.test(e.reason)
          )
          let revoked = 0
          for (const entry of revocable) {
            await gamificationService.removePointsLedgerEntry(entry.id)
            revoked += entry.points
          }
          // Subtract the revoked points from XP too (atomically), so the
          // level doesn't stay inflated after the deletion.
          if (revoked > 0) {
            try {
              await gamificationService.addXp(user.id, -revoked)
            } catch {
              /* best-effort */
            }
          }
        }

        const remaining = (await workoutService.getSessionsInRange(user.id, '2000-01-01', todayStr())).filter((s) => s.is_completed).map((s) => s.date)
        await updateStreak(user.id, 'gym', remaining, {
          streakDays: settings?.gym_streak_days ?? 5,
          streakPoints: 0,
          restDays: settings?.rest_days ?? [],
          frozenDates: restDayLogs.map((r) => r.date),
        })
      }
      queryClient.invalidateQueries({ queryKey: ['workout-history'] })
      queryClient.invalidateQueries({ queryKey: ['workout-session-detail'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
  })
}

async function checkStrengthPR(ex: StrengthExercise, workoutDate: string) {
  try {
    if (!ex.weight_kg) return
    // Per-exercise PR: compare against the best record for THIS exercise
    // (keyed by the record's context column), not the all-time max across
    // every lift -- otherwise the first time any exercise exceeds your
    // global max would fire a bogus "New PR" for an unrelated movement,
    // and a brand-new exercise could never set its own baseline.
    const best = await gamificationService.getBestPersonalRecordForContext(ex.user_id, 'highest_weight', ex.exercise_name)
    if (!best || ex.weight_kg > best.value) {
      await gamificationService.recordPersonalRecord({
        user_id: ex.user_id,
        category: 'highest_weight',
        value: ex.weight_kg,
        unit: 'kg',
        context: ex.exercise_name,
        // Use the workout's own date, not today -- a backdated PR should
        // be recorded as achieved on the day it was actually performed.
        achieved_date: workoutDate,
        meta: {},
      })
      toast.success(`🏆 New PR! ${ex.exercise_name}: ${ex.weight_kg}kg`)
    }
  } catch {
    // Non-critical, ignore
  }
}

export function useExerciseHistory(exerciseName: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['exercise-history', user?.id, exerciseName],
    enabled: !!user && !!exerciseName,
    queryFn: () => workoutService.getStrengthHistoryForExercise(user!.id, exerciseName),
  })
}

export function useWorkoutTemplates() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['workout-templates', user?.id],
    enabled: !!user,
    queryFn: () => workoutService.getTemplates(user!.id),
  })
}

export function useTemplateExercises(templateId: string | null) {
  return useQuery({
    queryKey: ['template-exercises', templateId],
    enabled: !!templateId,
    queryFn: () => workoutService.getTemplateExercises(templateId!),
  })
}
