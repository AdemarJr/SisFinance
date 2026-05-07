import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../../lib/db';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
}

interface EmpresaContextType {
  empresaSelecionada: string; // '' = todas as empresas
  setEmpresaSelecionada: (id: string) => void;
  empresas: Empresa[];
  empresaAtual: Empresa | null;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresaSelecionada, setEmpresaSelecionadaState] = useState<string>('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega empresas do banco
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Carrega empresa selecionada do localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('empresaSelecionada');
      if (saved) setEmpresaSelecionadaState(saved);
    } catch {
      // Alguns navegadores/modos (ex: Safari privado) podem bloquear localStorage
    }
  }, []);

  // Sincroniza seleção entre abas/janelas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'empresaSelecionada') return;
      setEmpresaSelecionadaState(e.newValue ?? '');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await db
        .from('empresas')
        .select('id, nome, cnpj')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const setEmpresaSelecionada = (id: string) => {
    setEmpresaSelecionadaState(id);
    try {
      window.localStorage.setItem('empresaSelecionada', id);
    } catch {
      // Se o storage não estiver disponível, apenas mantém em memória
    }
  };

  const empresaAtual = empresaSelecionada
    ? empresas.find((e) => e.id === empresaSelecionada) || null
    : null;

  return (
    <EmpresaContext.Provider
      value={{
        empresaSelecionada,
        setEmpresaSelecionada,
        empresas,
        empresaAtual,
        loading,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider');
  }
  return context;
}
