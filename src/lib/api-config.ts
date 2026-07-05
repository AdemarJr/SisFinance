export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const AUTH_TOKEN_KEY = 'sisfinance_auth_token';

export function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // storage indisponível
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

export async function apiJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const data = await response.json();
  if (!response.ok) {
    const message = (data as { error?: string })?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}
