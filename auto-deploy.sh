#!/bin/bash
# ============================================
# 2brain - Auto Deployment (Git Webhook)
# Called by webhook endpoint, runs in background
# ============================================

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="2brainv2"
LOG_FILE="$APP_DIR/logs/auto-deploy.log"

cd "$APP_DIR"
mkdir -p logs

exec >> "$LOG_FILE" 2>&1

echo ""
echo "========================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-deploy triggered"
echo "========================================"

# Pull
echo "[PULL] Fetching latest code..."
git fetch --all
git reset --hard origin/"$(git rev-parse --abbrev-ref HEAD)"
echo "[PULL] Done"

# Install
echo "[DEPS] Installing dependencies..."
npm ci --production=false
echo "[DEPS] Done"

# Build
echo "[BUILD] Building Next.js..."
npm run build
echo "[BUILD] Done"

# Copy static assets
echo "[STATIC] Copying assets to standalone..."
[ -d ".next/static" ] && cp -r .next/static .next/standalone/.next/static
[ -d "public" ] && cp -r public .next/standalone/public
[ -d "messages" ] && cp -r messages .next/standalone/messages
[ -f ".env.local" ] && cp .env.local .next/standalone/.env.local
echo "[STATIC] Done"

# Restart
echo "[PM2] Restarting..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi
pm2 save --force
echo "[PM2] Done"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-deploy complete: $(git log -1 --format='%h %s')"
echo "========================================"
