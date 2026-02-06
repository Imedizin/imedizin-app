#!/bin/bash

# Database reset and migration script
# Stops and removes Postgres + Redis containers (and volumes), recreates them,
# then regenerates and applies migrations. Run from repo root or apps/api (npm run db:reset).

set -e

# Paths: script lives in apps/api/scripts/
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$(dirname "$API_DIR")")"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

# Compose service and DB names (must match docker-compose.yml)
POSTGRES_CONTAINER="imedizin-postgres"
REDIS_CONTAINER="imedizin-redis"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-imedizin}"

# Use the same DB name as DATABASE_URL so we reset the DB that drizzle will connect to
if [ -f "$API_DIR/.env" ]; then
  env_db=$(grep -E '^DATABASE_URL=' "$API_DIR/.env" | sed -n 's|.*/\([^/?]*\)[?]*.*|\1|p' | head -1)
  if [ -n "$env_db" ]; then
    POSTGRES_DB="$env_db"
  fi
fi

echo "🔄 Resetting database..."
echo "   Target database: $POSTGRES_DB"

# Step 1: Stop and remove Postgres + Redis containers and volumes
echo "📦 Stopping and removing postgres and redis (with volumes)..."
docker compose -f "$COMPOSE_FILE" down -v

# Step 2: Start fresh Postgres and Redis
echo "🚀 Starting postgres and redis..."
docker compose -f "$COMPOSE_FILE" up -d postgres redis

# Step 3: Wait for Postgres to be ready
echo "⏳ Waiting for Postgres to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
    echo "✅ Postgres is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts..."
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Postgres did not become ready in time"
  exit 1
fi

# Step 4: Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec "$REDIS_CONTAINER" redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts..."
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Redis did not become ready in time"
  exit 1
fi

# Step 5: Remove old migration files and regenerate
echo "📝 Removing old migrations and generating new ones..."
rm -rf "$API_DIR/drizzle"
(cd "$API_DIR" && npm run db:generate)

# Step 6: Apply migrations
echo "🚀 Applying migrations..."
(cd "$API_DIR" && npm run db:migrate)

# Step 7: Verify tables
echo "🔍 Verifying database structure..."
table_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

if [ "$table_count" -ge "1" ]; then
  echo "✅ Success! Database reset complete with $table_count table(s)"
  echo ""
  echo "📊 Tables:"
  docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" || true
else
  echo "⚠️  Warning: No tables found (count: $table_count)"
fi

echo ""
echo "✨ Database reset complete!"
