#!/usr/bin/env bash
# Regenera pyrou-finance-dump.sql a partir dos *_rows.sql desta pasta.
set -euo pipefail
cd "$(dirname "$0")"
python3 build-dump.py
echo "OK: pyrou-finance-dump.sql"
