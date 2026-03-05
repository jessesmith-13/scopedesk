import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "./types.ts";

export const createSupabaseAdmin = () => {
  return createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};