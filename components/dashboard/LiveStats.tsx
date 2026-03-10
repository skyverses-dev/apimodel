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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-xl bg-white/5" />
        <Skeleton className="h-28 rounded-xl bg-white/5" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-red-400 text-sm">Could not load live stats</p>
    )
  }

  return <UsageStats data={data} compact={true} />
}
