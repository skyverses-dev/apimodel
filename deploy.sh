#!/bin/bash
# ============================================
# 2brain - Manual Deployment Script
# Usage: bash deploy.sh
# ============================================

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="2brain"
LOG_FILE="$APP_DIR/logs/deploy.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ---- Start ----
echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}   🚀 Deploying ${APP_NAME}${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""

cd "$APP_DIR"

# Create logs dir
mkdir -p logs

# Step 1: Pull latest code
log "Pulling latest code..."
git pull origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 | tail -3
success "Code updated"

# Step 2: Install dependencies
log "Installing dependencies..."
npm ci --production=false 2>&1 | tail -3
success "Dependencies installed"

# Step 3: Build
log "Building Next.js (standalone)..."
npm run build 2>&1 | tail -5
success "Build complete"

# Step 4: Copy static + public + messages to standalone
log "Copying static assets..."
if [ -d ".next/static" ]; then
  cp -r .next/static .next/standalone/.next/static
  success "Static files copied"
fi
if [ -d "public" ]; then
  cp -r public .next/standalone/public
  success "Public files copied"
fi
if [ -d "messages" ]; then
  cp -r messages .next/standalone/messages
  success "i18n messages copied"
fi
if [ -f ".env.local" ]; then
  cp .env.local .next/standalone/.env.local
  success ".env.local copied"
fi

# Step 5: Restart PM2
log "Restarting PM2 process..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
  success "PM2 process restarted"
else
  pm2 start ecosystem.config.cjs
  success "PM2 process started"
fi

# Step 6: Save PM2 config
pm2 save --force > /dev/null 2>&1
success "PM2 config saved"

# Done
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Deployment complete!${NC}"
echo -e "${GREEN}   📍 http://localhost:3612${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

pm2 status "$APP_NAME"

# Log deployment
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployed: $(git log -1 --format='%h %s')" >> "$LOG_FILE"
