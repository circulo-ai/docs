#!/bin/sh
set -eu

if [ -z "${APP_DB_USER:-}" ] || [ -z "${APP_DB_PASSWORD:-}" ]; then
  echo "APP_DB_USER and APP_DB_PASSWORD must be set." >&2
  exit 1
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "POSTGRES_PASSWORD must be set." >&2
  exit 1
fi

if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_DB:-}" ]; then
  echo "POSTGRES_USER and POSTGRES_DB must be set." >&2
  exit 1
fi

PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"

admin_login_ok() {
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --command 'SELECT 1;' >/dev/null 2>&1
}

app_login_ok() {
  PGPASSWORD="$APP_DB_PASSWORD" psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$APP_DB_USER" \
    --dbname "$POSTGRES_DB" \
    --command 'SELECT 1;' >/dev/null 2>&1
}

if ! admin_login_ok; then
  echo "WARN: postgres admin authentication failed in postgres-init." >&2
  if app_login_ok; then
    echo "INFO: app role authentication works; skipping admin role/grant sync." >&2
    exit 0
  fi
  echo "ERROR: both admin and app role authentication failed." >&2
  exit 1
fi

export PGPASSWORD="$POSTGRES_PASSWORD"

psql \
  -v ON_ERROR_STOP=1 \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_db_user="$APP_DB_USER" \
  --set=app_db_password="$APP_DB_PASSWORD" \
  --set=app_db_name="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_db_user', :'app_db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'app_db_user') \gexec

-- Keep password in sync across redeploys when APP_DB_PASSWORD changes.
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_db_user', :'app_db_password') \gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'app_db_name', :'app_db_user') \gexec
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'app_db_user') \gexec

SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO %I',
  :'app_db_user'
) \gexec

SELECT format(
  'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'app_db_user'
) \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES TO %I',
  :'app_db_user'
) \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
  :'app_db_user'
) \gexec
SQL
