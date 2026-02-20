import React, { createContext, useContext, useMemo, useState } from "react";

type TokenPair = { access: string; refresh: string };

function readTokens(): TokenPair | null {
  const raw = localStorage.getItem("cpb_tokens");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TokenPair>;
    if (typeof parsed.access === "string" && typeof parsed.refresh === "string") {
      return { access: parsed.access, refresh: parsed.refresh };
    }
    return null;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  isAuthenticated: boolean;
  accessToken: string | null;
  syncFromStorage: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenPair | null>(() => readTokens());

  const value = useMemo<AuthContextValue>(() => {
    return {
      isAuthenticated: !!tokens?.access,
      accessToken: tokens?.access ?? null,
      syncFromStorage: () => setTokens(readTokens()),
      logout: () => {
        localStorage.removeItem("cpb_tokens");
        setTokens(null);
      },
    };
  }, [tokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}