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

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGDATA="${PGDATA:-/var/lib/postgresql/data/pgdata}"
PG_HBA_CONF="$PGDATA/pg_hba.conf"
PG_HBA_BACKUP="$PGDATA/pg_hba.conf.bak.codex"

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

reload_postgres_auth() {
  if [ ! -f "$PGDATA/postmaster.pid" ]; then
    echo "ERROR: postmaster.pid not found at $PGDATA/postmaster.pid" >&2
    return 1
  fi

  postmaster_pid="$(head -n 1 "$PGDATA/postmaster.pid" | tr -d '[:space:]')"
  if [ -z "$postmaster_pid" ]; then
    echo "ERROR: Could not read postgres PID from postmaster.pid" >&2
    return 1
  fi

  kill -HUP "$postmaster_pid"
}

login_without_password_ok() {
  login_user="$1"
  psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$login_user" \
    --dbname postgres \
    --command 'SELECT 1;' >/dev/null 2>&1
}

enable_local_trust_auth() {
  if [ ! -f "$PG_HBA_CONF" ]; then
    echo "ERROR: pg_hba.conf not found at $PG_HBA_CONF" >&2
    return 1
  fi

  cp "$PG_HBA_CONF" "$PG_HBA_BACKUP"
  {
    echo "local all all trust"
    echo "host all all 127.0.0.1/32 trust"
    cat "$PG_HBA_BACKUP"
  } > "$PG_HBA_CONF"

  reload_postgres_auth
}

restore_pg_hba() {
  if [ ! -f "$PG_HBA_BACKUP" ]; then
    return 0
  fi

  mv "$PG_HBA_BACKUP" "$PG_HBA_CONF"
  reload_postgres_auth
}

recover_auth_with_local_trust() {
  recovery_login_user=""

  if ! enable_local_trust_auth; then
    return 1
  fi

  if login_without_password_ok "$POSTGRES_USER"; then
    recovery_login_user="$POSTGRES_USER"
  elif [ "$POSTGRES_USER" != "postgres" ] && login_without_password_ok "postgres"; then
    recovery_login_user="postgres"
  else
    echo "ERROR: Could not authenticate over local trust as $POSTGRES_USER or postgres." >&2
    restore_pg_hba || true
    return 1
  fi

  if ! psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$recovery_login_user" \
    --dbname postgres \
    -v ON_ERROR_STOP=1 \
    --set=admin_user="$POSTGRES_USER" \
    --set=admin_password="$POSTGRES_PASSWORD" \
    --set=app_db_user="$APP_DB_USER" \
    --set=app_db_password="$APP_DB_PASSWORD" \
    --set=app_db_name="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN SUPERUSER PASSWORD %L', :'admin_user', :'admin_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'admin_user') \gexec

SELECT format('ALTER ROLE %I WITH LOGIN SUPERUSER PASSWORD %L', :'admin_user', :'admin_password') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_db_user', :'app_db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'app_db_user') \gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_db_user', :'app_db_password') \gexec

SELECT format('CREATE DATABASE %I', :'app_db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db_name') \gexec
SQL
  then
    echo "ERROR: Failed to recover DB admin/app credentials via local trust." >&2
    restore_pg_hba || true
    return 1
  fi

  if ! restore_pg_hba; then
    echo "ERROR: Failed to restore pg_hba.conf after recovery." >&2
    return 1
  fi

  return 0
}

if ! admin_login_ok; then
  echo "WARN: postgres admin authentication failed in postgres-init." >&2
  if app_login_ok; then
    echo "INFO: app role authentication works; skipping admin role/grant sync." >&2
    exit 0
  fi
  echo "WARN: both admin and app role authentication failed; attempting local auth recovery." >&2
  if ! recover_auth_with_local_trust; then
    echo "ERROR: Unable to recover DB credentials automatically." >&2
    exit 1
  fi
fi

if ! admin_login_ok; then
  echo "ERROR: postgres admin authentication still failed after recovery." >&2
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

SELECT format('CREATE DATABASE %I', :'app_db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db_name') \gexec

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
