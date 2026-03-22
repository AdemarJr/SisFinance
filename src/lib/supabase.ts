import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Supabase configurado automaticamente via Figma Make
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Verifica se as credenciais estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  projectId !== 'YOUR_PROJECT_ID';

// Singleton - única instância do Supabase client
export const supabase = isSupabaseConfigured 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isConfigured = isSupabaseConfigured;