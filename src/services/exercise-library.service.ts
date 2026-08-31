import { supabase } from '@/lib/supabase'
import type { ExerciseLibraryItem } from '@/types/database.types'

export const exerciseLibraryService = {
  async search(query: string, filters?: { muscle?: string; equipment?: string; category?: string }): Promise<ExerciseLibraryItem[]> {
    let q = supabase.from('exercise_library').select('*')
    if (query) q = q.ilike('name', `%${query}%`)
    if (filters?.muscle) q = q.eq('target_muscle', filters.muscle)
    if (filters?.equipment) q = q.eq('equipment', filters.equipment)
    if (filters?.category) q = q.eq('category', filters.category)
    const { data, error } = await q.order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as ExerciseLibraryItem[]
  },

  async getAll(): Promise<ExerciseLibraryItem[]> {
    const { data, error } = await supabase.from('exercise_library').select('*').order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as ExerciseLibraryItem[]
  },

  async createCustom(
    userId: string,
    payload: Omit<ExerciseLibraryItem, 'id' | 'created_at' | 'updated_at' | 'is_custom' | 'created_by'>
  ): Promise<ExerciseLibraryItem> {
    const { data, error } = await supabase
      .from('exercise_library')
      .insert({ ...payload, is_custom: true, created_by: userId })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as ExerciseLibraryItem
  },
}
