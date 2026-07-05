import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config.js';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado no servidor');
  }
  if (!adminClient) {
    adminClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export function getAnonClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado no servidor');
  }
  if (!anonClient) {
    anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}
