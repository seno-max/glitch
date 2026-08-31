import { supabase } from '@/lib/supabase'
import type { AppNotification, NotificationType } from '@/types/database.types'

export const notificationService = {
  async getNotifications(userId: string, unreadOnly = false): Promise<AppNotification[]> {
    let q = supabase.from('notifications').select('*').eq('user_id', userId)
    if (unreadOnly) q = q.eq('is_read', false)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return (data ?? []) as unknown as AppNotification[]
  },

  async create(userId: string, type: NotificationType, title: string, body?: string, scheduledFor?: string): Promise<AppNotification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, body: body ?? null, scheduled_for: scheduledFor ?? null })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as AppNotification
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    if (error) throw error
  },
}
