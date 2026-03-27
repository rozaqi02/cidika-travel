import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseUrl = rawSupabaseUrl
  ? /^https?:\/\//i.test(rawSupabaseUrl)
    ? rawSupabaseUrl
    : `https://${rawSupabaseUrl}.supabase.co`
  : "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase env. Check REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
