import { supabase } from '@/lib/supabase'
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

  /** Removes a single ledger entry (used to revoke points when the underlying activity is deleted). */
  async removePointsLedgerEntry(id: string): Promise<void> {
    const { error } = await supabase.from('points_ledger').delete().eq('id', id)
    if (error) throw error
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
  /**
   * Atomically increments XP via the add_xp_atomic Postgres RPC. The old
   * client-side read-modify-write could silently lose XP when two concurrent
   * awards (e.g. a workout save + a habit check-in) both read the same
   * starting value; the RPC's UPDATE takes a row lock so concurrent calls
   * serialize and every delta lands. The RPC identifies the caller by
   * auth.uid(), so _userId is accepted for API compatibility only.
   */
  async addXp(_userId: string, xpDelta: number): Promise<{ xp: number; level: number }> {
    const { data, error } = await supabase.rpc('add_xp_atomic', { p_xp_delta: Math.round(xpDelta) })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : (data as { xp: number; level: number } | null)
    if (!row) throw new Error('add_xp_atomic returned no row')
    return { xp: Number(row.xp), level: Number(row.level) }
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

  /**
   * Best record within a category for a specific context (e.g. an exercise
   * name for 'highest_weight'). Per-exercise PRs are keyed by the `context`
   * column so a deadlift PR never fires because you benched more, and a new
   * exercise always starts its own PR history from scratch.
   */
  async getBestPersonalRecordForContext(userId: string, category: PRCategory, context: string): Promise<PersonalRecord | null> {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('context', context)
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
