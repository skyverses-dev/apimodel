import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest, Settings } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { generateTransferContent } from '@/lib/utils/transfer-code'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { vnd_amount, plan_name } = body
    const isPlan = !!plan_name

    if (!vnd_amount || (!isPlan && vnd_amount < 50000)) {
      return NextResponse.json({ error: 'Minimum 50,000 VND' }, { status: 400 })
    }

    if (isPlan && !['starter', 'pro', 'max', 'ultra'].includes(plan_name)) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    await connectDB()

    const [profile, settings] = await Promise.all([
      User.findById(session.userId).lean(),
      Settings.findOne().lean(),
    ])

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Auto-generate user_code if missing
    let userCode = profile.user_code
    if (!userCode) {
      const lastUser = await User.findOne({ user_code: { $ne: null } })
        .sort({ user_code: -1 })
        .select('user_code')
        .lean()
      const lastNum = lastUser?.user_code ? parseInt(lastUser.user_code.replace('U', ''), 10) : 0
      userCode = `U${String(lastNum + 1).padStart(4, '0')}`
      await User.findByIdAndUpdate(session.userId, { user_code: userCode })
    }

    const exchangeRate = settings?.exchange_rate || 26000
    const leverage = profile.leverage || settings?.user_leverage || 30

    const usdAmount = vnd_amount / exchangeRate
    const creditAmount = isPlan ? 0 : usdAmount * leverage

    // Check if user already has a pending request with same amount & type
    const existingRequest = await TopupRequest.findOne({
      user_id: session.userId,
      vnd_amount,
      status: 'pending',
      type: isPlan ? 'plan' : 'credit',
      ...(isPlan ? { plan_name } : {}),
    }).lean()

    if (existingRequest) {
      return NextResponse.json({
        ...existingRequest,
        id: existingRequest._id.toString(),
        user_id: existingRequest.user_id.toString(),
      })
    }

    const transferContent = generateTransferContent(userCode)

    // Create new topup request
    const topup = await TopupRequest.create({
      user_id: session.userId,
      vnd_amount,
      usd_amount: usdAmount,
      credit_amount: creditAmount,
      exchange_rate: exchangeRate,
      leverage,
      transfer_content: transferContent,
      status: 'pending',
      type: isPlan ? 'plan' : 'credit',
      ...(isPlan ? { plan_name } : {}),
    })

    return NextResponse.json({
      ...topup.toJSON(),
      id: topup._id.toString(),
      user_id: topup.user_id.toString(),
    })
  } catch (err: unknown) {
    console.error('Topup request error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
