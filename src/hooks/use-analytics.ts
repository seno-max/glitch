import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { analyticsService } from '@/services/analytics.service'
import { gamificationService } from '@/services/gamification.service'
import { lastNDaysRange } from '@/utils/date'

export function useAnalyticsSummary(days = 30) {
  const { user } = useAuthStore()
  const { start, end } = lastNDaysRange(days)
  return useQuery({
    queryKey: ['analytics-summary', user?.id, start, end],
    enabled: !!user,
    queryFn: () => analyticsService.getSummary(user!.id, start, end),
  })
}

export function useAchievements() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['achievements', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [catalog, unlocked] = await Promise.all([
        gamificationService.getAchievementCatalog(),
        gamificationService.getUserAchievements(user!.id),
      ])
      const unlockedCodes = new Set(unlocked.map((u) => u.achievement_code))
      return catalog.map((c) => ({ ...c, unlocked: unlockedCodes.has(c.code), unlockedAt: unlocked.find((u) => u.achievement_code === c.code)?.unlocked_at }))
    },
  })
}

export function useChallenges(activeOnly = false) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['challenges', user?.id, activeOnly],
    enabled: !!user,
    queryFn: () => gamificationService.getChallenges(user!.id, activeOnly),
  })
}

export function usePersonalRecords() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['personal-records', user?.id],
    enabled: !!user,
    queryFn: () => gamificationService.getPersonalRecords(user!.id),
  })
}
