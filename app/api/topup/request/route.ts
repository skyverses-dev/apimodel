import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTransferContent } from '@/lib/utils/transfer-code'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { vnd_amount, plan_name } = body
    const isPlan = !!plan_name

    if (!vnd_amount || vnd_amount < 50000) {
      return NextResponse.json({ error: 'Minimum 50,000 VND' }, { status: 400 })
    }

    if (isPlan && !['starter', 'pro', 'max', 'ultra'].includes(plan_name)) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get user profile + settings
    const [{ data: profile }, { data: settingsRows }] = await Promise.all([
      admin.from('rb_users').select('*').eq('id', user.id).single(),
      admin.from('rb_settings').select('*'),
    ])

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const settings: Record<string, string> = {}
    settingsRows?.forEach(r => { settings[r.key] = r.value })

    // Ensure user has a user_code
    if (!profile.user_code) {
      return NextResponse.json({ error: 'Tài khoản chưa được kích hoạt. Liên hệ admin.' }, { status: 400 })
    }

    const exchangeRate = Number(settings.exchange_rate || 26000)
    const leverage = profile.leverage || Number(settings.user_leverage || 30)

    // For plan: usd_amount = plan VND price / exchange_rate, credit_amount = 0 (not credit top-up)
    // For credit: standard calculation
    const usdAmount = isPlan ? vnd_amount / exchangeRate : vnd_amount / exchangeRate
    const creditAmount = isPlan ? 0 : usdAmount * leverage

    const transferContent = generateTransferContent(profile.user_code)

    // Check if identical transfer_content already exists (same day, same user, same type)
    const { data: existingRequest } = await admin
      .from('rb_topup_requests')
      .select('id, transfer_content, status, type, plan_name')
      .eq('transfer_content', transferContent)
      .eq('status', 'pending')
      .eq('type', isPlan ? 'plan' : 'credit')
      .maybeSingle()

    if (existingRequest) {
      // For plan: only reuse if same plan
      if (!isPlan || existingRequest.plan_name === plan_name) {
        const { data: full } = await admin
          .from('rb_topup_requests')
          .select('*')
          .eq('id', existingRequest.id)
          .single()
        return NextResponse.json(full)
      }
    }

    // Create new topup request
    const { data, error } = await admin.from('rb_topup_requests').insert({
      user_id: user.id,
      vnd_amount,
      usd_amount: usdAmount,
      credit_amount: creditAmount,
      exchange_rate: exchangeRate,
      leverage,
      transfer_content: transferContent,
      status: 'pending',
      type: isPlan ? 'plan' : 'credit',
      ...(isPlan ? { plan_name } : {}),
    }).select().single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('Topup request error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
