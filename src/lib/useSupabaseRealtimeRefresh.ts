import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { isUsingMockData } from './db';

/**
 * Reexecuta `refresh` quando há INSERT/UPDATE/DELETE nas tabelas indicadas (Supabase Realtime).
 * No modo mock ou sem cliente, não faz nada.
 *
 * No projeto Supabase é preciso habilitar a tabela para Replication (Realtime),
 * senão este canal não recebe eventos.
 */
export function useSupabaseRealtimeRefresh(tables: string[], refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const depsKey = JSON.stringify([...new Set(tables.filter(Boolean))].sort());

  useEffect(() => {
    if (isUsingMockData || !supabase) return;

    const uniqueTables = [...new Set(JSON.parse(depsKey) as string[])];
    if (uniqueTables.length === 0) return;

    const channelName = `realtime:${uniqueTables.join(':')}`;
    const channel = supabase.channel(channelName);
    const handler = () => {
      refreshRef.current();
    };

    for (const table of uniqueTables) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handler);
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [depsKey]);
}
