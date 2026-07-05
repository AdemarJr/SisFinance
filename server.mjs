/**
 * Bootstrap da API — Hostinger (Framework: Other, Entry: app.js ou server.mjs).
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entry = join(root, 'server/dist/index.js');

if (!existsSync(entry)) {
  console.error('❌ server/dist/index.js não encontrado.');
  console.error('   Build command deve ser: npm run build:hostinger');
  process.exit(1);
}

await import('./server/dist/index.js');
