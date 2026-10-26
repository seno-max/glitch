import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { trackingService } from '@/services/tracking.service'
import { workoutService } from '@/services/workout.service'
import { profileService } from '@/services/profile.service'
import { updateStreak, awardDailyPoints } from '@/services/scoring.engine'
import { gamificationService } from '@/services/gamification.service'
import { checkAndUnlockAchievements } from '@/services/achievements.engine'
import { updateChallengeProgressForUser } from '@/services/challenge-progress.engine'
import { todayStr, lastNDaysRange } from '@/utils/date'
import { compressImage } from '@/utils/image'
import { celebrate } from '@/utils/confetti'
import type { WeightLog, SleepLog, MoodLog, BodyMeasurement, PhotoAngle } from '@/types/database.types'
import toast from 'react-hot-toast'

// ---------------- Water ----------------
export function useWaterLogsForDate(date: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['water', user?.id, date],
    enabled: !!user && !!date,
    queryFn: () => trackingService.getWaterLogsByDate(user!.id, date),
  })
}

export function useSettings() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['settings', user?.id],
    enabled: !!user,
    queryFn: () => profileService.getSettings(user!.id),
  })
}

export function useAddWater() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, amountMl }: { date: string; amountMl: number }) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.addWaterLog(user.id, date, amountMl)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      if (user) {
        // Water can complete water_daily_goal challenges.
        try {
          const settings = await profileService.getSettings(user.id)
          await updateChallengeProgressForUser(user.id, settings)
        } catch {
          /* best-effort */
        }
      }
    },
  })
}

export function useWaterHistory(days = 7) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['water-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getWaterLogsInRange(user!.id, start, end),
  })
}

export function useDeleteWaterLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => trackingService.deleteWaterLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['water-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('Water entry deleted')
    },
  })
}

// ---------------- Daily reflection notes ----------------
export function useSaveDailyNote() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes: string }) => {
      if (!user) throw new Error('Not authenticated')
      const existing = await trackingService.getDailyRoutine(user.id, date)
      return trackingService.upsertDailyRoutine({
        user_id: user.id,
        date,
        wake_up_time: existing?.wake_up_time ?? null,
        sleep_time: existing?.sleep_time ?? null,
        notes,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      toast.success('Reflection saved')
    },
  })
}

// ---------------- Weight ----------------
// Weight logging is fully user-paced: log whenever you feel like checking
// in (no daily requirement). Whichever entry has the most recent date
// becomes "Current Weight" on the dashboard, regardless of gaps between logs.
export function useWeightHistory(days = 365) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['weight-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getWeightLogsInRange(user!.id, start, end),
  })
}

export function useLogWeight() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<WeightLog, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.upsertWeightLog({ ...payload, user_id: user.id })
    },
    onSuccess: async (log) => {
      queryClient.invalidateQueries({ queryKey: ['weight-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      if (user) {
        // Only update the dashboard's "current weight" if this log is the
        // most recent one on record (logging a backdated entry shouldn't
        // override a more recent current weight).
        const settings = await profileService.getSettings(user.id)
        const latest = await trackingService.getLatestWeightLog(user.id)
        if (!latest || log.date >= latest.date) {
          await profileService.updateProfile(user.id, { current_weight_kg: log.weight_kg })
        }

        // Check for weight PRs
        const lowest = await gamificationService.getBestPersonalRecord(user.id, 'lowest_weight')
        if (!lowest || log.weight_kg < lowest.value) {
          await gamificationService.recordPersonalRecord({
            user_id: user.id,
            category: 'lowest_weight',
            value: log.weight_kg,
            unit: 'kg',
            context: null,
            achieved_date: log.date,
            meta: {},
          })
        }
        await checkAndUnlockAchievements(user.id)
        await updateChallengeProgressForUser(user.id, settings)
      }
      celebrate()
      toast.success('Weight logged!')
    },
  })
}

export function useDeleteWeightLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => trackingService.deleteWeightLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('Weight entry deleted')
    },
  })
}

// ---------------- Steps ----------------
export function useStepsForDate(date: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['steps', user?.id, date],
    enabled: !!user && !!date,
    queryFn: () => trackingService.getStepLogByDate(user!.id, date),
  })
}

export function useStepsHistory(days = 30) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['steps-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getStepLogsInRange(user!.id, start, end),
  })
}

