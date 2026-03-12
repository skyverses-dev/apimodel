#!/bin/bash
# ============================================
# 2brain - MongoDB Daily Backup
# Usage: bash scripts/backup-db.sh
# Cron:  0 2 * * * /root/itera102/v2/apimodel/scripts/backup-db.sh
# ============================================

set -e

# ── Config ─────────────────────────────────────────
DB_NAME="2brain"
BACKUP_DIR="/root/backups/2brain"
KEEP_DAYS=7                # Xoá backup cũ hơn 7 ngày
DATE=$(date '+%Y-%m-%d_%H%M%S')
BACKUP_PATH="$BACKUP_DIR/$DB_NAME-$DATE"
LOG_FILE="$BACKUP_DIR/backup.log"

# Read MongoDB URI from .env.local
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -f "$ENV_FILE" ]; then
  MONGO_URI=$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d'=' -f2-)
fi
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/$DB_NAME}"

# ── Setup ──────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ── Backup ─────────────────────────────────────────
log "═══ Backup started ═══"
log "Database: $DB_NAME"
log "Output:   $BACKUP_PATH"

mongodump --uri="$MONGO_URI" --db="$DB_NAME" --out="$BACKUP_PATH" 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
  # Compress
  cd "$BACKUP_DIR"
  tar -czf "$DB_NAME-$DATE.tar.gz" "$DB_NAME-$DATE"
  rm -rf "$DB_NAME-$DATE"

  SIZE=$(du -sh "$DB_NAME-$DATE.tar.gz" | cut -f1)
  log "✅ Backup complete: $DB_NAME-$DATE.tar.gz ($SIZE)"
else
  log "❌ Backup failed!"
  exit 1
fi

# ── Cleanup old backups ────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  log "🗑️  Deleted $DELETED backup(s) older than $KEEP_DAYS days"
fi

# ── Summary ────────────────────────────────────────
TOTAL=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -1 | cut -f1)
log "📦 Total backups: $TOTAL"
log "═══ Backup finished ═══"
log ""
