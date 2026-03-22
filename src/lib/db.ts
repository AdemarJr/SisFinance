import { supabase, isConfigured } from './supabase';
import { mockApiMulti } from './mock-data-multi';

// Retorna a API apropriada (Supabase real ou mock)
export const db = isConfigured && supabase ? supabase : mockApiMulti;

// Indica se está usando dados reais ou mock
export const isUsingMockData = !isConfigured;

// Helper para debug - mostra qual banco está sendo usado
if (typeof window !== 'undefined') {
  console.log('🗄️ Database:', isConfigured ? 'Supabase (Real)' : 'Mock Data');
}