export function useLogSteps() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, steps }: { date: string; steps: number }) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.upsertStepLog(user.id, date, steps)
    },
    onSuccess: async (log) => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      if (user) {
        const settings = await profileService.getSettings(user.id)
        const stepGoal = settings?.step_goal ?? 10000
        if (log.steps >= stepGoal) {
          const allLogs = await trackingService.getStepLogsInRange(user.id, '2000-01-01', todayStr())
          const qualifyingDates = allLogs.filter((l) => l.steps >= stepGoal).map((l) => l.date)
          // Step streaks are STRICT: consecutive days where the step goal was
          // met. No rest-day bridging — if a day's goal isn't hit the streak
          // cuts and restarts the next time 10k (the goal) is reached again.
          await updateStreak(user.id, 'steps', qualifyingDates, { streakDays: 0, streakPoints: 0 })
        }
        if (log.date === todayStr()) {
          await awardDailyPoints(
            user.id,
            log.date,
            { steps: log.steps },
            { gymPoints: 0, stepsPoints: settings?.steps_points ?? 0, stepGoal }
          )
        }
        await checkAndUnlockAchievements(user.id)
        await updateChallengeProgressForUser(user.id, settings)
        if (log.steps >= stepGoal) {
          celebrate()
          toast.success(`Goal smashed! ${log.steps.toLocaleString()} steps 🎯`)
          return
        }
      }
      toast.success('Steps updated!')
    },
  })
}

// ---------------- Sleep ----------------
// Sleep is purely observational: log & monitor your sleep cycle, no
// mandatory nightly goal or points tied to it.
export function useSleepHistory(days = 30) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['sleep-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getSleepLogsInRange(user!.id, start, end),
  })
}

export function useLogSleep() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<SleepLog, 'id' | 'created_at' | 'updated_at' | 'hours_slept' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.upsertSleepLog({ ...payload, user_id: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      toast.success('Sleep logged!')
    },
  })
}

// ---------------- Mood ----------------
export function useMoodHistory(days = 30) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['mood-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getMoodLogsInRange(user!.id, start, end),
  })
}

export function useLogMood() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<MoodLog, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.upsertMoodLog({ ...payload, user_id: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Mood logged!')
    },
  })
}

// ---------------- Measurements ----------------
export function useMeasurementsHistory(days = 180) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['measurements-history', user?.id, start, end],
    enabled: !!user,
    queryFn: () => trackingService.getMeasurementsInRange(user!.id, start, end),
  })
}

export function useAddMeasurement() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<BodyMeasurement, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.addMeasurement({ ...payload, user_id: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements-history'] })
      toast.success('Measurements logged!')
    },
  })
}

// ---------------- Progress Photos ----------------
export function useProgressPhotos() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['progress-photos', user?.id],
    enabled: !!user,
    queryFn: () => trackingService.getProgressPhotos(user!.id),
  })
}

export function useUploadProgressPhoto() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, angle, file, weightKg }: { date: string; angle: PhotoAngle; file: File; weightKg?: number }) => {
      if (!user) throw new Error('Not authenticated')
      // Compress before upload so camera photos don't hit Storage as raw
      // multi-MB blobs (see utils/image.ts).
      const compressed = await compressImage(file)
      return trackingService.uploadProgressPhoto(user.id, date, angle, compressed, weightKg)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] })
      toast.success('Photo uploaded!')
    },
  })
}

export function useDeleteProgressPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) => trackingService.deleteProgressPhoto(id, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] })
      toast.success('Photo deleted')
    },
  })
}

// ---------------- Rest Days (per-date streak freeze) ----------------
export function useRestDayLogs() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['rest-day-logs', user?.id],
    enabled: !!user,
    queryFn: () => trackingService.getRestDayLogs(user!.id),
  })
}

/**
 * Toggles a specific calendar date as a frozen rest day ("I was unwell this
 * day — freeze the streak"). The gym streak is recomputed immediately so
 * marking/unmarking takes effect at once instead of waiting for the next
 * workout log.
 */
export function useToggleRestDay() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, freeze, note }: { date: string; freeze: boolean; note?: string }) => {
      if (!user) throw new Error('Not authenticated')
      if (freeze) {
        await trackingService.addRestDay(user.id, date, note)
      } else {
        await trackingService.deleteRestDay(user.id, date)
      }
      return { date, freeze }
    },
    onSuccess: async ({ date, freeze }) => {
      queryClient.invalidateQueries({ queryKey: ['rest-day-logs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      if (user) {
        // Recompute the gym streak with the updated freeze set so the
        // widget + dashboard reflect it immediately.
        const settings = await profileService.getSettings(user.id)
        const restDayLogs = await trackingService.getRestDayLogs(user.id)
        const sessions = await workoutService.getSessionsInRange(user.id, '2000-01-01', todayStr())
        const qualifying = sessions.filter((s) => s.is_completed).map((s) => s.date)
        await updateStreak(user.id, 'gym', qualifying, {
          streakDays: settings?.gym_streak_days ?? 5,
          streakPoints: 0,
          restDays: settings?.rest_days ?? [],
          frozenDates: restDayLogs.map((r) => r.date),
        })
        void date
      }
      toast.success(freeze ? 'Day frozen — your streak is safe' : 'Rest day removed')
    },
  })
}
