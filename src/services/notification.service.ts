import { supabase } from '@/lib/supabase'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications'
import type { AppNotification, NotificationType } from '@/types/database.types'

/**
 * Shape of settings.reminder_times (jsonb): a per-reminder local "HH:mm"
 * delivery time. A reminder is scheduled only if its notif_* toggle is on
 * AND a time is set for it.
 */
export type ReminderTimes = {
  workout?: string
  water?: string
  food?: string
  weight?: string
  photo?: string
  challenge?: string
}

const REMINDER_DEFS: { key: keyof ReminderTimes; id: number; title: string; body: string; notifColumn: keyof ReminderSettings }[] = [
  { key: 'workout', id: 1, title: 'Workout time! 💪', body: "Time to hit the gym and log today's session.", notifColumn: 'notif_workout_reminder' },
  { key: 'water', id: 2, title: 'Stay hydrated 💧', body: "Don't forget to log your water intake.", notifColumn: 'notif_water_reminder' },
  { key: 'food', id: 3, title: 'Log your meals 🍽️', body: 'Keep your nutrition streak alive — log what you ate.', notifColumn: 'notif_food_reminder' },
  { key: 'weight', id: 4, title: 'Weight check-in ⚖️', body: "Hop on the scale and log today's weight.", notifColumn: 'notif_weight_reminder' },
  { key: 'photo', id: 5, title: 'Progress photo 📸', body: 'Snap a progress photo to track your transformation.', notifColumn: 'notif_photo_reminder' },
  { key: 'challenge', id: 6, title: 'Challenge update 🎯', body: "Check how far along your challenges are.", notifColumn: 'notif_challenge_reminder' },
]

/** The subset of the settings row that drives reminder scheduling. */
export interface ReminderSettings {
  reminder_times?: ReminderTimes | Record<string, string> | null
  notif_workout_reminder?: boolean
  notif_water_reminder?: boolean
  notif_food_reminder?: boolean
  notif_weight_reminder?: boolean
  notif_photo_reminder?: boolean
  notif_challenge_reminder?: boolean
}

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

  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase.from('notifications').select('id').eq('user_id', userId).eq('is_read', false)
    if (error) throw error
    return data?.length ?? 0
  },

  // ---------------------------------------------------------------------
  // Local notification scheduling (Android: @capacitor/local-notifications)
  // ---------------------------------------------------------------------
  /**
   * Requests POST_NOTIFICATIONS runtime permission (Android 13+). Silently
   * no-ops on web or if the permission is already granted.
   */
  async requestPermissionsIfNeeded(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
      const status = await LocalNotifications.checkPermissions()
      if (status.display !== 'granted') {
        await LocalNotifications.requestPermissions()
      }
    } catch {
      /* best-effort */
    }
  },

  /**
   * Re-schedules all daily reminder notifications to match the user's
   * current settings: cancels every pending notification, then schedules a
   * daily repeating local notification for each enabled notif_* toggle that
   * also has a reminder_time set. Called on app start and whenever
   * notification settings change.
   */
  async syncScheduledReminders(settings: ReminderSettings | null): Promise<void> {
    if (!Capacitor.isNativePlatform() || !settings) return
    try {
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications })
      }

      const times = (settings.reminder_times ?? {}) as ReminderTimes
      const toSchedule: ScheduleOptions['notifications'] = []

      for (const def of REMINDER_DEFS) {
        if (!settings[def.notifColumn]) continue
        const time = times[def.key]
        if (!time || !/^\d{1,2}:\d{2}$/.test(time)) continue
        const [hour, minute] = time.split(':').map(Number)
        if (hour > 23 || minute > 59) continue
        toSchedule.push({
          id: def.id,
          title: def.title,
          body: def.body,
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        })
      }

      if (toSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: toSchedule })
      }
    } catch {
      /* reminder scheduling is best-effort, never blocks the UI */
    }
  },
}
