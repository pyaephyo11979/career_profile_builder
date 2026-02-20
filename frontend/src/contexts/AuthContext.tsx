import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearTokens, getTokens, isAccessTokenExpired, type TokenPair } from "../lib/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  accessToken: string | null;
  syncFromStorage: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<TokenPair | null>(() => {
    const current = getTokens();
    if (!current?.access) return null;
    if (isAccessTokenExpired(current.access)) {
      clearTokens();
      return null;
    }
    return current;
  });

  const value = useMemo<AuthContextValue>(() => {
    return {
      isAuthenticated: !!tokens?.access && !isAccessTokenExpired(tokens.access),
      accessToken: tokens?.access ?? null,
      syncFromStorage: () => {
        const current = getTokens();
        if (!current?.access || isAccessTokenExpired(current.access)) {
          clearTokens();
          setTokens(null);
          return;
        }
        setTokens(current);
      },
      logout: () => {
        clearTokens();
        setTokens(null);
      },
    };
  }, [tokens]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "cpb_tokens") return;
      const current = getTokens();
      if (!current?.access || isAccessTokenExpired(current.access)) {
        setTokens(null);
        return;
      }
      setTokens(current);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
