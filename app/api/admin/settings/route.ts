import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: adminProfile } = await admin.from('rb_users').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data } = await admin.from('rb_settings').select('*')
    const settings: Record<string, string> = {}
    data?.forEach(r => { settings[r.key] = r.value })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/settings — upsert a setting key/value
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: adminProfile } = await admin.from('rb_users').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await admin
      .from('rb_settings')
      .upsert(updates, { onConflict: 'key' })

    if (error) throw error

    await admin.from('rb_audit_logs').insert({
      actor_id: user.id,
      action: 'settings_updated',
      target_type: 'rb_settings',
      target_id: null,
      metadata: body,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Admin settings error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
