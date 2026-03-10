#!/bin/bash
# ============================================
# Setup MongoDB Database & User for 2brain
# Run on Linux server: bash scripts/setup-mongo.sh
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ---- Config ----
DB_NAME="2brain"
DB_USER="2brain_user"
DB_PASS="$(openssl rand -hex 16)"  # Random 32-char password

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  MongoDB Setup for 2brain v2${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

# ---- Check MongoDB is running ----
if ! command -v mongosh &> /dev/null; then
    echo -e "${RED}❌ mongosh not found. Install MongoDB first.${NC}"
    echo "   Ubuntu: sudo apt install -y mongodb-mongosh"
    echo "   Or: https://www.mongodb.com/docs/mongodb-shell/install/"
    exit 1
fi

if ! mongosh --eval "db.runCommand({ ping: 1 })" --quiet &> /dev/null; then
    echo -e "${RED}❌ MongoDB is not running. Start it first:${NC}"
    echo "   sudo systemctl start mongod"
    exit 1
fi

echo -e "${GREEN}✅ MongoDB is running${NC}"
echo ""

# ---- Create database and user ----
echo -e "${YELLOW}📦 Creating database '${DB_NAME}' and user '${DB_USER}'...${NC}"

mongosh --quiet <<EOF
use ${DB_NAME}

// Drop existing user if exists (ignore error)
try { db.dropUser("${DB_USER}") } catch(e) {}

// Create user with readWrite access
db.createUser({
  user: "${DB_USER}",
  pwd: "${DB_PASS}",
  roles: [
    { role: "readWrite", db: "${DB_NAME}" }
  ]
})

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ _supabase_id: 1 }, { sparse: true })
db.topuprequests.createIndex({ user_id: 1 })
db.topuprequests.createIndex({ status: 1 })
db.topuprequests.createIndex({ created_at: -1 })
db.auditlogs.createIndex({ user_id: 1 })
db.auditlogs.createIndex({ created_at: -1 })

print("Done!")
EOF

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ MongoDB Setup Complete!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  Database:  ${GREEN}${DB_NAME}${NC}"
echo -e "  User:      ${GREEN}${DB_USER}${NC}"
echo -e "  Password:  ${GREEN}${DB_PASS}${NC}"
echo ""
echo -e "  ${YELLOW}Connection strings:${NC}"
echo ""
echo -e "  ${GREEN}Without auth (if MongoDB has no auth):${NC}"
echo -e "  MONGODB_URI=mongodb://localhost:27017/${DB_NAME}"
echo ""
echo -e "  ${GREEN}With auth:${NC}"
echo -e "  MONGODB_URI=mongodb://${DB_USER}:${DB_PASS}@localhost:27017/${DB_NAME}?authSource=${DB_NAME}"
echo ""
echo -e "  ${YELLOW}➡ Add the MONGODB_URI to your .env.local on the server${NC}"
echo ""
