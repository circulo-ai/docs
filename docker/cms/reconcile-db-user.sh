#!/bin/sh
set -eu

required_var() {
  var_name="$1"
  var_value="${2:-}"
  if [ -z "$var_value" ]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
}

required_var "PGHOST" "${PGHOST:-}"
required_var "PGPORT" "${PGPORT:-}"
required_var "PGUSER" "${PGUSER:-}"
required_var "PGPASSWORD" "${PGPASSWORD:-}"
required_var "PGDATABASE" "${PGDATABASE:-}"
required_var "DB_ADMIN_USER" "${DB_ADMIN_USER:-}"
required_var "DB_ADMIN_PASSWORD" "${DB_ADMIN_PASSWORD:-}"

DB_ADMIN_DATABASE="${DB_ADMIN_DATABASE:-postgres}"

app_login_ok() {
  PGPASSWORD="$PGPASSWORD" psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$PGUSER" \
    --dbname "$PGDATABASE" \
    --command 'SELECT 1;' >/dev/null 2>&1
}

if app_login_ok; then
  exit 0
fi

admin_login_ok() {
  PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$DB_ADMIN_USER" \
    --dbname "$DB_ADMIN_DATABASE" \
    --command 'SELECT 1;' >/dev/null 2>&1
}

if ! admin_login_ok; then
  echo "App role authentication failed and DB admin authentication failed." >&2
  echo "Hint: run one-time DB auth recovery inside postgres container to re-sync POSTGRES_PASSWORD and APP_DB_PASSWORD." >&2
  exit 1
fi

PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$DB_ADMIN_USER" \
  --dbname "$DB_ADMIN_DATABASE" \
  -v ON_ERROR_STOP=1 \
  --set=app_db_user="$PGUSER" \
  --set=app_db_password="$PGPASSWORD" \
  --set=app_db_name="$PGDATABASE" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_db_user', :'app_db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'app_db_user') \gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_db_user', :'app_db_password') \gexec

SELECT format('CREATE DATABASE %I', :'app_db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db_name') \gexec
SQL

PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$DB_ADMIN_USER" \
  --dbname "$PGDATABASE" \
  -v ON_ERROR_STOP=1 \
  --set=app_db_user="$PGUSER" \
  --set=app_db_name="$PGDATABASE" <<'SQL'
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

if ! app_login_ok; then
  echo "Reconciled DB user password, but app role authentication still failed." >&2
  exit 1
fi
