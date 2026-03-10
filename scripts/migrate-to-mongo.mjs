#!/usr/bin/env node
/**
 * Migration Script: Supabase → MongoDB (Server)
 * 
 * Run on Linux server:
 *   node scripts/migrate-to-mongo.mjs
 * 
 * Or with custom MongoDB URI:
 *   MONGODB_URI="mongodb://user:pass@localhost:27017/2brain" node scripts/migrate-to-mongo.mjs
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// ============================================
// Configuration
// ============================================
const SUPABASE_URL = 'https://z0.10xyoutube.net'
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MjY4NDg4MCwiZXhwIjo0OTI4MzU4NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.fK91KJgYYviMxi7QWn751UAgefLUU9JjQWiR7BRHMEE'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/2brain'
const DEFAULT_PASSWORD = 'changeme123'

// ============================================
// Supabase REST API
// ============================================
async function supabaseGet(table, query = '') {
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
        return []
    }
    const data = await res.json()
    return data.users || data || []
}

// ============================================
// MongoDB Schemas
// ============================================
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, default: null },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    ezai_user_id: { type: String, default: null },
    ezai_api_key: { type: String, default: null },
    user_code: { type: String, default: null },
    leverage: { type: Number, default: 1 },
    _supabase_id: { type: String, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const TopupRequestSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vnd_amount: Number,
    usd_amount: Number,
    credit_amount: Number,
    exchange_rate: Number,
    leverage: Number,
    transfer_content: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    type: { type: String, enum: ['credit', 'plan'], default: 'credit' },
    plan_name: { type: String, default: null },
    admin_note: { type: String, default: null },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approved_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const SettingsSchema = new mongoose.Schema({}, { strict: false, timestamps: { createdAt: false, updatedAt: 'updated_at' } })

const AuditLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: String,
    details: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } })

// ============================================
// Main
// ============================================
async function migrate() {
    console.log('')
    console.log('══════════════════════════════════════')
    console.log('  Supabase → MongoDB Migration')
    console.log('══════════════════════════════════════')
    console.log('')

    // Connect MongoDB
    console.log(`📦 MongoDB: ${MONGODB_URI}`)
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected\n')

    const User = mongoose.model('User', UserSchema)
    const TopupRequest = mongoose.model('TopupRequest', TopupRequestSchema)
    const Settings = mongoose.model('Settings', SettingsSchema)
    const AuditLog = mongoose.model('AuditLog', AuditLogSchema)

    // Drop existing data (fresh migration)
    const existing = await User.countDocuments()
    if (existing > 0) {
        console.log(`⚠️  Found ${existing} existing users in MongoDB.`)
        console.log('   Dropping all collections for fresh migration...')
        await Promise.all([
            User.deleteMany({}),
            TopupRequest.deleteMany({}),
            Settings.deleteMany({}),
            AuditLog.deleteMany({}),
        ])
        console.log('   ✅ Collections cleared\n')
    }

    // Fetch Supabase data
    console.log('📥 Fetching from Supabase...')
    const [authUsers, rbUsers, rbTopups, rbSettings, rbAuditLogs] = await Promise.all([
        supabaseAuthListUsers(),
        supabaseGet('rb_users', 'order=created_at.asc'),
        supabaseGet('rb_topup_requests', 'order=created_at.asc'),
        supabaseGet('rb_settings', ''),
        supabaseGet('rb_audit_logs', 'order=created_at.asc'),
    ])

    console.log(`   auth.users:        ${authUsers.length}`)
    console.log(`   rb_users:          ${rbUsers.length}`)
    console.log(`   rb_topup_requests: ${rbTopups.length}`)
    console.log(`   rb_settings:       ${rbSettings.length}`)
    console.log(`   rb_audit_logs:     ${rbAuditLogs.length}`)
    console.log('')

    // Email map from auth users
    const emailMap = {}
    const createdAtMap = {}
    for (const au of authUsers) {
        if (au.id && au.email) emailMap[au.id] = au.email
        if (au.id && au.created_at) createdAtMap[au.id] = au.created_at
    }

    // ---- Users ----
    console.log('👤 Migrating users...')
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    const idMap = {} // supabase_id → mongo_id
    let userCount = 0

    for (const rb of rbUsers) {
        const email = emailMap[rb.id]
        if (!email) {
            console.log(`   ⚠ Skip ${rb.id} — no email`)
            continue
        }

        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: rb.name || email.split('@')[0],
            role: rb.role || 'user',
            ezai_user_id: rb.ezai_user_id || null,
            ezai_api_key: rb.ezai_api_key || null,
            user_code: rb.user_code || null,
            leverage: rb.leverage || 1,
            _supabase_id: rb.id,
            created_at: rb.created_at || createdAtMap[rb.id],
            updated_at: rb.updated_at || new Date(),
        })

        idMap[rb.id] = user._id
        userCount++
        console.log(`   ✅ ${email} (${rb.role})`)
    }
    console.log(`   Total: ${userCount}\n`)

    // ---- Topup Requests ----
    console.log('💰 Migrating topup requests...')
    let topupCount = 0

    for (const t of rbTopups) {
        const userId = idMap[t.user_id]
        if (!userId) { continue }

        const approvedBy = t.approved_by ? idMap[t.approved_by] : null

        await TopupRequest.create({
            user_id: userId,
            vnd_amount: t.vnd_amount,
            usd_amount: t.usd_amount,
            credit_amount: t.credit_amount,
            exchange_rate: t.exchange_rate,
            leverage: t.leverage || 1,
            transfer_content: t.transfer_content,
            status: t.status,
            type: t.type || 'credit',
            plan_name: t.plan_name || null,
            admin_note: t.admin_note || null,
            approved_by: approvedBy || undefined,
            approved_at: t.approved_at || null,
            created_at: t.created_at,
            updated_at: t.updated_at || t.created_at,
        })
        topupCount++
    }
    console.log(`   Total: ${topupCount}\n`)

    // ---- Settings ----
    console.log('⚙️  Migrating settings...')
    if (rbSettings.length > 0) {
        const obj = {}
        for (const row of rbSettings) {
            const num = Number(row.value)
            obj[row.key] = isNaN(num) ? row.value : num
        }
        await Settings.create(obj)
        console.log(`   ✅ ${Object.keys(obj).join(', ')}\n`)
    } else {
        console.log('   No settings\n')
    }

    // ---- Audit Logs ----
    console.log('📋 Migrating audit logs...')
    let auditCount = 0

    for (const log of rbAuditLogs) {
        const userId = log.actor_id ? idMap[log.actor_id] : null
        if (!userId) continue

        await AuditLog.create({
            user_id: userId,
            action: log.action,
            details: { target_type: log.target_type, target_id: log.target_id, metadata: log.metadata },
            created_at: log.created_at,
        })
        auditCount++
    }
    console.log(`   Total: ${auditCount}\n`)

    // ---- Done ----
    console.log('══════════════════════════════════════')
    console.log('  ✅ Migration Complete!')
    console.log('══════════════════════════════════════')
    console.log(`  Users:          ${userCount}`)
    console.log(`  Topup Requests: ${topupCount}`)
    console.log(`  Settings:       ${rbSettings.length} keys`)
    console.log(`  Audit Logs:     ${auditCount}`)
    console.log('')
    console.log(`  ⚠️  Default password: "${DEFAULT_PASSWORD}"`)
    console.log('  Users should change passwords after login.')
    console.log('')

    await mongoose.disconnect()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
