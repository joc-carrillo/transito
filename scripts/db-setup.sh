#!/usr/bin/env bash
# Aplica las migraciones de supabase/migrations a la base remota.
# Lee de .env.local: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD y opcionalmente SUPABASE_DB_REGION.
# Usa el pooler de sesión (IPv4) porque el host directo db.<ref>.supabase.co solo tiene IPv6.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env.local
set +a

: "${SUPABASE_PROJECT_REF:?Falta SUPABASE_PROJECT_REF en .env.local}"
: "${SUPABASE_DB_PASSWORD:?Falta SUPABASE_DB_PASSWORD en .env.local}"
REGION="${SUPABASE_DB_REGION:-us-east-1}"

PASSWORD_ENC=$(node -e 'process.stdout.write(encodeURIComponent(process.env.SUPABASE_DB_PASSWORD))')
DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${PASSWORD_ENC}@aws-0-${REGION}.pooler.supabase.com:5432/postgres"

npx supabase db push --db-url "$DB_URL" --yes
echo "Listo: migraciones aplicadas."
