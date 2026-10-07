# SisFinance — Frontend

Interface React do SisFinance. **Não acessa o banco diretamente** — toda comunicação passa pela API (`SisFinance-API`).

## Arquitetura

```text
Este app (Vite/React)  →  SisFinance-API  →  Postgres (EasyPanel)
     EasyPanel              EasyPanel         pyrou-finace
```

Guia completo: [`EASYPANEL.md`](./EASYPANEL.md).

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

## Deploy EasyPanel

| Campo | Valor |
|-------|--------|
| Build | `Dockerfile` |
| Porta | `80` |
| Health | `/healthz` |

**Variável de ambiente (build):**

```env
VITE_API_URL=https://SEU-DOMINIO-API/api
```

Ver `easypanel.env.example` e `EASYPANEL.md`.

## Deploy Hostinger (legado)

| Campo | Valor |
|-------|--------|
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |
| Start | *(vazio)* |

Ver `hostinger.env.example`.

## Banco de dados / SQL

Dump e import EasyPanel: `sisfinance-db/` (ver `IMPORT-EASYPANEL.md`).  
Scripts extras da API: `SisFinance-API/database/`.

## Modo mock (sem API)

```env
VITE_USE_MOCK=true
```

Usa dados em `localStorage` via `src/lib/mock-data-multi.ts`.
