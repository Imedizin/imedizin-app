#!/bin/sh
set -e
# Run DB migrations before starting the app (retry until DB is reachable)
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  i=1
  while [ $i -le 30 ]; do
    if npx drizzle-kit migrate; then
      echo "Migrations complete."
      break
    fi
    if [ $i -eq 30 ]; then
      echo "Failed to run migrations after 30 attempts."
      exit 1
    fi
    echo "Attempt $i/30 failed, retrying in 2s..."
    sleep 2
    i=$(( i + 1 ))
  done
fi
exec "$@"
