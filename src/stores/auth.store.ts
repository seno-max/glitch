import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database.types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!error && data) {
      set({ profile: data as unknown as Profile })
    }
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, user: data.session?.user ?? null })
    if (data.session?.user) {
      await get().fetchProfile()
    }
    set({ isLoading: false, isInitialized: true })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })
  },

  signOut: async () => {
    // scope: 'local' only revokes *this* device's session/refresh token.
    // Supabase's default ('global') would sign the user out of every device
    // they're logged into, which is not what "remember me"/multi-device
    // login should do — each device's session must persist independently
    // until that specific device explicitly signs out.
    await supabase.auth.signOut({ scope: 'local' })
    set({ user: null, session: null, profile: null })
  },
}))
