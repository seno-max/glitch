import { supabase } from '@/lib/supabase'
import { getLevelForXp } from '@/types/models'
import type {
  PointsLedgerEntry,
  Streak,
  StreakCategory,
  UserAchievement,
  AchievementCatalogItem,
  PersonalRecord,
  PRCategory,
  Challenge,
} from '@/types/database.types'

export const gamificationService = {
  // ---------------- Points ----------------
  async addPoints(userId: string, date: string, points: number, reason: string, meta: Record<string, unknown> = {}): Promise<PointsLedgerEntry> {
    const { data, error } = await supabase
      .from('points_ledger')
      .insert({ user_id: userId, date, points, reason, meta })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as PointsLedgerEntry
  },

  async getPointsForDate(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase.from('points_ledger').select('points').eq('user_id', userId).eq('date', date)
    if (error) throw error
    return (data ?? []).reduce((sum: number, r: { points: number }) => sum + r.points, 0)
  },

  async hasPointsForReason(userId: string, date: string, reason: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('reason', reason)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return !!data
  },

  async getPointsInRange(userId: string, startDate: string, endDate: string): Promise<PointsLedgerEntry[]> {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data ?? []) as unknown as PointsLedgerEntry[]
  },

  /** All-time cumulative points earned by the user. */
  async getTotalPoints(userId: string): Promise<number> {
    const { data, error } = await supabase.from('points_ledger').select('points').eq('user_id', userId)
    if (error) throw error
    return (data ?? []).reduce((sum: number, r: { points: number }) => sum + r.points, 0)
  },

  // ---------------- XP (profile) ----------------
  async addXp(userId: string, xpDelta: number): Promise<{ xp: number; level: number }> {
    const { data: profile, error: fetchError } = await supabase.from('profiles').select('xp,level').eq('id', userId).single()
    if (fetchError) throw fetchError
    const newXp = (profile.xp as number) + xpDelta

    const { level } = getLevelForXp(newXp)

    const { error } = await supabase.from('profiles').update({ xp: newXp, level }).eq('id', userId)
    if (error) throw error
    return { xp: newXp, level }
  },

  // ---------------- Streaks ----------------
  async getStreaks(userId: string): Promise<Streak[]> {
    const { data, error } = await supabase.from('streaks').select('*').eq('user_id', userId)
    if (error) throw error
    return (data ?? []) as unknown as Streak[]
  },

  async getStreak(userId: string, category: StreakCategory): Promise<Streak | null> {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .maybeSingle()
    if (error) throw error
    return data as unknown as Streak | null
  },

  async upsertStreak(payload: Omit<Streak, 'id' | 'created_at' | 'updated_at'>): Promise<Streak> {
    const { data, error } = await supabase
      .from('streaks')
      .upsert(payload, { onConflict: 'user_id,category' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Streak
  },

  // ---------------- Achievements ----------------
  async getAchievementCatalog(): Promise<AchievementCatalogItem[]> {
    const { data, error } = await supabase.from('achievement_catalog').select('*')
    if (error) throw error
    return (data ?? []) as unknown as AchievementCatalogItem[]
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase.from('user_achievements').select('*').eq('user_id', userId)
    if (error) throw error
    return (data ?? []) as unknown as UserAchievement[]
  },

  async unlockAchievement(userId: string, code: string): Promise<UserAchievement | null> {
    const { data, error } = await supabase
      .from('user_achievements')
      .upsert({ user_id: userId, achievement_code: code, progress: 100 }, { onConflict: 'user_id,achievement_code', ignoreDuplicates: true })
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data as unknown as UserAchievement | null
  },

  // ---------------- Personal Records ----------------
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as PersonalRecord[]
  },

  async getBestPersonalRecord(userId: string, category: PRCategory): Promise<PersonalRecord | null> {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('value', { ascending: category === 'lowest_weight' })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as unknown as PersonalRecord | null
  },

  async recordPersonalRecord(payload: Omit<PersonalRecord, 'id' | 'created_at'>): Promise<PersonalRecord> {
    const { data, error } = await supabase.from('personal_records').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as PersonalRecord
  },

  // ---------------- Challenges ----------------
  async getChallenges(userId: string, activeOnly = false): Promise<Challenge[]> {
    let q = supabase.from('challenges').select('*').eq('user_id', userId)
    if (activeOnly) q = q.eq('is_completed', false)
    const { data, error } = await q.order('end_date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Challenge[]
  },

  async createChallenge(payload: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>): Promise<Challenge> {
    const { data, error } = await supabase.from('challenges').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as Challenge
  },

  async updateChallengeProgress(id: string, currentValue: number): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .update({ current_value: currentValue })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Challenge
  },

  async completeChallenge(id: string): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Challenge
  },

  async deleteChallenge(id: string): Promise<void> {
    const { error } = await supabase.from('challenges').delete().eq('id', id)
    if (error) throw error
  },
}
