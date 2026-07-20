# Import no Easypanel (PostgreSQL)

Arquivo gerado: **`pyrou-finance-dump.sql`**

Contém:
- Schema completo (tabelas + views)
- Dados dos 12 arquivos `*_rows.sql` (ordem correta de FKs)

**Não inclui** INSERTs nas views (`vw_*`, `dashboard_resumo_empresa`, `saldos_por_conta`) — elas são recalculadas automaticamente a partir das tabelas.

## Conexão

| Campo | Valor |
|-------|-------|
| Host | `easypanel.pyrou.com.br` |
| Porta | `5432` |
| Banco | `pyrou-finace` |
| Usuário | `pyrouwebdb` |
| SSL | desabilitado |

> A URL externa pode mostrar `pyrouwebdb` como usuário/host alias; o **nome do banco** correto é `pyrou-finace`.

## Opção 1 — Terminal (recomendado)

```bash
cd sisfinance-db

export PGHOST=easypanel.pyrou.com.br
export PGPORT=5432
export PGDATABASE=pyrou-finace
export PGUSER=pyrouwebdb
export PGPASSWORD='SUA_SENHA_AQUI'

psql -v ON_ERROR_STOP=1 -f pyrou-finance-dump.sql
```

Use `PGPASSWORD` em vez da URL completa — a senha contém `@` e quebra o parsing da connection string.

## Opção 2 — Easypanel (SQL / phpPgAdmin)

1. Abra o serviço PostgreSQL no Easypanel
2. Vá em **Console SQL** ou **phpPgAdmin**
3. Cole o conteúdo de `pyrou-finance-dump.sql` (ou faça upload do arquivo)
4. Execute

## Regenerar o dump

Se atualizar os arquivos `*_rows.sql`:

```bash
./build-dump.sh
```

## Após o import

O admin já vem nos dados:

- Email: `admin@sisfinance.com`
- Perfil: Super Admin (Enterprise)

A senha de login depende da API/auth configurada no backend — não está no dump SQL.

Verifique com:

```sql
SELECT count(*) FROM empresas;
SELECT count(*) FROM lancamentos;
SELECT * FROM vw_clientes_resumo;
```
