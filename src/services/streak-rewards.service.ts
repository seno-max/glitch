import { supabase } from '@/lib/supabase'
import type { StreakReward, StreakCategory } from '@/types/database.types'

/**
 * Fully user-defined streak rewards: no built-in "gym streak" / "step
 * streak" template — the user picks a name, category, day count, and
 * points value, and can create as many of these as they want.
 */
export const streakRewardsService = {
  async list(userId: string): Promise<StreakReward[]> {
    const { data, error } = await supabase
      .from('streak_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('streak_days', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as StreakReward[]
  },

  async listForCategory(userId: string, category: StreakCategory): Promise<StreakReward[]> {
    const { data, error } = await supabase
      .from('streak_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('streak_days', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as StreakReward[]
  },

  async create(payload: Omit<StreakReward, 'id' | 'created_at' | 'updated_at'>): Promise<StreakReward> {
    const { data, error } = await supabase.from('streak_rewards').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as StreakReward
  },

  async update(id: string, patch: Partial<Pick<StreakReward, 'name' | 'category' | 'streak_days' | 'points'>>): Promise<StreakReward> {
    const { data, error } = await supabase.from('streak_rewards').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as StreakReward
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('streak_rewards').delete().eq('id', id)
    if (error) throw error
  },
}
