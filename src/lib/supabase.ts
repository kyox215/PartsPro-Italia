import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const useSupabaseDataEnv = import.meta.env.VITE_USE_SUPABASE_DATA

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
export const shouldUseSupabaseData =
  hasSupabaseConfig && String(useSupabaseDataEnv || 'true').toLowerCase() !== 'false'

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
