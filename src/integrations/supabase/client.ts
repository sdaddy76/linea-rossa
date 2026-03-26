import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Rileva automaticamente i token dall'URL dopo il redirect email
    detectSessionInUrl: true,
    // Persiste la sessione nel localStorage
    persistSession: true,
    // Usa pkce per flussi OAuth/magic link più sicuri
    flowType: 'pkce',
  },
})
