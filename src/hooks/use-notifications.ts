import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { notificationService } from '@/services/notification.service'

export function useNotifications(limit = 50) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    enabled: !!user,
    queryFn: () => notificationService.getNotifications(user!.id, false),
    staleTime: 15_000,
  })
}

export function useUnreadNotificationCount() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    enabled: !!user,
    queryFn: () => notificationService.getUnreadCount(user!.id),
    staleTime: 15_000,
  })
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Not authenticated')
      return notificationService.markAllRead(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}
