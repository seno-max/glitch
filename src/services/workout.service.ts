import { supabase } from '@/lib/supabase'
import type {
  WorkoutSession,
  StrengthExercise,
  CardioSession,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  WorkoutType,
} from '@/types/database.types'

export const workoutService = {
  // ---------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------
  /**
   * Creates a fully-specified workout session from manual gym-log style
   * entry: a date plus explicit entry/exit timestamps. Duration is
   * auto-calculated server-side by the calc_workout_duration trigger.
   */
  async createSession(payload: {
    userId: string
    date: string
    gymEntryTime: string
    gymExitTime: string
    workoutTypes: WorkoutType[]
    title?: string | null
  }): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: payload.userId,
        date: payload.date,
        gym_entry_time: payload.gymEntryTime,
        gym_exit_time: payload.gymExitTime,
        workout_types: payload.workoutTypes,
        title: payload.title ?? null,
        is_completed: true,
      })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as WorkoutSession
  },

  async getSessionById(sessionId: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase.from('workout_sessions').select('*').eq('id', sessionId).maybeSingle()
    if (error) throw error
    return data as unknown as WorkoutSession | null
  },

  async updateSessionTimes(sessionId: string, patch: { date?: string; gymEntryTime?: string; gymExitTime?: string; workoutTypes?: WorkoutType[]; title?: string | null }): Promise<WorkoutSession> {
    const updatePayload: Record<string, unknown> = {}
    if (patch.date !== undefined) updatePayload.date = patch.date
    if (patch.gymEntryTime !== undefined) updatePayload.gym_entry_time = patch.gymEntryTime
    if (patch.gymExitTime !== undefined) updatePayload.gym_exit_time = patch.gymExitTime
    if (patch.workoutTypes !== undefined) updatePayload.workout_types = patch.workoutTypes
    if (patch.title !== undefined) updatePayload.title = patch.title
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updatePayload)
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as WorkoutSession
  },

  async getSessionsByDate(userId: string, date: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('gym_entry_time', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as WorkoutSession[]
  },

  async getSessionsInRange(userId: string, startDate: string, endDate: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as WorkoutSession[]
  },

  async updateSession(sessionId: string, patch: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(patch)
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as WorkoutSession
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    if (error) throw error
  },

  // ---------------------------------------------------------------------
  // Strength exercises
  // ---------------------------------------------------------------------
  async addStrengthExercise(
    payload: Omit<StrengthExercise, 'id' | 'created_at' | 'updated_at' | 'volume_kg'>
  ): Promise<StrengthExercise> {
    const { data, error } = await supabase.from('strength_exercises').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as StrengthExercise
  },

  async getStrengthExercisesBySession(sessionId: string): Promise<StrengthExercise[]> {
    const { data, error } = await supabase
      .from('strength_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as StrengthExercise[]
  },

  async getStrengthHistoryForExercise(userId: string, exerciseName: string): Promise<StrengthExercise[]> {
    const { data, error } = await supabase
      .from('strength_exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('performed_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as StrengthExercise[]
  },

  async updateStrengthExercise(id: string, patch: Partial<StrengthExercise>): Promise<StrengthExercise> {
    const { data, error } = await supabase
      .from('strength_exercises')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as StrengthExercise
  },

  async deleteStrengthExercise(id: string): Promise<void> {
    const { error } = await supabase.from('strength_exercises').delete().eq('id', id)
    if (error) throw error
  },

  // ---------------------------------------------------------------------
  // Cardio sessions
  // ---------------------------------------------------------------------
  async addCardioSession(
    payload: Omit<CardioSession, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CardioSession> {
    const { data, error } = await supabase.from('cardio_sessions').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as CardioSession
  },

  async getCardioSessionsBySession(sessionId: string): Promise<CardioSession[]> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as CardioSession[]
  },

  async getCardioSessionsInRange(userId: string, startDate: string, endDate: string): Promise<CardioSession[]> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('performed_at', startDate)
      .lte('performed_at', endDate)
      .order('performed_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as CardioSession[]
  },

  async updateCardioSession(id: string, patch: Partial<CardioSession>): Promise<CardioSession> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as CardioSession
  },

  async deleteCardioSession(id: string): Promise<void> {
    const { error } = await supabase.from('cardio_sessions').delete().eq('id', id)
    if (error) throw error
  },

  // ---------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------
  async getTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as WorkoutTemplate[]
  },

  async createTemplate(
    payload: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'>,
    exercises: Omit<WorkoutTemplateExercise, 'id' | 'template_id' | 'created_at'>[]
  ): Promise<WorkoutTemplate> {
    const { data: template, error } = await supabase
      .from('workout_templates')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    const t = template as unknown as WorkoutTemplate

    if (exercises.length) {
      const { error: exError } = await supabase
        .from('workout_template_exercises')
        .insert(exercises.map((e) => ({ ...e, template_id: t.id })))
      if (exError) throw exError
    }
    return t
  },

  async getTemplateExercises(templateId: string): Promise<WorkoutTemplateExercise[]> {
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as WorkoutTemplateExercise[]
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('workout_templates').delete().eq('id', id)
    if (error) throw error
  },
}
