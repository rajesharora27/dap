#!/bin/bash

# Sync root .env to backend and frontend
if [ ! -f .env ]; then
    echo "Error: Root .env file not found."
    exit 1
fi

echo "--- Syncing Environment from root .env ---"

# 1. Update Backend .env
echo "Updating backend/.env..."
cp .env backend/.env

# 2. Update Frontend .env
echo "Updating frontend/.env..."
cp .env frontend/.env

echo "--- Environment Sync Complete ---"
