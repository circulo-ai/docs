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

if [ -z "${DB_ADMIN_USER:-}" ] || [ -z "${DB_ADMIN_PASSWORD:-}" ]; then
  echo "App role authentication failed and DB admin credentials are unavailable." >&2
  exit 1
fi

admin_login_ok() {
  PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
    --host "$PGHOST" \
    --port "$PGPORT" \
    --username "$DB_ADMIN_USER" \
    --dbname "$PGDATABASE" \
    --command 'SELECT 1;' >/dev/null 2>&1
}

if ! admin_login_ok; then
  echo "App role authentication failed and DB admin authentication failed." >&2
  exit 1
fi

escaped_user="$(printf '%s' "$PGUSER" | sed 's/"/""/g')"
escaped_password="$(printf '%s' "$PGPASSWORD" | sed "s/'/''/g")"

PGPASSWORD="$DB_ADMIN_PASSWORD" psql \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$DB_ADMIN_USER" \
  --dbname "$PGDATABASE" \
  -v ON_ERROR_STOP=1 \
  --command "ALTER ROLE \"$escaped_user\" WITH LOGIN PASSWORD '$escaped_password';"

if ! app_login_ok; then
  echo "Reconciled DB user password, but app role authentication still failed." >&2
  exit 1
fi

