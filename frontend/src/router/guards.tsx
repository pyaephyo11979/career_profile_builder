import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // As requested: if someone tries to access a protected route, send them home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    // If an already-logged-in user tries to visit /login or /register
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
