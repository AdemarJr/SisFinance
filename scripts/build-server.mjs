/**
 * Compila o backend para server/dist/index.js (sem depender de tsc no Hostinger).
 */
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

mkdirSync('server/dist', { recursive: true });

await build({
  entryPoints: ['server/src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'server/dist/index.js',
  logLevel: 'info',
});

console.log('✓ server/dist/index.js');
