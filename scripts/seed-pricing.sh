#!/bin/bash
# Seed initial pricing plans into MongoDB
# Usage: bash scripts/seed-pricing.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -f "$ENV_FILE" ]; then
  MONGO_URI=$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d'=' -f2-)
fi
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/2brain}"

echo "🏷️  Seeding pricing plans..."

mongosh "$MONGO_URI" --quiet --eval "
  use('2brain');

  // Only seed if empty
  if (db.pricingplans.countDocuments() > 0) {
    print('⚠️  Pricing plans already exist (' + db.pricingplans.countDocuments() + '). Skipping seed.');
    quit(0);
  }

  db.pricingplans.insertMany([
    {
      name: 'Pay-as-you-go',
      subtitle: '',
      price_label: 'x30',
      description: '100,000 VND → \$3.84 USD credit',
      description_sub: 'Không hết hạn, dùng khi cần',
      is_featured: false,
      order: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Monthly Plan',
      subtitle: 'Starter+',
      price_label: 'Starter+',
      description: 'Từ \$2/tháng — Daily limit cao hơn',
      description_sub: 'Phù hợp dùng thường xuyên',
      is_featured: true,
      order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  print('✅ Seeded ' + db.pricingplans.countDocuments() + ' pricing plans');
"
