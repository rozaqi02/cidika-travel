import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("guest"); // 'guest' | 'user' | 'admin'
  const [loading, setLoading] = useState(true);

  async function fetchRole(userId) {
    if (!userId) { setRole("guest"); return; }
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (error) {
      // fallback aman: kalau profil belum ada, anggap 'user'
      setRole("user");
      return;
    }
    setRole(data?.role || "user");
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      await fetchRole(session?.user?.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      fetchRole(sess?.user?.id);
    });

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return (
    <AuthCtx.Provider value={{ session, role, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
