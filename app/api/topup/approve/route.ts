import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ezai } from '@/lib/ezai/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Check admin role
    const { data: adminProfile } = await admin.from('rb_users').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { topup_id, admin_note } = await request.json()
    if (!topup_id) return NextResponse.json({ error: 'topup_id required' }, { status: 400 })

    // Get the topup request
    const { data: topup, error: topupError } = await admin
      .from('rb_topup_requests')
      .select('*')
      .eq('id', topup_id)
      .single()

    if (topupError || !topup) {
      return NextResponse.json({ error: 'Topup request not found' }, { status: 404 })
    }

    if (topup.status !== 'pending') {
      return NextResponse.json({ error: `Cannot approve a ${topup.status} request` }, { status: 400 })
    }

    // Get user profile for EzAI user ID
    const { data: userProfile } = await admin
      .from('rb_users')
      .select('ezai_user_id, ezai_api_key')
      .eq('id', topup.user_id)
      .single()

    if (!userProfile?.ezai_user_id) {
      return NextResponse.json({ error: 'User does not have an EzAI account' }, { status: 400 })
    }

    // Call EzAI depending on request type
    if (topup.type === 'plan' && topup.plan_name) {
      await ezai.activatePlan(userProfile.ezai_user_id, topup.plan_name as 'starter' | 'pro' | 'max' | 'ultra')
    } else {
      await ezai.topupUser(userProfile.ezai_user_id, topup.usd_amount)
    }

    // Update topup request status
    const { data: updated, error: updateError } = await admin
      .from('rb_topup_requests')
      .update({
        status: 'approved',
        admin_note: admin_note || null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', topup_id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log the action
    await admin.from('rb_audit_logs').insert({
      actor_id: user.id,
      action: 'topup_approved',
      target_type: 'topup_request',
      target_id: topup_id,
      metadata: {
        user_id: topup.user_id,
        vnd_amount: topup.vnd_amount,
        usd_amount: topup.usd_amount,
        credit_amount: topup.credit_amount,
      },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Topup approve error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
