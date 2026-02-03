#!/bin/bash

# Database reset and migration script
# This script resets the database and applies fresh migrations
# Useful during early development when schema changes frequently

set -e  # Exit on error

echo "🔄 Resetting database..."

# Step 1: Stop and remove database container and volumes
echo "📦 Stopping and removing database container..."
docker-compose down -v

# Step 2: Start fresh database
echo "🚀 Starting fresh database..."
docker-compose up -d

# Step 3: Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec bia-database pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts..."
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Database failed to start in time"
  exit 1
fi

# Step 4: Remove old migration files
echo "🗑️  Removing old migration files..."
rm -rf drizzle

# Step 5: Generate new migration
echo "📝 Generating new migration..."
npm run db:generate

# Step 6: Apply migration
echo "🚀 Applying migration..."
npm run db:migrate

# # Step 7: Seed data
# echo "🌱 Seeding database..."
# npm run db:seed

# Step 8: Verify tables were created
echo "🔍 Verifying database structure..."
table_count=$(docker exec bia-database psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

if [ "$table_count" -ge "5" ]; then
  echo "✅ Success! Database reset + seed complete with $table_count tables"
  echo ""
  echo "📊 Tables created:"
  docker exec bia-database psql -U postgres -d postgres -c "\dt" | grep -E "mailbox|email" || true
else
  echo "⚠️  Warning: Expected at least 5 tables, found $table_count"
fi

echo ""
echo "✨ Database reset + seed complete!"
