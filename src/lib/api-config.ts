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

const BACKEND_HINT = import.meta.env.PROD
  ? 'Backend indisponível (503/504). No Hostinger: Framework=Other, Entry=app.js, Build=npm run build, Start=npm start. Depois Redeploy + Restart.'
  : 'Inicie o backend: npm run dev (ou npm run dev:server em outro terminal, porta 3001).';

/** Evita "Unexpected token '<'" quando a API retorna HTML (index.html) em vez de JSON. */
export async function parseApiResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  const trimmed = text.trimStart();

  if (response.status === 503 || response.status === 504) {
    throw new Error(
      `Backend offline ou não iniciou (HTTP ${response.status}). ${BACKEND_HINT}`
    );
  }

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(`Backend não encontrado. ${BACKEND_HINT}`);
  }

  if (!trimmed) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? 'Resposta inválida da API.'
        : `API indisponível (HTTP ${response.status}). ${BACKEND_HINT}`
    );
  }
}

export async function responseJson<T = unknown>(response: Response): Promise<T> {
  return (await parseApiResponse(response)) as T;
}

export async function apiJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const data = await parseApiResponse(response);
  if (!response.ok) {
    const message = (data as { error?: string })?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}
