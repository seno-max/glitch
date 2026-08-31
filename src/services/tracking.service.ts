import { supabase } from '@/lib/supabase'
import type {
  WaterLog,
  WeightLog,
  BodyMeasurement,
  ProgressPhoto,
  SleepLog,
  MoodLog,
  StepLog,
  DailyRoutine,
  PhotoAngle,
} from '@/types/database.types'

export const trackingService = {
  // ---------------- Water ----------------
  async getWaterLogsByDate(userId: string, date: string): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('logged_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as WaterLog[]
  },

  async addWaterLog(userId: string, date: string, amountMl: number): Promise<WaterLog> {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, date, amount_ml: amountMl })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as WaterLog
  },

  async deleteWaterLog(id: string): Promise<void> {
    const { error } = await supabase.from('water_logs').delete().eq('id', id)
    if (error) throw error
  },

  async getWaterLogsInRange(userId: string, startDate: string, endDate: string): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return (data ?? []) as unknown as WaterLog[]
  },

  // ---------------- Weight ----------------
  async getWeightLogByDate(userId: string, date: string): Promise<WeightLog | null> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as unknown as WeightLog | null
  },

  async getWeightLogsInRange(userId: string, startDate: string, endDate: string): Promise<WeightLog[]> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as WeightLog[]
  },

  async getLatestWeightLog(userId: string): Promise<WeightLog | null> {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as unknown as WeightLog | null
  },

  async upsertWeightLog(payload: Omit<WeightLog, 'id' | 'created_at' | 'updated_at'>): Promise<WeightLog> {
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as WeightLog
  },

  async deleteWeightLog(id: string): Promise<void> {
    const { error } = await supabase.from('weight_logs').delete().eq('id', id)
    if (error) throw error
  },

  // ---------------- Body Measurements ----------------
  async getMeasurementsInRange(userId: string, startDate: string, endDate: string): Promise<BodyMeasurement[]> {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as BodyMeasurement[]
  },

  async addMeasurement(payload: Omit<BodyMeasurement, 'id' | 'created_at' | 'updated_at'>): Promise<BodyMeasurement> {
    const { data, error } = await supabase.from('body_measurements').insert(payload).select('*').single()
    if (error) throw error
    return data as unknown as BodyMeasurement
  },

  // ---------------- Progress Photos ----------------
  async uploadProgressPhoto(userId: string, date: string, angle: PhotoAngle, file: File, weightKg?: number): Promise<ProgressPhoto> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${date}-${angle}.${ext}`
    const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('progress_photos')
      .insert({ user_id: userId, date, angle, storage_path: path, weight_kg: weightKg ?? null })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as ProgressPhoto
  },

  async getProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as ProgressPhoto[]
  },

  async getProgressPhotoUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from('progress-photos').createSignedUrl(path, 3600)
    if (error) throw error
    return data.signedUrl
  },

  async deleteProgressPhoto(id: string, path: string): Promise<void> {
    await supabase.storage.from('progress-photos').remove([path])
    const { error } = await supabase.from('progress_photos').delete().eq('id', id)
    if (error) throw error
  },

  // ---------------- Sleep ----------------
  async getSleepLogByDate(userId: string, date: string): Promise<SleepLog | null> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as unknown as SleepLog | null
  },

  async getSleepLogsInRange(userId: string, startDate: string, endDate: string): Promise<SleepLog[]> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as SleepLog[]
  },

  async upsertSleepLog(payload: Omit<SleepLog, 'id' | 'created_at' | 'updated_at' | 'hours_slept'>): Promise<SleepLog> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as SleepLog
  },

  // ---------------- Mood ----------------
  async getMoodLogByDate(userId: string, date: string): Promise<MoodLog | null> {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as unknown as MoodLog | null
  },

  async getMoodLogsInRange(userId: string, startDate: string, endDate: string): Promise<MoodLog[]> {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as MoodLog[]
  },

  async upsertMoodLog(payload: Omit<MoodLog, 'id' | 'created_at' | 'updated_at'>): Promise<MoodLog> {
    const { data, error } = await supabase
      .from('mood_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as MoodLog
  },

  // ---------------- Steps ----------------
  async getStepLogByDate(userId: string, date: string): Promise<StepLog | null> {
    const { data, error } = await supabase
      .from('step_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as unknown as StepLog | null
  },

  async getStepLogsInRange(userId: string, startDate: string, endDate: string): Promise<StepLog[]> {
    const { data, error } = await supabase
      .from('step_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as StepLog[]
  },

  async upsertStepLog(userId: string, date: string, steps: number, source = 'manual'): Promise<StepLog> {
    const { data, error } = await supabase
      .from('step_logs')
      .upsert({ user_id: userId, date, steps, source }, { onConflict: 'user_id,date' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as StepLog
  },

  // ---------------- Daily Routine ----------------
  async getDailyRoutine(userId: string, date: string): Promise<DailyRoutine | null> {
    const { data, error } = await supabase
      .from('daily_routines')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data as unknown as DailyRoutine | null
  },

  async upsertDailyRoutine(payload: Omit<DailyRoutine, 'id' | 'created_at' | 'updated_at'>): Promise<DailyRoutine> {
    const { data, error } = await supabase
      .from('daily_routines')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as DailyRoutine
  },
}
