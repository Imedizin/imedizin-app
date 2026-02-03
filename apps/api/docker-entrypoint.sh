#!/bin/sh
set -e
# Run DB migrations before starting the app
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  npx drizzle-kit migrate
fi
exec "$@"
