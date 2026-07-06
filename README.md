# SisFinance — Frontend

Interface React do SisFinance. **Não acessa o banco diretamente** — toda comunicação passa pela API (`SisFinance-API`).

## Arquitetura

```text
Este app (Vite/React)  →  SisFinance-API  →  Postgres (Supabase)
     Hostinger              Railway
```

## Desenvolvimento local

**Terminal 1 — API** (repositório `SisFinance-API`):

```bash
cd ../SisFinance-API && npm run dev
```

**Terminal 2 — Frontend:**

```bash
cp .env.example .env
npm install
npm run dev
```

O Vite faz proxy de `/api` → `http://localhost:3001`.

## Deploy Hostinger

| Campo | Valor |
|-------|--------|
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |
| Start | *(vazio)* |

**Variável de ambiente (build):**

```env
VITE_API_URL=https://SEU-APP.up.railway.app/api
```

Ver também `hostinger.env.example`.

## Banco de dados / SQL

Os scripts SQL ficam no repositório **SisFinance-API** em `database/`.

## Modo mock (sem API)

```env
VITE_USE_MOCK=true
```

Usa dados em `localStorage` via `src/lib/mock-data-multi.ts`.
