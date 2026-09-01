import { supabase } from '@/lib/supabase'
import type { Habit, HabitCheckin } from '@/types/database.types'

export const habitsService = {
  async getHabits(userId: string, activeOnly = true): Promise<Habit[]> {
    let q = supabase.from('habits').select('*').eq('user_id', userId)
    if (activeOnly) q = q.eq('is_active', true)
    const { data, error } = await q.order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Habit[]
  },

  async createHabit(payload: {
    user_id: string
    name: string
    icon: string
    target_count: number
    points: number | null
    color?: string | null
    sort_order?: number
  }): Promise<Habit> {
    const { data, error } = await supabase.from('habits').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as Habit
  },

  async updateHabit(id: string, patch: Partial<Pick<Habit, 'name' | 'icon' | 'target_count' | 'points' | 'color' | 'sort_order' | 'is_active'>>): Promise<Habit> {
    const { data, error } = await supabase.from('habits').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as Habit
  },

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw error
  },

  async getCheckinsForDate(userId: string, date: string): Promise<HabitCheckin[]> {
    const { data, error } = await supabase.from('habit_checkins').select('*').eq('user_id', userId).eq('date', date)
    if (error) throw error
    return (data ?? []) as unknown as HabitCheckin[]
  },

  async getCheckinsInRange(userId: string, startDate: string, endDate: string): Promise<HabitCheckin[]> {
    const { data, error } = await supabase
      .from('habit_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data ?? []) as unknown as HabitCheckin[]
  },

  async addCheckin(habitId: string, userId: string, date: string): Promise<HabitCheckin> {
    const { data, error } = await supabase
      .from('habit_checkins')
      .insert({ habit_id: habitId, user_id: userId, date })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as HabitCheckin
  },

  /** Removes the most recently added checkin for this habit/date (used to "undo" one check). */
  async removeLatestCheckin(habitId: string, date: string): Promise<void> {
    const { data, error } = await supabase
      .from('habit_checkins')
      .select('id')
      .eq('habit_id', habitId)
      .eq('date', date)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (data) {
      const { error: delError } = await supabase.from('habit_checkins').delete().eq('id', data.id)
      if (delError) throw delError
    }
  },
}
