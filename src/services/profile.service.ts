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
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).single()
    if (error) throw error
    return data as unknown as Settings
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
