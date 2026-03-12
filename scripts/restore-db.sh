#!/bin/bash
# ============================================
# 2brain - MongoDB Restore from Backup
# Usage: bash scripts/restore-db.sh [backup_file.tar.gz]
# ============================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

DB_NAME="2brain"
BACKUP_DIR="/root/backups/2brain"

# Read MongoDB URI from .env.local
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -f "$ENV_FILE" ]; then
  MONGO_URI=$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d'=' -f2-)
fi
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/$DB_NAME}"

echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}   🔄 2BRAIN Database Restore${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""

# ── Select backup ──────────────────────────────────
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}Available backups:${NC}"
  echo ""
  ls -lht "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print "  " NR". " $NF " (" $5 ", " $6 " " $7 " " $8 ")"}'
  echo ""

  LATEST=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)
  if [ -z "$LATEST" ]; then
    echo -e "${RED}Không tìm thấy backup nào trong $BACKUP_DIR${NC}"
    exit 1
  fi

  echo -e "Enter backup file path (or press Enter for latest):"
  echo -e "${CYAN}Latest: $(basename "$LATEST")${NC}"
  read -p "> " INPUT

  if [ -z "$INPUT" ]; then
    BACKUP_FILE="$LATEST"
  else
    # Accept either full path or just filename
    if [ -f "$INPUT" ]; then
      BACKUP_FILE="$INPUT"
    elif [ -f "$BACKUP_DIR/$INPUT" ]; then
      BACKUP_FILE="$BACKUP_DIR/$INPUT"
    else
      echo -e "${RED}File không tồn tại: $INPUT${NC}"
      exit 1
    fi
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}File không tồn tại: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  Restore sẽ GHI ĐÈ database '$DB_NAME' hiện tại!${NC}"
echo -e "File: ${CYAN}$(basename "$BACKUP_FILE")${NC}"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Cancelled.${NC}"
  exit 0
fi

# ── Extract ────────────────────────────────────────
echo ""
echo "📦 Extracting..."
TMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TMP_DIR"

# Find the dump folder (could be nested)
DUMP_PATH=$(find "$TMP_DIR" -type d -name "$DB_NAME" | head -1)

if [ -z "$DUMP_PATH" ]; then
  echo -e "${RED}❌ Không tìm thấy database '$DB_NAME' trong backup${NC}"
  rm -rf "$TMP_DIR"
  exit 1
fi

# ── Restore ────────────────────────────────────────
echo "🔄 Restoring $DB_NAME..."
mongorestore --uri="$MONGO_URI" --db="$DB_NAME" --drop "$DUMP_PATH"

# ── Cleanup ────────────────────────────────────────
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Restore complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

# Verify
mongosh "$MONGO_URI" --quiet --eval "
  use('${DB_NAME}');
  print('📊 Database stats:');
  print('   Users: ' + db.users.countDocuments());
  print('   TopupRequests: ' + db.topuprequests.countDocuments());
  print('   Settings: ' + db.settings.countDocuments());
  print('   AuditLogs: ' + db.auditlogs.countDocuments());
  print('   WebhookLogs: ' + db.webhooklogs.countDocuments());
"
