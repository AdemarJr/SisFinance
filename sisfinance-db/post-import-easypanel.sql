-- Rodar DEPOIS de pyrou-finance-dump.sql no Postgres EasyPanel.
-- Habilita login via API (Postgres direto, sem Supabase Auth).

ALTER TABLE public.clientes_sistema
  ADD COLUMN IF NOT EXISTS senha_hash text;

COMMENT ON COLUMN public.clientes_sistema.senha_hash IS 'Hash bcrypt da senha (modo Postgres direto)';
