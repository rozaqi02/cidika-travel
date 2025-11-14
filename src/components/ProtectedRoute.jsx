import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container pt-16">Loading...</div>;
  }
  if (!session || role !== "admin") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
