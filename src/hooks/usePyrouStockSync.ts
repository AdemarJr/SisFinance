import { useState, useCallback } from 'react';
import { pyrouStockClient } from '../lib/pyroustock-client';
import { toast } from 'sonner';

export interface SyncResult {
  produtos_sincronizados: number;
  vendas_sincronizadas: number;
  caixas_sincronizados: number;
  erros: string[];
}

/**
 * Hook para sincronização com PyrouStock
 * 
 * @example
 * ```tsx
 * const { sync, syncLastWeek, syncing, lastSync } = usePyrouStockSync('emp1');
 * 
 * // Sincronizar últimos 7 dias
 * await syncLastWeek();
 * 
 * // Sincronizar período específico
 * await sync('2024-03-01T00:00:00Z', '2024-03-31T23:59:59Z');
 * ```
 */
export function usePyrouStockSync(empresaId: string) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const sync = useCallback(
    async (startDate?: string, endDate?: string): Promise<SyncResult | null> => {
      try {
        setSyncing(true);

        const resultado = await pyrouStockClient.sync({
          empresa_id: empresaId,
          start_date: startDate,
          end_date: endDate,
        });

        if (resultado.success && resultado.data) {
          setLastSync(new Date());
          setLastResult(resultado.data);
          
          const msg = `Sincronizado: ${resultado.data.vendas_sincronizadas} vendas, ${resultado.data.produtos_sincronizados} produtos`;
          toast.success(msg);
          
          return resultado.data;
        } else {
          toast.error(resultado.error || 'Erro ao sincronizar');
          return null;
        }
      } catch (error: any) {
        console.error('Erro ao sincronizar PyrouStock:', error);
        toast.error(error.message || 'Erro ao sincronizar');
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [empresaId]
  );

  const syncLastWeek = useCallback(async (): Promise<SyncResult | null> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    return sync(startDate.toISOString(), endDate.toISOString());
  }, [sync]);

  const syncLastMonth = useCallback(async (): Promise<SyncResult | null> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    return sync(startDate.toISOString(), endDate.toISOString());
  }, [sync]);

  const syncToday = useCallback(async (): Promise<SyncResult | null> => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return sync(startDate.toISOString(), endDate.toISOString());
  }, [sync]);

  const syncYesterday = useCallback(async (): Promise<SyncResult | null> => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    return sync(startDate.toISOString(), endDate.toISOString());
  }, [sync]);

  return {
    sync,
    syncLastWeek,
    syncLastMonth,
    syncToday,
    syncYesterday,
    syncing,
    lastSync,
    lastResult,
  };
}
