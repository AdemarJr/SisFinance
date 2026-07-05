# SisFinance — API Backend

Backend próprio do SisFinance. O frontend **não** acessa o Supabase diretamente; toda comunicação passa por esta API.

## Configuração

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Preencha em `server/.env`:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto (`https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Chave anon (login) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (acesso ao Postgres) |
| `JWT_SECRET` | Segredo para tokens da API |
| `PORT` | Porta (padrão `3001`) |

## Executar

```bash
cd server
npm install
npm run dev
```

Na raiz do projeto (frontend + proxy):

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev
```

O Vite faz proxy de `/api` → `http://localhost:3001`.

## Endpoints principais

- `GET /api/health` — status da API
- `POST /api/auth/login` — login
- `GET /api/auth/me` — sessão atual
- `POST /api/db/query` — consultas CRUD (autenticado)
- `POST /api/db/rpc` — funções SQL (autenticado)
- `/api/make-server-b1600651/*` — estoque KV + PyrouStock (legado)

## Modo mock (sem backend)

No frontend, defina `VITE_USE_MOCK=true` para usar dados locais (localStorage).
