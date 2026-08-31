import { supabase } from '@/lib/supabase'
import type { Food, Meal, MealTemplate, MealType } from '@/types/database.types'

export const nutritionService = {
  // Foods
  async searchFoods(userId: string, query: string): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .ilike('name', `%${query}%`)
      .order('is_favorite', { ascending: false })
      .limit(30)
    if (error) throw error
    return (data ?? []) as unknown as Food[]
  },

  async getFavoriteFoods(userId: string): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Food[]
  },

  async createFood(payload: Omit<Food, 'id' | 'created_at' | 'updated_at'>): Promise<Food> {
    const { data, error } = await supabase.from('foods').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as Food
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase.from('foods').update({ is_favorite: isFavorite }).eq('id', id)
    if (error) throw error
  },

  // Meals
  async getMealsByDate(userId: string, date: string): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('logged_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as Meal[]
  },

  async getMealsInRange(userId: string, startDate: string, endDate: string): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data ?? []) as unknown as Meal[]
  },

  async addMeal(payload: Omit<Meal, 'id' | 'created_at' | 'updated_at'>): Promise<Meal> {
    const { data, error } = await supabase.from('meals').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as Meal
  },

  async updateMeal(id: string, patch: Partial<Meal>): Promise<Meal> {
    const { data, error } = await supabase.from('meals').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return data as unknown as Meal
  },

  async deleteMeal(id: string): Promise<void> {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (error) throw error
  },

  // Meal templates
  async getMealTemplates(userId: string, mealType?: MealType): Promise<MealTemplate[]> {
    let q = supabase.from('meal_templates').select('*').eq('user_id', userId)
    if (mealType) q = q.eq('meal_type', mealType)
    const { data, error } = await q.order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as MealTemplate[]
  },

  async createMealTemplate(payload: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<MealTemplate> {
    const { data, error } = await supabase.from('meal_templates').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as MealTemplate
  },

  async deleteMealTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('meal_templates').delete().eq('id', id)
    if (error) throw error
  },
}
