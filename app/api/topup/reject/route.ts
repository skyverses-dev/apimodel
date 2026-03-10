import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { topup_id, admin_note } = await request.json()
    if (!topup_id) return NextResponse.json({ error: 'topup_id required' }, { status: 400 })

    const { data: topup } = await admin
      .from('rb_topup_requests')
      .select('status')
      .eq('id', topup_id)
      .single()

    if (!topup) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (topup.status !== 'pending') {
      return NextResponse.json({ error: `Cannot reject a ${topup.status} request` }, { status: 400 })
    }

    const { data: updated, error } = await admin
      .from('rb_topup_requests')
      .update({
        status: 'rejected',
        admin_note: admin_note || null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', topup_id)
      .select()
      .single()

    if (error) throw error

    await admin.from('rb_audit_logs').insert({
      actor_id: user.id,
      action: 'topup_rejected',
      target_type: 'topup_request',
      target_id: topup_id,
      metadata: { admin_note },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Topup reject error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
