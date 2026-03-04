import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// These would normally come from environment variables
// For now, using placeholders until Supabase is connected
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';
};

// Helper to get current user ID
// TODO: Replace with actual auth once implemented
export const getCurrentUserId = async (): Promise<string> => {
  if (!isSupabaseConfigured()) {
    return 'mock-user-id';
  }
  
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }
  
  return data.user.id;
};