const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type Json = Record<string, any>;

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as any;
    if (typeof data?.detail === "string") return data.detail;
    // DRF validation errors can be object/array
    if (data && typeof data === "object") return JSON.stringify(data);
  } catch {
    // ignore
  }
  return `${res.status} ${res.statusText}`;
}

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

const TOKEN_KEY = "cpb_tokens";

export function setTokens(tokens: TokenPair) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function getTokens(): TokenPair | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return getTokens()?.access ?? null;
}

export async function register(payload: RegisterPayload): Promise<Json> {
  const res = await fetch(`${API_BASE_URL}/api/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as Json;
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res));

  const data = (await res.json()) as Partial<TokenPair>;
  if (!data.access || !data.refresh) {
    throw new Error("Login response did not include access/refresh tokens.");
  }

  const tokens: TokenPair = { access: data.access, refresh: data.refresh };
  setTokens(tokens);
  return tokens;
}