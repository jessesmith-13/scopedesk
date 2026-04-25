import { createClient } from '@supabase/supabase-js'

export const createSupabaseAdmin = () => {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // IMPORTANT: no <Database> generic here (prevents "never" inference)
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
