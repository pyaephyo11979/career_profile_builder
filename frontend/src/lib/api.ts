const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "cpb_tokens";
const REQUEST_TIMEOUT_MS = 15000;

type JsonObject = Record<string, unknown>;

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: number;
  username: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

export type ResumeHealth = {
  score?: number;
  strengths?: string[];
  warnings?: string[];
  suggestions?: string[];
};

export type ParsedContact = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  links?: Record<string, string | string[] | null>;
};

export type ParsedSkillGroups = {
  categories?: Record<string, string[]>;
  confidence?: number;
};

export type ParsedExperience = {
  title?: string;
  company?: string;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  highlights?: string[];
};

export type ParsedProject = {
  name?: string;
  summary?: string;
  highlights?: string[];
  tech_stack?: string[];
  links?: string[];
};

export type ParsedEducation = {
  school?: string;
  degree?: string;
  field?: string | null;
  start_year?: string;
  end_year?: string;
};

export type ParsedResumeData = {
  contact?: ParsedContact;
  skills?: ParsedSkillGroups;
  experience?: ParsedExperience[];
  projects?: ParsedProject[];
  education?: ParsedEducation[];
  confidence?: Record<string, number>;
  sections_found?: string[];
};

export type ResumeRecord = {
  id: number;
  file_name: string;
  raw_text: string;
  parsed_data: ParsedResumeData;
  resume_health: ResumeHealth;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  profile_exports?: JsonObject;
};

export type LinkedinProfileExport = {
  name?: string;
  headline?: string;
  about?: string;
  experience?: unknown[];
  projects?: unknown[];
  education?: unknown[];
  skills?: string[];
};

export type ResumeProfileExports = {
  github_readme?: string;
  linkedin_profile?: LinkedinProfileExport;
};

export type ResumeExportsResponse = {
  resume_id: number;
  profile_exports: ResumeProfileExports;
};

export type ParseResumeResponse = ParsedResumeData & {
  resume_id: number;
  raw_text: string;
  resume_health?: ResumeHealth;
  profile_exports?: JsonObject;
};

function readTokensFromStorage(): TokenPair | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<TokenPair>;
    if (typeof parsed.access !== "string" || typeof parsed.refresh !== "string") {
      return null;
    }
    return { access: parsed.access, refresh: parsed.refresh };
  } catch {
    return null;
  }
}

export function setTokens(tokens: TokenPair) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function getTokens(): TokenPair | null {
  return readTokensFromStorage();
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return getTokens()?.access ?? null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== "number") return true;

  // Small skew to avoid sending requests with a token about to expire.
  return Date.now() >= exp * 1000 - 10000;
}

export function getAccessTokenUsername(): string | null {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  const payload = parseJwtPayload(accessToken);
  if (!payload) return null;

  const username = payload.username;
  return typeof username === "string" ? username : null;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as unknown;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") return detail;
    }
    if (data && typeof data === "object") return JSON.stringify(data);
  } catch {
    // ignore non-json errors
  }
  return `${res.status} ${res.statusText}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const current = getTokens();
  if (!current?.refresh) return null;

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: current.refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const payload = (await res.json()) as Partial<TokenPair>;
  if (typeof payload.access !== "string") {
    clearTokens();
    return null;
  }

  const nextTokens: TokenPair = {
    access: payload.access,
    refresh: typeof payload.refresh === "string" ? payload.refresh : current.refresh,
  };

  setTokens(nextTokens);
  return nextTokens.access;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit | null;
};

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  authRequired = false,
  canRetry = true
): Promise<T> {
  const abortController = new AbortController();
  const timeout = window.setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authRequired) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ?? null,
      signal: abortController.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 401 && authRequired && canRetry) {
    const nextAccessToken = await refreshAccessToken();
    if (!nextAccessToken) {
      throw new Error("Session expired. Please login again.");
    }
    return apiRequest<T>(path, options, authRequired, false);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/api/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const data = await apiRequest<Partial<TokenPair>>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data.access || !data.refresh) {
    throw new Error("Login response did not include access/refresh tokens.");
  }

  const tokens: TokenPair = { access: data.access, refresh: data.refresh };
  setTokens(tokens);
  return tokens;
}

export async function uploadResume(file: File): Promise<ParseResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ParseResumeResponse>("/api/parse-resume/", {
    method: "POST",
    body: formData,
  }, true);
}

export async function getResumeById(id: string | number): Promise<ResumeRecord> {
  return apiRequest<ResumeRecord>(`/api/resumes/${id}/`, { method: "GET" }, true);
}

export async function getResumes(): Promise<ResumeRecord[]> {
  return apiRequest<ResumeRecord[]>("/api/resumes/", { method: "GET" }, true);
}

export async function getResumeExports(id: string | number): Promise<ResumeExportsResponse> {
  return apiRequest<ResumeExportsResponse>(`/api/resumes/${id}/exports/`, { method: "GET" }, true);
}
