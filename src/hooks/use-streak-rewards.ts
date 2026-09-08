import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { streakRewardsService } from '@/services/streak-rewards.service'
import type { StreakCategory, StreakReward } from '@/types/database.types'
import toast from 'react-hot-toast'

export function useStreakRewards() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['streak-rewards', user?.id],
    enabled: !!user,
    queryFn: () => streakRewardsService.list(user!.id),
  })
}

export interface StreakRewardFormInput {
  name: string
  category: StreakCategory
  streak_days: number
  points: number
}

export function useCreateStreakReward() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StreakRewardFormInput) => {
      if (!user) throw new Error('Not authenticated')
      return streakRewardsService.create({ ...input, user_id: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak-rewards'] })
      toast.success('Streak reward created!')
    },
  })
}

export function useUpdateStreakReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<StreakReward, 'name' | 'category' | 'streak_days' | 'points'>> }) =>
      streakRewardsService.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak-rewards'] })
      toast.success('Streak reward updated!')
    },
  })
}

export function useDeleteStreakReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => streakRewardsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak-rewards'] })
      toast.success('Streak reward deleted')
    },
  })
}
