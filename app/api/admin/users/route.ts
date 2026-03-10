import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ezai } from '@/lib/ezai/client'

// GET /api/admin/users — list all users
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

    const { data: users } = await admin
      .from('rb_users')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json(users || [])
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/users — create user (provision EzAI account)
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

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    // Get the target user's profile
    const { data: targetProfile } = await admin
      .from('rb_users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (targetProfile.ezai_user_id) {
      return NextResponse.json({ error: 'User already has an EzAI account' }, { status: 400 })
    }

    // Get user email from auth
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(user_id)
    if (!authUser?.email) return NextResponse.json({ error: 'User email not found' }, { status: 404 })

    // Create EzAI user
    const ezaiUser = await ezai.createUser(authUser.email, targetProfile.name || authUser.email)

    // Update profile with EzAI credentials
    const { data: updated } = await admin
      .from('rb_users')
      .update({
        ezai_user_id: ezaiUser.id,
        ezai_api_key: ezaiUser.api_key,
      })
      .eq('id', user_id)
      .select()
      .single()

    await admin.from('rb_audit_logs').insert({
      actor_id: user.id,
      action: 'user_provisioned',
      target_type: 'rb_user',
      target_id: user_id,
      metadata: { ezai_user_id: ezaiUser.id },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('Admin create user error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
