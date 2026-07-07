import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a14] text-indigo-100">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold">
          Loading...
        </div>
      </div>
    );
  }
  if (!session || role !== "admin") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
