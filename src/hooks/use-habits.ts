import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { habitsService } from '@/services/habits.service'
import { checkInHabit } from '@/services/scoring.engine'
import { todayStr } from '@/utils/date'
import type { Habit } from '@/types/database.types'
import toast from 'react-hot-toast'

export function useHabits(activeOnly = true) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['habits', user?.id, activeOnly],
    enabled: !!user,
    queryFn: () => habitsService.getHabits(user!.id, activeOnly),
  })
}

export function useHabitCheckinsForDate(date: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['habit-checkins', user?.id, date],
    enabled: !!user && !!date,
    queryFn: () => habitsService.getCheckinsForDate(user!.id, date),
  })
}

export interface HabitFormInput {
  name: string
  icon: string
  target_count: number
  points: number | null
  color?: string | null
}

export function useCreateHabit() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: HabitFormInput) => {
      if (!user) throw new Error('Not authenticated')
      return habitsService.createHabit({ ...input, user_id: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Habit created!')
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Habit, 'name' | 'icon' | 'target_count' | 'points' | 'color' | 'sort_order' | 'is_active'>> }) =>
      habitsService.updateHabit(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Habit updated!')
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => habitsService.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Habit deleted')
    },
  })
}

/** Checks in a habit for today, awarding its (optional) points once the daily target is met. */
export function useCheckInHabit() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (habit: Habit) => {
      if (!user) throw new Error('Not authenticated')
      return checkInHabit(user.id, habit, todayStr())
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['habit-checkins'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
      if (result.pointsAwarded > 0) {
        toast.success(`+${result.pointsAwarded} points! 🎉`)
      }
    },
  })
}

/** Removes the most recent check-in for today (undo one check). */
export function useUncheckHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (habitId: string) => habitsService.removeLatestCheckin(habitId, todayStr()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['habit-checkins'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] })
      queryClient.invalidateQueries({ queryKey: ['day-activity-log'] })
    },
  })
}
