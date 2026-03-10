/**
 * Migration Script: Supabase → MongoDB
 * 
 * Reads all data from Supabase REST API and inserts into MongoDB.
 * Run with: npx tsx scripts/migrate-supabase-to-mongo.ts
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// ============================================
// Supabase config (old values from .env.local)
// ============================================
const SUPABASE_URL = 'https://z0.10xyoutube.net'
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MjY4NDg4MCwiZXhwIjo0OTI4MzU4NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.fK91KJgYYviMxi7QWn751UAgefLUU9JjQWiR7BRHMEE'

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/2brain'

// Default password for migrated users (they should reset)
const DEFAULT_PASSWORD = 'changeme123'

// ============================================
// Supabase REST API helpers
// ============================================
async function supabaseGet(table: string, query = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
    const res = await fetch(url, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) {
        console.error(`❌ Failed to fetch ${table}: ${res.status} ${res.statusText}`)
        const text = await res.text()
        console.error(text)
        return []
    }
    return res.json()
}

async function supabaseAuthListUsers() {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`
    const res = await fetch(url, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) {
        console.error(`❌ Failed to fetch auth users: ${res.status}`)
        const text = await res.text()
        console.error(text)
        return []
    }
    const data = await res.json()
    return data.users || data || []
}

// ============================================
// MongoDB Schemas (inline for standalone script)
// ============================================
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, default: null },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    ezai_user_id: { type: String, default: null },
    ezai_api_key: { type: String, default: null },
    user_code: { type: String, default: null },
    leverage: { type: Number, default: 1 },
    // Store old Supabase ID for reference mapping
    _supabase_id: { type: String, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const TopupRequestSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vnd_amount: { type: Number, required: true },
    usd_amount: { type: Number, required: true },
    credit_amount: { type: Number, required: true },
    exchange_rate: { type: Number, required: true },
    leverage: { type: Number, required: true },
    transfer_content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    type: { type: String, enum: ['credit', 'plan'], default: 'credit' },
    plan_name: { type: String, default: null },
    admin_note: { type: String, default: null },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approved_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const SettingsSchema = new mongoose.Schema({
    exchange_rate: { type: Number, default: 25000 },
    user_leverage: { type: Number, default: 1 },
    bank_account: { type: String, default: '' },
    bank_name: { type: String, default: '' },
    bank_holder: { type: String, default: '' },
    bank_bin: { type: String, default: '' },
}, { timestamps: { createdAt: false, updatedAt: 'updated_at' } })

const AuditLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } })

// ============================================
// Main Migration
// ============================================
async function migrate() {
    console.log('🚀 Starting Supabase → MongoDB migration...\n')

    // Connect to MongoDB
    console.log(`📦 Connecting to MongoDB: ${MONGODB_URI}`)
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB connected\n')

    const User = mongoose.model('User', UserSchema)
    const TopupRequest = mongoose.model('TopupRequest', TopupRequestSchema)
    const Settings = mongoose.model('Settings', SettingsSchema)
    const AuditLog = mongoose.model('AuditLog', AuditLogSchema)

    // ---- Step 1: Fetch all Supabase data ----
    console.log('📥 Fetching data from Supabase...')

    const [authUsers, rbUsers, rbTopups, rbSettings, rbAuditLogs] = await Promise.all([
        supabaseAuthListUsers(),
        supabaseGet('rb_users', 'order=created_at.asc'),
        supabaseGet('rb_topup_requests', 'order=created_at.asc'),
        supabaseGet('rb_settings', ''),
        supabaseGet('rb_audit_logs', 'order=created_at.asc'),
    ])

    console.log(`  Auth users: ${authUsers.length}`)
    console.log(`  rb_users: ${rbUsers.length}`)
    console.log(`  rb_topup_requests: ${rbTopups.length}`)
    console.log(`  rb_settings: ${rbSettings.length}`)
    console.log(`  rb_audit_logs: ${rbAuditLogs.length}`)
    console.log('')

    // ---- Step 2: Build email map from auth users ----
    const emailMap: Record<string, string> = {}
    const createdAtMap: Record<string, string> = {}
    authUsers.forEach((au: { id: string; email?: string; created_at?: string }) => {
        if (au.id && au.email) emailMap[au.id] = au.email
        if (au.id && au.created_at) createdAtMap[au.id] = au.created_at
    })

    // ---- Step 3: Migrate Users ----
    console.log('👤 Migrating users...')
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    const supabaseIdToMongoId: Record<string, mongoose.Types.ObjectId> = {}
    let userCount = 0

    for (const rbUser of rbUsers) {
        const email = emailMap[rbUser.id]
        if (!email) {
            console.log(`  ⚠ Skipping user ${rbUser.id} — no email found in auth`)
            continue
        }

        // Check if already migrated
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            console.log(`  ⏭ User ${email} already exists, mapping ID`)
            supabaseIdToMongoId[rbUser.id] = existing._id as mongoose.Types.ObjectId
            continue
        }

        const newUser = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: rbUser.name || email.split('@')[0],
            role: rbUser.role || 'user',
            ezai_user_id: rbUser.ezai_user_id || null,
            ezai_api_key: rbUser.ezai_api_key || null,
            user_code: rbUser.user_code || null,
            leverage: rbUser.leverage || 1,
            _supabase_id: rbUser.id,
            created_at: rbUser.created_at || createdAtMap[rbUser.id] || new Date(),
            updated_at: rbUser.updated_at || new Date(),
        })

        supabaseIdToMongoId[rbUser.id] = newUser._id as mongoose.Types.ObjectId
        userCount++
        console.log(`  ✅ ${email} (${rbUser.role}) → ${newUser._id}`)
    }
    console.log(`  📊 Migrated ${userCount} users\n`)

    // ---- Step 4: Migrate Topup Requests ----
    console.log('💰 Migrating topup requests...')
    let topupCount = 0

    for (const topup of rbTopups) {
        const mongoUserId = supabaseIdToMongoId[topup.user_id]
        if (!mongoUserId) {
            console.log(`  ⚠ Skipping topup ${topup.id} — user ${topup.user_id} not found`)
            continue
        }

        const approvedByMongoId = topup.approved_by ? supabaseIdToMongoId[topup.approved_by] : null

        await TopupRequest.create({
            user_id: mongoUserId,
            vnd_amount: topup.vnd_amount,
            usd_amount: topup.usd_amount,
            credit_amount: topup.credit_amount,
            exchange_rate: topup.exchange_rate,
            leverage: topup.leverage || 1,
            transfer_content: topup.transfer_content,
            status: topup.status,
            type: topup.type || 'credit',
            plan_name: topup.plan_name || null,
            admin_note: topup.admin_note || null,
            approved_by: approvedByMongoId || null,
            approved_at: topup.approved_at || null,
            created_at: topup.created_at,
            updated_at: topup.updated_at || topup.created_at,
        })
        topupCount++
    }
    console.log(`  📊 Migrated ${topupCount} topup requests\n`)

    // ---- Step 5: Migrate Settings ----
    console.log('⚙️ Migrating settings...')
    if (rbSettings.length > 0) {
        // Supabase stores settings as key-value rows
        const settingsObj: Record<string, string | number> = {}
        rbSettings.forEach((row: { key: string; value: string }) => {
            const numVal = Number(row.value)
            settingsObj[row.key] = isNaN(numVal) ? row.value : numVal
        })

        await Settings.findOneAndUpdate({}, { $set: settingsObj }, { upsert: true, new: true })
        console.log(`  ✅ Settings migrated: ${Object.keys(settingsObj).join(', ')}`)
    } else {
        console.log('  ⏭ No settings to migrate')
    }
    console.log('')

    // ---- Step 6: Migrate Audit Logs ----
    console.log('📋 Migrating audit logs...')
    let auditCount = 0

    for (const log of rbAuditLogs) {
        const mongoUserId = log.actor_id ? supabaseIdToMongoId[log.actor_id] : null
        if (!mongoUserId) continue

        await AuditLog.create({
            user_id: mongoUserId,
            action: log.action,
            details: {
                target_type: log.target_type,
                target_id: log.target_id,
                metadata: log.metadata,
            },
            created_at: log.created_at,
        })
        auditCount++
    }
    console.log(`  📊 Migrated ${auditCount} audit logs\n`)

    // ---- Summary ----
    console.log('═══════════════════════════════════════')
    console.log('✅ Migration Complete!')
    console.log('═══════════════════════════════════════')
    console.log(`  Users:          ${userCount}`)
    console.log(`  Topup Requests: ${topupCount}`)
    console.log(`  Settings:       ${rbSettings.length} keys`)
    console.log(`  Audit Logs:     ${auditCount}`)
    console.log('')
    console.log(`⚠️  All migrated users have password: "${DEFAULT_PASSWORD}"`)
    console.log('   Ask them to change passwords after migration.')
    console.log('')

    await mongoose.disconnect()
    process.exit(0)
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
