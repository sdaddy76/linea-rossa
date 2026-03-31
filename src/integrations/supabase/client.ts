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

// Client admin con service_role — bypassa RLS per operazioni critiche
// (es. DELETE su game_players quando la policy RLS lo blocca)
export const supabaseAdmin = createClient(
  'https://zgatqhrafaorexqrftcv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYXRxaHJhZmFvcmV4cXJmdGN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4MTYyOCwiZXhwIjoyMDkwMDU3NjI4fQ.nZpJCNpJcxFOvFwsOpvQSFOmRZC5k78rNqsPp-NRQZY'
)
