import { mockApiMulti } from './mock-data-multi';
import { createApiDbClient } from './api-db-client';

/** Usar mock local (localStorage) — defina VITE_USE_MOCK=true */
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const db = useMock ? mockApiMulti : createApiDbClient();
export const isUsingMockData = useMock;

if (typeof window !== 'undefined') {
  console.log('🗄️ Database:', useMock ? 'Mock Data' : 'API Backend');
}
