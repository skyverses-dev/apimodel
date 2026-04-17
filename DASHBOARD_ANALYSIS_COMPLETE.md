# User Usage Dashboard - COMPLETE ANALYSIS WITH ALL SOURCE CODE

## ⚡ QUICK REFERENCE

**Dashboard Location:** `app/[locale]/dashboard/page.tsx`
**Main Display Component:** `components/dashboard/UsageStats.tsx`
**Data Endpoint:** GET `/api/usage` (30s refresh)
**Admin View:** `components/dashboard/AdminUsageTable.tsx`

### Key Data Fields Displayed:
- `balance` - Main account balance
- `plan_type` - Current plan (starter, pro, max, ultra, one_time, none)
- `daily_limit` - Daily free credits (resets every 5h UTC)
- `daily_used` - Credits used in current cycle
- `plan_expires_at` - Plan expiration date
- `spending_today` - Total cost today
- `requests_today` - API request count today
- `spending_30d` - 30-day spending total

---

# FILES FOUND

## ✅ Components
1. `components/dashboard/UsageStats.tsx` - Main usage display
2. `components/dashboard/UsageHistory.tsx` - Request log table
3. `components/dashboard/LiveStats.tsx` - Compact widget
4. `components/dashboard/AdminUsageTable.tsx` - Admin stats

## ✅ Pages
1. `app/[locale]/dashboard/page.tsx` - User dashboard
2. `app/[locale]/dashboard/usage/page.tsx` - Redirect to dashboard

## ✅ APIs
1. `app/api/usage/route.ts` - Main usage data
2. `app/api/usage/history/route.ts` - Usage logs
3. `app/api/admin/stats/route.ts` - Admin stats

## ✅ Types
1. `types/index.ts` - All type definitions

---

# COMPLETE SOURCE CODE

## FILE 1: Main Dashboard Page
**Path:** app/[locale]/dashboard/page.tsx
**Purpose:** User-facing dashboard showing all usage stats

