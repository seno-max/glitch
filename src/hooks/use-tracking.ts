import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { trackingService } from '@/services/tracking.service'
import { profileService } from '@/services/profile.service'
import { updateStreak, awardDailyPoints } from '@/services/scoring.engine'
import { gamificationService } from '@/services/gamification.service'
import { todayStr, lastNDaysRange } from '@/utils/date'
import type { WeightLog, SleepLog, MoodLog, BodyMeasurement, PhotoAngle } from '@/types/database.types'
import toast from 'react-hot-toast'

// ---------------- Water ----------------
export function useWaterToday() {
  const { user } = useAuthStore()
  const date = todayStr()
  return useQuery({
    queryKey: ['water', user?.id, date],
    enabled: !!user,
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
    mutationFn: (amountMl: number) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.addWaterLog(user.id, todayStr(), amountMl)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      if (user) {
        // Only update the dashboard's "current weight" if this log is the
        // most recent one on record (logging a backdated entry shouldn't
        // override a more recent current weight).
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
      }
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
      toast.success('Weight entry deleted')
    },
  })
}

// ---------------- Steps ----------------
export function useStepsToday() {
  const { user } = useAuthStore()
  const date = todayStr()
  return useQuery({
    queryKey: ['steps', user?.id, date],
    enabled: !!user,
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
    mutationFn: (steps: number) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.upsertStepLog(user.id, todayStr(), steps)
    },
    onSuccess: async (log) => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (user) {
        const settings = await profileService.getSettings(user.id)
        const stepGoal = settings?.step_goal ?? 10000
        if (log.steps >= stepGoal) {
          await updateStreak(user.id, 'steps', log.date)
        }
        if (log.date === todayStr()) {
          await awardDailyPoints(
            user.id,
            log.date,
            { steps: log.steps },
            { gymPoints: 0, stepsPoints: settings?.steps_points ?? 0, stepGoal }
          )
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
    mutationFn: ({ date, angle, file, weightKg }: { date: string; angle: PhotoAngle; file: File; weightKg?: number }) => {
      if (!user) throw new Error('Not authenticated')
      return trackingService.uploadProgressPhoto(user.id, date, angle, file, weightKg)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] })
      toast.success('Photo uploaded!')
    },
  })
}
