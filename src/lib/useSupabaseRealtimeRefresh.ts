import { useEffect, useRef } from 'react';
import { isUsingMockData } from './db';

const POLL_INTERVAL_MS = 8000;

/**
 * Atualiza dados periodicamente quando há alterações em outras sessões.
 * Substitui Supabase Realtime — polling leve via recarregamento da tela.
 */
export function useSupabaseRealtimeRefresh(tables: string[], refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const depsKey = JSON.stringify([...new Set(tables.filter(Boolean))].sort());

  useEffect(() => {
    if (isUsingMockData) return;

    const tick = () => refreshRef.current();
    const id = window.setInterval(tick, POLL_INTERVAL_MS);

    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [depsKey]);
}
