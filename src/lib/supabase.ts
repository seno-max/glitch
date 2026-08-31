import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
      'Copy .env.example to .env.local and fill in your Supabase project credentials.'
  )
}

// NOTE: We intentionally do not parameterize the client with generated
// Database types here. The service layer (src/services/*.service.ts)
// provides strong typing at each call-site via explicit return types, while
// src/types/database.types.ts remains the single source of truth for shapes.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
