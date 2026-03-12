'use client'

import useSWR from 'swr'
import { UsageData } from '@/types'
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

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
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

      {/* No plan warning */}
      {data && data.plan_type === 'none' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 mb-6">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">
            Bạn chưa có gói dịch vụ. Hãy liên hệ admin hoặc nạp tiền để kích hoạt gói AI.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
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

      {/* Error */}
      {error && !isLoading && (
        <p className="text-red-400 text-sm">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      )}

      {/* Content */}
      {data && !isLoading && <UsageStats data={data} compact={false} hideTransactions />}

      {/* Usage History */}
      {data && !isLoading && <div className="mt-6"><UsageHistory /></div>}

      {/* Footer */}
      <p className="text-xs text-slate-600 mt-8 text-center">
        Tự động làm mới sau mỗi 30 giây
      </p>
    </div>
  )
}
