import { createClient } from "@supabase/supabase-js";

// CRA: gunakan REACT_APP_*
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Biar kelihatan jelas di console ketika env salah
  // eslint-disable-next-line no-console
  console.error("Missing Supabase env. Check REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
