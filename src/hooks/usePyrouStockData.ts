import { useState, useEffect, useCallback } from 'react';
import { pyrouStockClient } from '../lib/pyroustock-client';
import { Venda, Produto, Caixa } from '../lib/pyroustock-processor';

/**
 * Hook para buscar dados sincronizados do PyrouStock
 * 
 * @example
 * ```tsx
 * const { vendas, produtos, caixas, loading, refresh } = usePyrouStockData('emp1');
 * 
 * // Dados são carregados automaticamente
 * if (loading) return <p>Carregando...</p>;
 * 
 * // Atualizar dados manualmente
 * await refresh();
 * ```
 */
export function usePyrouStockData(empresaId: string | null) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [prodRes, vendRes, caixaRes] = await Promise.all([
        pyrouStockClient.getProducts(empresaId),
        pyrouStockClient.getSales(empresaId),
        pyrouStockClient.getCashiers(empresaId),
      ]);

      if (prodRes.success && prodRes.data) {
        setProdutos(prodRes.data);
      }

      if (vendRes.success && vendRes.data) {
        setVendas(vendRes.data);
      }

      if (caixaRes.success && caixaRes.data) {
        setCaixas(caixaRes.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados PyrouStock:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    produtos,
    vendas,
    caixas,
    loading,
    error,
    refresh: loadData,
  };
}

/**
 * Hook para buscar apenas produtos
 */
export function usePyrouStockProducts(empresaId: string | null) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await pyrouStockClient.getProducts(empresaId);

      if (result.success && result.data) {
        setProdutos(result.data);
      } else {
        setError(result.error || 'Erro ao carregar produtos');
      }
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    produtos,
    loading,
    error,
    refresh: loadProducts,
  };
}

/**
 * Hook para buscar apenas vendas
 */
export function usePyrouStockSales(empresaId: string | null) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await pyrouStockClient.getSales(empresaId);

      if (result.success && result.data) {
        setVendas(result.data);
      } else {
        setError(result.error || 'Erro ao carregar vendas');
      }
    } catch (err: any) {
      console.error('Erro ao carregar vendas:', err);
      setError(err.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    vendas,
    loading,
    error,
    refresh: loadSales,
  };
}

/**
 * Hook para buscar configuração do PyrouStock
 */
export function usePyrouStockConfig(empresaId: string | null) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await pyrouStockClient.getConfig(empresaId);

      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        // Configuração não encontrada não é um erro
        setConfig(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar configuração:', err);
      setError(err.message || 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    error,
    refresh: loadConfig,
    hasConfig: config !== null,
  };
}
