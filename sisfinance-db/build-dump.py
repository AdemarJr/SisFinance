#!/usr/bin/env python3
"""Consolida schema + dados em pyrou-finance-dump.sql."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "pyrou-finance-dump.sql"

DATA_FILES = [
    ("planos_assinatura", "planos_assinatura_rows.sql"),
    ("clientes_sistema", "clientes_sistema_rows.sql"),
    ("empresas", "empresas_rows.sql"),
    ("categorias_receitas", "categorias_receitas_rows.sql"),
    ("categorias_despesas", "categorias_despesas_rows.sql"),
    ("categorias_produtos", "categorias_produtos_rows.sql"),
    ("contas_financeiras", "contas_financeiras_rows.sql"),
    ("fornecedores", "fornecedores_rows.sql"),
    ("funcionarios", "funcionarios_rows.sql"),
    ("produtos", "produtos_rows.sql"),
    ("lancamentos", "lancamentos_rows.sql"),
    ("contas_pagar", "contas_pagar_rows.sql"),
]

SCHEMA = (ROOT / "schema-postgres.sql").read_text(encoding="utf-8")


def main() -> None:
    parts: list[str] = [
        f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "-- Destino: PostgreSQL no Easypanel\n\n",
        SCHEMA,
        "\n-- -----------------------------------------------------------------------------\n",
        "-- Dados\n",
        "-- -----------------------------------------------------------------------------\n\n",
    ]

    for _, fname in DATA_FILES:
        path = ROOT / fname
        content = path.read_text(encoding="utf-8").strip()
        parts.append(f"-- >>> {fname}\n{content}")
        if not content.endswith(";"):
            parts.append(";")
        parts.append("\n\n")

    parts.append(
        """
COMMIT;

SELECT 'Import concluído' AS status,
  (SELECT count(*) FROM public.planos_assinatura) AS planos,
  (SELECT count(*) FROM public.clientes_sistema) AS clientes_sistema,
  (SELECT count(*) FROM public.empresas) AS empresas,
  (SELECT count(*) FROM public.lancamentos) AS lancamentos,
  (SELECT count(*) FROM public.fornecedores) AS fornecedores;
"""
    )

    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"Created {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
