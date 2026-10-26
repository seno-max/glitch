import { supabase } from '@/lib/supabase'
import { Capacitor } from '@capacitor/core'

/**
 * The deep-link scheme registered in the Android manifest's VIEW intent
 * filter. Password-reset and email-confirmation emails redirect to this
 * scheme on native so the link opens the app (handled by the appUrlOpen
 * listener in App.tsx) instead of a dead browser page.
 */
export const APP_SCHEME = 'fittrack'

/** The redirect URL for auth emails, per platform. */
export function authRedirectUrl(path: string): string {
  if (Capacitor.isNativePlatform()) return `${APP_SCHEME}://${path.replace(/^\//, '')}`
  return `${window.location.origin}${path}`
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // On native, the confirmation link opens the app via the deep-link
        // scheme; on web it returns to the deployed site (root).
        emailRedirectTo: authRedirectUrl('/'),
      },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    // Local scope: only sign out this device, not every device the user is
    // logged into (see auth.store.ts for rationale).
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
  },

  async resetPasswordForEmail(email: string, redirectTo: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}
