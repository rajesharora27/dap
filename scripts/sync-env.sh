#!/bin/bash

# Default to development if no argument provided
ENV_MODE=${1:-development}

if [ "$ENV_MODE" != "development" ] && [ "$ENV_MODE" != "production" ]; then
    echo "Usage: ./scripts/sync-env.sh [development|production]"
    exit 1
fi

SOURCE_FILE=".env.${ENV_MODE}"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: Source environment file '$SOURCE_FILE' not found in root."
    exit 1
fi

echo "--- Syncing Environment: ${ENV_MODE} ---"

# 1. Update Root .env (for convenience)
echo "Updating root .env..."
cp "$SOURCE_FILE" .env

# 2. Update Backend .env
echo "Updating backend/.env..."
cp "$SOURCE_FILE" backend/.env

# 3. Update Frontend .env
# Note: Vite loads .env, .env.local, .env.[mode], .env.[mode].local
# We copy to .env to ensure these variables take precedence or are available as base.
echo "Updating frontend/.env..."
cp "$SOURCE_FILE" frontend/.env

echo "--- Environment Sync Complete ---"
echo "Active Configuration: $SOURCE_FILE"
