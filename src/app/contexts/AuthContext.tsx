import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { db } from '../../lib/db';

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

interface AuthContextType {
  user: User | null;
  clienteSistema: ClienteSistema | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClienteData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clienteSistema, setClienteSistema] = useState<ClienteSistema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    checkUser();

    // Escutar mudanças de autenticação (apenas se supabase estiver configurado)
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadClienteData(session.user.id);
      } else {
        setClienteSistema(null);
      }
    });

    const onVisibility = () => {
      if (!supabase || document.visibilityState !== 'visible') return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          void loadClienteData(session.user.id);
        } else {
          setClienteSistema(null);
        }
      });
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const checkUser = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadClienteData(session.user.id);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClienteData = async (authUserId: string) => {
    try {
      const { data: clienteData, error } = await db
        .from('clientes_sistema')
        .select(`
          *,
          plano:planos_assinatura(*)
        `)
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        // Se a tabela não existe, usar modo silencioso
        // O sistema funciona normalmente sem os dados de plano
        if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          // Silenciosamente ignorar - tabela não criada ainda
          return;
        }
        
        // Outros erros (como registro não encontrado) também são silenciosos
        // O usuário pode não ter registro em clientes_sistema ainda
        return;
      }

      setClienteSistema(clienteData);
    } catch (error) {
      // Erro de rede ou outro - não logar para não poluir console
      return;
    }
  };

  const refreshClienteData = async () => {
    if (user) {
      await loadClienteData(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadClienteData(data.user.id);
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const signOut = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setClienteSistema(null);
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      throw new Error(error.message || 'Erro ao fazer logout');
    }
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