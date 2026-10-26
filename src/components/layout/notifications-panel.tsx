import { Bell, CheckCheck } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

const TYPE_EMOJI: Record<string, string> = {
  workout_reminder: '💪',
  water_reminder: '💧',
  food_reminder: '🍽️',
  weight_reminder: '⚖️',
  photo_reminder: '📸',
  challenge_reminder: '🎯',
  achievement_unlocked: '🏆',
  streak_risk: '🔥',
  general: '✨',
}

/**
 * Notification center — lists everything the app has recorded for the user
 * (achievement unlocks, streak milestones, challenge completions, reminders)
 * with a real unread count driving the bell badge. "Mark all read" clears
 * the unread state server-side.
 */
export function NotificationsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: notifications, isLoading } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const markRead = useMarkNotificationRead()

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Notifications" className="max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="pb-4">
          <EmptyState icon={Bell} title="No notifications yet" description="Achievements, streak milestones and challenge completions will show up here." />
        </div>
      ) : (
        <div className="space-y-1 pb-4">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={cn(
                'w-full text-left flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                n.is_read ? 'opacity-60 hover:bg-muted' : 'bg-primary/5 hover:bg-primary/10'
              )}
            >
              <span className="text-lg leading-none mt-0.5">{TYPE_EMOJI[n.type] ?? '✨'}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{n.title}</span>
                  {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />}
                </span>
                {n.body && <span className="block text-xs text-muted-foreground mt-0.5">{n.body}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
