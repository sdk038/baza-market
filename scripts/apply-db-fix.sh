#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260611070000_fix_orders_rls_recursion.sql"
PROJECT_REF="kicknczeyptysotpvffh"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Set SUPABASE_DB_PASSWORD (Supabase → Project Settings → Database → Database password)."
  echo "Example:"
  echo "  SUPABASE_DB_PASSWORD='your-password' $0"
  exit 1
fi

DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
else
  npx --yes supabase@latest db execute --db-url "$DB_URL" --file "$MIGRATION"
fi

echo "Migration applied."
