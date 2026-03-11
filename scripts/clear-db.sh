#!/bin/bash
# ============================================
# 2brain - Clear Database (keep admin only)
# Usage: bash scripts/clear-db.sh
# ============================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

ADMIN_EMAIL="xvirion@gmail.com"
DB_NAME="2brain"

echo ""
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}   🧹 2BRAIN Database Cleanup${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""

# Safety prompt
echo -e "${YELLOW}⚠️  This will DELETE:${NC}"
echo "   • All users except ${ADMIN_EMAIL}"
echo "   • All topup requests"
echo "   • All audit logs"
echo "   • All webhook logs"
echo ""
echo -e "${GREEN}✓ Kept:${NC} Settings, admin user"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Cancelled.${NC}"
  exit 0
fi

echo ""

mongosh --quiet --eval "
  use('${DB_NAME}');

  const admin = db.users.findOne({ email: '${ADMIN_EMAIL}' });
  if (!admin) {
    print('❌ Admin ${ADMIN_EMAIL} not found!');
    quit(1);
  }
  print('✅ Found admin: ' + admin.email);

  print('');
  print('📊 Before:');
  print('   Users: ' + db.users.countDocuments());
  print('   TopupRequests: ' + db.topuprequests.countDocuments());
  print('   AuditLogs: ' + db.auditlogs.countDocuments());
  print('   WebhookLogs: ' + db.webhooklogs.countDocuments());

  const r1 = db.users.deleteMany({ _id: { \$ne: admin._id } });
  print('');
  print('🗑️  Deleted ' + r1.deletedCount + ' users');

  const r2 = db.topuprequests.deleteMany({});
  print('🗑️  Deleted ' + r2.deletedCount + ' topup requests');

  const r3 = db.auditlogs.deleteMany({});
  print('🗑️  Deleted ' + r3.deletedCount + ' audit logs');

  const r4 = db.webhooklogs.deleteMany({});
  print('🗑️  Deleted ' + r4.deletedCount + ' webhook logs');

  print('');
  print('📊 After:');
  print('   Users: ' + db.users.countDocuments());
  print('   TopupRequests: ' + db.topuprequests.countDocuments());
  print('   Settings: ' + db.settings.countDocuments() + ' (kept)');

  print('');
  print('✅ Cleanup complete!');
"

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Database cleared!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
