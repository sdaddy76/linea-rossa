import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Non tentare di estrarre session dall'URL automaticamente:
    // lo gestiamo manualmente nella pagina auth per evitare AbortError
    detectSessionInUrl: false,
    persistSession: true,
    flowType: 'implicit',
    // Disabilita il refresh automatico che può generare AbortError su SPA
    autoRefreshToken: true,
  },
})
