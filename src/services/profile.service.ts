import { supabase } from '@/lib/supabase'
import type { Profile, Settings } from '@/types/database.types'

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) throw error
    return data as unknown as Profile
  },

  async updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Profile
  },

  async getSettings(userId: string): Promise<Settings | null> {
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw error
    if (data) return data as unknown as Settings

    // Auto-create a default settings row for users who signed up before the
    // auto-create trigger existed (or if the trigger failed). Without this,
    // every settings/dashboard query would error with "no rows".
    const { data: created, error: upsertError } = await supabase
      .from('settings')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
      .select('*')
      .single()
    if (upsertError) throw upsertError
    return created as unknown as Settings
  },

  async updateSettings(userId: string, patch: Partial<Settings>): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Settings
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },
}
