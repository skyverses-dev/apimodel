import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import connectDB from './lib/db/mongodb'

// ============================================
// Supabase config
// ============================================
const SUPABASE_URL = 'https://z0.10xyoutube.net'
const SUPABASE_SERVICE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MjY4NDg4MCwiZXhwIjo0OTI4MzU4NDgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.fK91KJgYYviMxi7QWn751UAgefLUU9JjQWiR7BRHMEE'
const DEFAULT_PASSWORD = 'changeme123'

async function supabaseGet(table: string, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) return []
    return res.json()
}

async function supabaseAuthListUsers() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.users || data || []
}

// ============================================
// Migration logic
// ============================================
async function runMigration() {
    const { User, TopupRequest, Settings, AuditLog } = await import('./lib/db/models')

    await connectDB()

    // Clear all existing data for fresh migration
    console.log('[Migration] 🗑️ Clearing existing data...')
    await Promise.all([
        User.deleteMany({}),
        TopupRequest.deleteMany({}),
        Settings.deleteMany({}),
        AuditLog.deleteMany({}),
    ])
    console.log('[Migration] ✅ All collections cleared')

    console.log('[Migration] 🚀 Starting Supabase → MongoDB migration...')

    // Fetch all data from Supabase
    const [authUsers, rbUsers, rbTopups, rbSettings, rbAuditLogs] = await Promise.all([
        supabaseAuthListUsers(),
        supabaseGet('rb_users', 'order=created_at.asc'),
        supabaseGet('rb_topup_requests', 'order=created_at.asc'),
        supabaseGet('rb_settings', ''),
        supabaseGet('rb_audit_logs', 'order=created_at.asc'),
    ])

    console.log(`[Migration] Fetched: ${authUsers.length} auth, ${rbUsers.length} users, ${rbTopups.length} topups, ${rbSettings.length} settings, ${rbAuditLogs.length} logs`)

    // Email map
    const emailMap: Record<string, string> = {}
    const createdAtMap: Record<string, string> = {}
    authUsers.forEach((au: { id: string; email?: string; created_at?: string }) => {
        if (au.id && au.email) emailMap[au.id] = au.email
        if (au.id && au.created_at) createdAtMap[au.id] = au.created_at
    })

    // Users
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    const idMap: Record<string, mongoose.Types.ObjectId> = {}
    let migratedUsers = 0

    for (const rb of rbUsers) {
        const email = emailMap[rb.id]
        if (!email) continue

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
        })
        idMap[rb.id] = user._id as mongoose.Types.ObjectId
        migratedUsers++
        console.log(`[Migration] ✅ User: ${email} (${rb.role})`)
    }

    // Topup Requests
    let migratedTopups = 0
    for (const t of rbTopups) {
        const userId = idMap[t.user_id]
        if (!userId) continue
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
            approved_by: t.approved_by ? idMap[t.approved_by] : undefined,
            approved_at: t.approved_at || null,
        })
        migratedTopups++
    }

    // Settings
    if (rbSettings.length > 0) {
        const obj: Record<string, string | number> = {}
        rbSettings.forEach((row: { key: string; value: string }) => {
            const num = Number(row.value)
            obj[row.key] = isNaN(num) ? row.value : num
        })
        await Settings.findOneAndUpdate({}, { $set: obj }, { upsert: true })
        console.log(`[Migration] ✅ Settings: ${Object.keys(obj).join(', ')}`)
    }

    // Audit Logs
    let migratedLogs = 0
    for (const log of rbAuditLogs) {
        const userId = log.actor_id ? idMap[log.actor_id] : null
        if (!userId) continue
        await AuditLog.create({
            user_id: userId,
            action: log.action,
            details: { target_type: log.target_type, target_id: log.target_id, metadata: log.metadata },
        })
        migratedLogs++
    }

    console.log(`[Migration] ══════════════════════════════════`)
    console.log(`[Migration] ✅ Done! Users: ${migratedUsers}, Topups: ${migratedTopups}, Logs: ${migratedLogs}`)
    console.log(`[Migration] ⚠️  Default password: "${DEFAULT_PASSWORD}"`)
    console.log(`[Migration] ══════════════════════════════════`)
}

// ============================================
// Next.js instrumentation — runs once on server start
// ============================================
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            await runMigration()
        } catch (err) {
            console.error('[Migration] ❌ Failed:', err)
        }
    }
}
