#!/usr/bin/env node
/**
 * Gera/atualiza server/.env a partir de utils/supabase/info.tsx
 * Preserva SUPABASE_SERVICE_ROLE_KEY se já existir no .env atual.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const infoPath = join(root, 'utils/supabase/info.tsx');
const envPath = join(root, 'server/.env');

const info = readFileSync(infoPath, 'utf8');
const projectId = info.match(/projectId\s*=\s*"([^"]+)"/)?.[1];
const anonKey = info.match(/publicAnonKey\s*=\s*"([^"]+)"/)?.[1];

if (!projectId || !anonKey) {
  console.error('❌ Não foi possível ler projectId/publicAnonKey de utils/supabase/info.tsx');
  process.exit(1);
}

let existingServiceRole = '';
let existingJwt = '';

if (existsSync(envPath)) {
  const current = readFileSync(envPath, 'utf8');
  existingServiceRole =
    current.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)?.[1]?.trim() ?? '';
  existingJwt = current.match(/^JWT_SECRET=(.*)$/m)?.[1]?.trim() ?? '';
}

const WEAK_JWT_SECRETS = new Set([
  'altere-este-segredo-em-producao',
  'sisfinance-dev-secret-change-in-production',
  'sisfinance-dev-secret-change-me',
]);

const jwtSecret =
  existingJwt && !WEAK_JWT_SECRETS.has(existingJwt)
    ? existingJwt
    : randomBytes(32).toString('hex');

const envContent = `# SisFinance API — gerado em ${new Date().toISOString()}
# Para obter SUPABASE_SERVICE_ROLE_KEY:
# Supabase Dashboard → Project Settings → API → service_role (secret)

PORT=3001
JWT_SECRET=${jwtSecret}

SUPABASE_URL=https://${projectId}.supabase.co
SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${existingServiceRole}
`;

writeFileSync(envPath, envContent, 'utf8');

console.log('✅ server/.env atualizado');
console.log(`   SUPABASE_URL=https://${projectId}.supabase.co`);
console.log(`   SUPABASE_ANON_KEY=...${anonKey.slice(-8)}`);

if (!existingServiceRole) {
  console.log('');
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY ainda vazio.');
  console.log('   1. Abra: https://supabase.com/dashboard/project/' + projectId + '/settings/api');
  console.log('   2. Copie a chave "service_role" (secret)');
  console.log('   3. Cole em server/.env na linha SUPABASE_SERVICE_ROLE_KEY=');
} else {
  console.log(`   SUPABASE_SERVICE_ROLE_KEY=...${existingServiceRole.slice(-8)} (mantida)`);
}
