# Deploy SisFinance no EasyPanel

Topo alvo no projeto **`apps-pyrou`** (mesmo padrão do StockPyrou):

```text
sisfinance-frontend (nginx :80)  →  sisfinance-api (Node :3001)  →  Postgres (pyrou-finace)
```

## Pré-requisitos

1. Repos no GitHub: `AdemarJr/SisFinance` e `AdemarJr/SisFinance-API` (com os `Dockerfile`s na raiz).
2. Banco `pyrou-finace` acessível (já documentado em `sisfinance-db/IMPORT-EASYPANEL.md`).

## 1. Banco

```bash
# No host com psql, ou console SQL do EasyPanel:
psql -v ON_ERROR_STOP=1 -f sisfinance-db/pyrou-finance-dump.sql
psql -v ON_ERROR_STOP=1 -f sisfinance-db/post-import-easypanel.sql
```

Depois, com a API no ar (ou `docker exec`):

```bash
# No container da API (env ADMIN_* definidos):
npm run set-admin-password
```

## 2. Serviço `sisfinance-api`

| Campo | Valor |
|-------|--------|
| Projeto | `apps-pyrou` |
| Source | GitHub `AdemarJr/SisFinance-API` → `main` |
| Build | Dockerfile |
| Porta (domínio) | `3001` |
| Health | `/api/health` |

Env: copiar de `SisFinance-API/easypanel.env.example` (sem commitar senhas).

Preferir host **interno** do Postgres se estiver no mesmo projeto EasyPanel.

## 3. Serviço `sisfinance-frontend`

| Campo | Valor |
|-------|--------|
| Projeto | `apps-pyrou` |
| Source | GitHub `AdemarJr/SisFinance` → `main` |
| Build | Dockerfile |
| Porta (domínio) | `80` |
| Health | `/healthz` |

Env de **build**:

```env
VITE_API_URL=https://SEU-DOMINIO-DA-API/api
```

Rebuild obrigatório sempre que mudar a URL da API.

## 4. Validação

```bash
curl -sS https://SEU-DOMINIO-API/api/health
# postgres: true, db.ok: true

curl -sS https://SEU-DOMINIO-FE/healthz
# ok
```

Login com `admin@sisfinance.com` e a senha definida em `set-admin-password`.

## 5. Cutover

1. Apontar domínio customizado (opcional) nos dois serviços.
2. Confirmar `VITE_API_URL` no build do front.
3. Desligar Railway (API) e Hostinger (front) só após smoke test.

## Arquivos desta preparação

| Arquivo | Repo |
|---------|------|
| `Dockerfile`, `docker/nginx.conf` | SisFinance |
| `easypanel.env.example` | SisFinance |
| `Dockerfile`, `easypanel.env.example` | SisFinance-API |
| `sisfinance-db/post-import-easypanel.sql` | SisFinance |
