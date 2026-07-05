export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'sisfinance-dev-secret-change-me',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    config.supabaseUrl &&
      config.supabaseServiceRoleKey &&
      config.supabaseUrl.startsWith('http')
  );
}
