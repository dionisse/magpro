import { createClient } from '@supabase/supabase-js';

// PREVIEW: window.__MOCK__ n'est défini que par demo.html (aperçu local).
const mockConfig = (window as unknown as { __MOCK__?: { supabaseUrl: string; anonKey: string } }).__MOCK__;
const supabaseUrl = mockConfig?.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = mockConfig?.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
