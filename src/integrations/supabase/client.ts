import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    flowType: 'implicit',
    autoRefreshToken: true,
  },
})

// Alias: usa sempre supabase normale — le policy RLS gestiscono i permessi
export const supabaseAdmin = supabase