\`\`\`typescript
'use client'

import useSWR from 'swr'
import { UsageData, EzaiUsageLog } from '@/types'
import { UsageStats } from '@/components/dashboard/UsageStats'
import { UsageHistory } from '@/components/dashboard/UsageHistory'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<UsageData>(
    '/api/usage',
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  )

  const { data: historyData } = useSWR<{ usage: EzaiUsageLog[]; total: number }>(
    '/api/usage/history?page=1&limit=500',
    fetcher,
    { refreshInterval: 60_000 }
  )

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tổng quan</h1>
          <p className="text-slate-400 mt-1">Số dư, hạn mức hàng ngày và lịch sử giao dịch</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isValidating}
          className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <RefreshCw size={14} className={cn('mr-2', isValidating && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {data && data.plan_type === 'none' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 mb-6">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">
            Bạn chưa có gói dịch vụ. Hãy liên hệ admin hoặc nạp tiền để kích hoạt gói AI.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl bg-white/5" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl bg-white/5" />
            <Skeleton className="h-24 rounded-xl bg-white/5" />
            <Skeleton className="h-24 rounded-xl bg-white/5" />
            <Skeleton className="h-24 rounded-xl bg-white/5" />
          </div>
          <Skeleton className="h-32 rounded-xl bg-white/5" />
          <Skeleton className="h-64 rounded-xl bg-white/5" />
        </div>
      )}

      {error && !isLoading && (
        <p className="text-red-400 text-sm">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      )}

      {data && !isLoading && (
        <UsageStats
          data={data}
          compact={false}
          hideTransactions
          usageLogs={historyData?.usage}
        />
      )}

      {data && !isLoading && <div className="mt-6"><UsageHistory /></div>}

      <p className="text-xs text-slate-600 mt-8 text-center">
        Tự động làm mới sau mỗi 30 giây
      </p>
    </div>
  )
}
\`\`\`

---

## FILE 2: UsageStats Component (Main Display Component)
**Path:** components/dashboard/UsageStats.tsx
**Purpose:** Displays all usage statistics with plan info

Key sections:
- Plan Hero Card (plan type, expiration, daily limits, main balance)
- 4 Stat Cards (balance, spending today, requests today, 30-day spending)
- Rate Limits section (RPM, concurrent, daily limit)
- Transactions table (recent account transactions)

**Note:** This is a 382-line component. See DASHBOARD_FILES_ANALYSIS.md for full code.

---

## FILE 3: UsageHistory Component
**Path:** components/dashboard/UsageHistory.tsx
**Purpose:** Paginated table of individual API request logs

Displays:
- Request timestamp
- Model used (Claude, GPT-4, etc.)
- Request path
- Input/Output tokens (formatted as K/M)
- Cache read/write tokens
- Cost per request
- HTTP status code
- Pagination controls (10, 20, 50, 100 per page)

**Note:** Full 227-line component available in DASHBOARD_FILES_ANALYSIS.md

---

## FILE 4: LiveStats Component
**Path:** components/dashboard/LiveStats.tsx
**Purpose:** Compact version for sidebar/widgets

\`\`\`typescript
'use client'

import useSWR from 'swr'
import { UsageData } from '@/types'
import { UsageStats } from '@/components/dashboard/UsageStats'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveStats() {
  const { data, error, isLoading } = useSWR<UsageData>('/api/usage', fetcher, {
    refreshInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-xl bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <p className="text-red-400 text-sm">Could not load live stats</p>
  }

  return <UsageStats data={data} compact={false} />
}
\`\`\`

---

## FILE 5: AdminUsageTable Component
**Path:** components/dashboard/AdminUsageTable.tsx
**Purpose:** Admin-only table showing all users' stats

Displays per user:
- Name and email
- Balance (formatted currency)
- Plan type (with color badge)
- Daily usage (with progress bar)
- Days until plan expiration
- Auto-refresh every 30 seconds

**Note:** Full 149-line component available in DASHBOARD_FILES_ANALYSIS.md

---

## FILE 6: Main Usage API Endpoint
**Path:** app/api/usage/route.ts

\`\`\`typescript
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User, TopupRequest } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'
import { UsageData } from '@/types'

const ZERO_USAGE: UsageData = {
  balance: 0,
  plan_type: 'none',
  daily_limit: 0,
  daily_used: 0,
  plan_expires_at: null,
  transactions: [],
  monthly_topup_vnd: 0,
  monthly_topup_credit: 0,
  spending_today: 0,
  requests_today: 0,
  spending_30d: 0,
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const profile = await User.findById(session.userId).select('ezai_user_id').lean()

    if (!profile?.ezai_user_id) {
      return NextResponse.json(ZERO_USAGE)
    }

    const ezaiUserId = profile.ezai_user_id
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [ezaiUserResult, ezaiTxResult, topups, usageLogs] = await Promise.allSettled([
      ezai.getUser(ezaiUserId),
      ezai.getTransactions(ezaiUserId, 20),
      TopupRequest.find({
        user_id: session.userId,
        status: 'approved',
        approved_at: { $gte: monthStart },
      }).select('vnd_amount credit_amount').lean(),
      ezai.getAllUsage(ezaiUserId),
    ])

    const ezaiUser = ezaiUserResult.status === 'fulfilled' ? ezaiUserResult.value : null
    const userTx = ezaiTxResult.status === 'fulfilled' ? ezaiTxResult.value.transactions : []
    const monthlyTopups = topups.status === 'fulfilled' ? topups.value : []
    const usage = usageLogs.status === 'fulfilled' ? usageLogs.value.usage : []

    const monthly_topup_vnd = monthlyTopups.reduce((s, t) => s + Number(t.vnd_amount), 0)
    const monthly_topup_credit = monthlyTopups.reduce((s, t) => s + Number(t.credit_amount), 0)

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let spending_today = 0
    let requests_today = 0
    let spending_30d = 0

    for (const log of usage) {
      const logDate = new Date(log.created_at)
      const cost = log.cost || 0

      if (logDate >= todayStart) {
        spending_today += cost
        requests_today += 1
      }
      if (logDate >= thirtyDaysAgo) {
        spending_30d += cost
      }
    }

    const result: UsageData = {
      balance: ezaiUser?.balance ?? 0,
      plan_type: ezaiUser?.plan_type ?? 'none',
      daily_limit: ezaiUser?.daily_limit ?? 0,
      daily_used: ezaiUser?.daily_used ?? 0,
      plan_expires_at: ezaiUser?.plan_expires_at ?? null,
      transactions: userTx,
      monthly_topup_vnd,
      monthly_topup_credit,
      spending_today,
      requests_today,
      spending_30d,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Usage API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
\`\`\`

### Data Sources:
- EzAI User Profile → `balance`, `plan_type`, `daily_limit`, `daily_used`, `plan_expires_at`
- EzAI Transactions → `transactions[]`
- MongoDB TopupRequest → `monthly_topup_vnd`, `monthly_topup_credit`
- EzAI Usage Logs → `spending_today`, `requests_today`, `spending_30d`

---

## FILE 7: Usage History API
**Path:** app/api/usage/history/route.ts

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const profile = await User.findById(session.userId).select('ezai_user_id').lean()

        if (!profile?.ezai_user_id) {
            return NextResponse.json({ usage: [], total: 0, page: 1, limit: 20 })
        }

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')))

        const result = await ezai.getAllUsage(profile.ezai_user_id)
        const allUsage = result.usage || []
        const total = allUsage.length

        const start = (page - 1) * limit
        const paged = allUsage.slice(start, start + limit)

        return NextResponse.json({
            usage: paged,
            total,
            page,
            limit,
        })
    } catch (err) {
        console.error('Usage history API error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
\`\`\`

### Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 20, max: 100)

### Response Fields:
- `usage[]` - Array of EzaiUsageLog
- `total` - Total records
- `page` - Current page
- `limit` - Records per page

---

## FILE 8: Admin Stats API (Admin Only)
**Path:** app/api/admin/stats/route.ts

\`\`\`typescript
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { ezai } from '@/lib/ezai/client'
import { AdminUserStat } from '@/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const adminProfile = await User.findById(session.userId).select('role').lean()
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [rbUsers, ezaiUsersResult] = await Promise.allSettled([
      User.find({ ezai_user_id: { $ne: null } })
        .select('_id name email ezai_user_id')
        .sort({ created_at: -1 })
        .lean(),
      ezai.listUsers(1, 100),
    ])

    const users = rbUsers.status === 'fulfilled' ? rbUsers.value : []
    const ezaiUsers = ezaiUsersResult.status === 'fulfilled' ? ezaiUsersResult.value.users : []

    const ezaiMap: Record<string, typeof ezaiUsers[0]> = {}
    ezaiUsers.forEach((eu) => { ezaiMap[eu.id] = eu })

    const stats: AdminUserStat[] = users.map((rb) => {
      const ezaiData = rb.ezai_user_id ? ezaiMap[rb.ezai_user_id] : null
      return {
        rb_user_id: rb._id.toString(),
        name: rb.name,
        email: rb.email,
        ezai_user_id: rb.ezai_user_id,
        balance: ezaiData?.balance ?? 0,
        plan_type: ezaiData?.plan_type ?? 'none',
        daily_limit: ezaiData?.daily_limit ?? 0,
        daily_used: ezaiData?.daily_used ?? 0,
        plan_expires_at: ezaiData?.plan_expires_at ?? null,
      }
    })

    stats.sort((a, b) => b.daily_used - a.daily_used)

    return NextResponse.json({ stats, total: stats.length })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
\`\`\`

---

## FILE 9: Type Definitions
**Path:** types/index.ts (Relevant parts)

\`\`\`typescript
export interface UsageData {
  balance: number
  plan_type: string                    // 'starter' | 'pro' | 'max' | 'ultra' | 'one_time' | 'none'
  daily_limit: number
  daily_used: number
  plan_expires_at: string | null
  transactions: EzaiTransaction[]
  monthly_topup_vnd: number
  monthly_topup_credit: number
  spending_today: number
  requests_today: number
  spending_30d: number
}

export interface EzaiTransaction {
  id: string
  end_user_id: string
  type: string                        // 'topup' | 'plan_activate' | 'user_create' | 'user_deactivate' | 'plan_deactivate'
  amount: number
  original_amount?: number
  discount_percent?: number
  status: string                      // 'success' | 'failed' | 'completed' | 'error'
  failure_reason?: string | null
  description: string
  created_at: string
}

export interface EzaiUsageLog {
  id: string
  api_key_id: string
  user_id: string | null
  account_id: string
  model: string                       // Model name
  input_tokens: number
  output_tokens: number
  cache_write_tokens: number
  cache_read_tokens: number
  cost: number                        // Cost in credits
  request_path: string                // API endpoint
  status_code: number                 // HTTP status
  created_at: string                  // Timestamp
}

export interface AdminUserStat {
  rb_user_id: string
  name: string | null
  email: string
  ezai_user_id: string | null
  balance: number
  plan_type: string
  daily_limit: number
  daily_used: number
  plan_expires_at: string | null
}
\`\`\`

---

# DATA FIELD SUMMARY TABLE

| Field | Type | Source | Display Location(s) |
|-------|------|--------|---------------------|
| `balance` | number | EzAI API | Balance stat card, Plan hero card |
| `plan_type` | string | EzAI API | Plan badge, Rate limits section |
| `daily_limit` | number | EzAI API | Free Credits box, Daily requests limit |
| `daily_used` | number | EzAI API | Free Credits box, Progress bar |
| `plan_expires_at` | string\|null | EzAI API | Plan expiration badge |
| `spending_today` | number | EzAI usage logs | Spending Today card |
| `requests_today` | number | EzAI usage logs | Requests Today card, Daily limit progress |
| `spending_30d` | number | EzAI usage logs | Spending (30 days) card |
| `transactions[]` | Array | EzAI API | Transactions table |
| `monthly_topup_vnd` | number | MongoDB | (Stored, not displayed) |
| `monthly_topup_credit` | number | MongoDB | (Stored, not displayed) |

---

# DATA FLOW DIAGRAM

```
User Dashboard Page (page.tsx)
    ↓ (SWR fetcher, 30s refresh)
    GET /api/usage
    ↓
    API Route (usage/route.ts)
    ├→ ezai.getUser() → balance, plan_type, daily_limit, daily_used, plan_expires_at
    ├→ ezai.getTransactions() → transactions array
    ├→ MongoDB TopupRequest → monthly_topup_vnd, monthly_topup_credit
    └→ ezai.getAllUsage() → spending_today, requests_today, spending_30d
    ↓
    Returns: UsageData object
    ↓
    Renders: UsageStats Component
    ├→ Plan Hero Card
    ├→ 4 Stat Cards
    ├→ Rate Limits Section
    └→ Transactions Table
    ↓
    Also renders: UsageHistory Component
        ↓ (60s refresh)
        GET /api/usage/history?page=1&limit=500
        ↓
        Shows paginated request logs
```

---

Generated: 2026-04-13
All files documented and analyzed.

