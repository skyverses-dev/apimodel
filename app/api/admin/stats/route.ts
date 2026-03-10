import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ezai } from '@/lib/ezai/client'
import { AdminUserStat } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: adminProfile } = await admin
      .from('rb_users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [rbUsersResult, ezaiUsersResult, authUsersResult] = await Promise.allSettled([
      admin
        .from('rb_users')
        .select('id, name, ezai_user_id')
        .not('ezai_user_id', 'is', null)
        .order('created_at', { ascending: false }),
      ezai.listUsers(1, 100),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ])

    const rbUsers = rbUsersResult.status === 'fulfilled' ? (rbUsersResult.value.data ?? []) : []
    const ezaiUsers = ezaiUsersResult.status === 'fulfilled' ? ezaiUsersResult.value.users : []
    const authUsers = authUsersResult.status === 'fulfilled' ? (authUsersResult.value.data?.users ?? []) : []

    // Build email map from auth users
    const emailMap: Record<string, string> = {}
    authUsers.forEach((au) => {
      if (au.id && au.email) emailMap[au.id] = au.email
    })

    // Build EzAI data map by ezai_user_id
    const ezaiMap: Record<string, typeof ezaiUsers[0]> = {}
    ezaiUsers.forEach((eu) => {
      ezaiMap[eu.id] = eu
    })

    // Merge
    const stats: AdminUserStat[] = rbUsers.map((rb) => {
      const ezaiData = rb.ezai_user_id ? ezaiMap[rb.ezai_user_id] : null
      return {
        rb_user_id: rb.id,
        name: rb.name,
        email: emailMap[rb.id] ?? '',
        ezai_user_id: rb.ezai_user_id,
        balance: ezaiData?.balance ?? 0,
        plan_type: ezaiData?.plan_type ?? 'none',
        daily_limit: ezaiData?.daily_limit ?? 0,
        daily_used: ezaiData?.daily_used ?? 0,
        plan_expires_at: ezaiData?.plan_expires_at ?? null,
      }
    })

    // Sort by daily_used desc
    stats.sort((a, b) => b.daily_used - a.daily_used)

    return NextResponse.json({ stats, total: stats.length })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
