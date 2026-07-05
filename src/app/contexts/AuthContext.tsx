import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_BASE, apiJson, getAuthToken, setAuthToken } from '../../lib/api-config';

interface ClienteSistema {
  id: string;
  auth_user_id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  documento?: string;
  plano_id: string;
  limite_empresas: number;
  data_assinatura: string;
  data_expiracao?: string;
  status: 'Ativo' | 'Suspenso' | 'Cancelado';
  is_super_admin: boolean;
  plano?: {
    id: string;
    nome: string;
    limite_empresas: number;
    preco_mensal: number;
    descricao?: string;
    recursos?: string[];
  };
}

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  clienteSistema: ClienteSistema | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClienteData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clienteSistema, setClienteSistema] = useState<ClienteSistema | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (data: {
    user: AuthUser;
    clienteSistema: ClienteSistema | null;
    isSuperAdmin?: boolean;
  }) => {
    setUser(data.user);
    setClienteSistema(data.clienteSistema);
  };

  const loadSession = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setClienteSistema(null);
      return;
    }

    try {
      const data = await apiJson<{
        user: AuthUser;
        clienteSistema: ClienteSistema | null;
        isSuperAdmin: boolean;
      }>('/auth/me');
      applySession(data);
    } catch {
      setAuthToken(null);
      setUser(null);
      setClienteSistema(null);
    }
  };

  useEffect(() => {
    void loadSession().finally(() => setLoading(false));

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        void loadSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const refreshClienteData = async () => {
    await loadSession();
  };

  const signIn = async (email: string, password: string) => {
    const data = await apiJson<{
      token: string;
      user: AuthUser;
      clienteSistema: ClienteSistema | null;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(data.token);
    applySession({ user: data.user, clienteSistema: data.clienteSistema });
  };

  const signOut = async () => {
    try {
      await apiJson('/auth/logout', { method: 'POST' });
    } catch {
      // ignora erro de logout remoto
    }
    setAuthToken(null);
    setUser(null);
    setClienteSistema(null);
  };

  const value = {
    user,
    clienteSistema,
    loading,
    isSuperAdmin: clienteSistema?.is_super_admin ?? false,
    signIn,
    signOut,
    refreshClienteData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Health check da API (útil para diagnóstico)
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
