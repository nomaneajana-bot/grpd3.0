#!/usr/bin/env bash
# Create a disposable local PostgreSQL role + database for D02 verification.
# Does NOT use SUPERUSER. Credentials are written to a gitignored env file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${D02_ENV_FILE:-$ROOT/.env.d02.local}"
DB_NAME="${D02_DB_NAME:-grpd_d02_local}"
DB_USER="${D02_DB_USER:-grpd_d02_local}"
DB_HOST="${D02_DB_HOST:-127.0.0.1}"
DB_PORT="${D02_DB_PORT:-5432}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools first." >&2
  exit 1
fi

# Random local-only credentials (never commit; never use in production evidence).
DB_PASS="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"

echo "Creating role/database as the local postgres admin (no SUPERUSER for app role)..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
\$\$;
SELECT 'DROP DATABASE IF EXISTS ${DB_NAME}' WHERE EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL

cat > "$ENV_FILE" <<EOF
# Local-only D02 disposable credentials. Do not commit. Do not paste into PDFs.
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
AUTH_JWT_SECRET=${JWT_SECRET}
EOF
chmod 600 "$ENV_FILE"

echo "Wrote $ENV_FILE"
echo "Next:"
echo "  set -a; source $ENV_FILE; set +a"
echo "  npx prisma generate && npx prisma migrate deploy"
echo "  npm run test:d02 -- --ci"
echo "  npx tsx scripts/d02-evidence-capture.ts"
