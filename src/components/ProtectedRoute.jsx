import React from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedRoute({ children }) {
  const session = supabase.auth.getSession
    ? null /* async in v2, so we guard inside pages for real fetch */
    : null;
  // Simple optimistic guard, real check is done in pages via onAuthStateChange
  // This prevents flashing on first render in static hosting.
  const token = localStorage.getItem("sb:token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}