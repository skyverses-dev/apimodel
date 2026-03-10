'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import useSWR from 'swr'
import Image from 'next/image'
import { formatVND, formatUSD, vndToUsd, usdToCredit } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, RefreshCw, QrCode, Building2, Zap, Calendar } from 'lucide-react'

interface Settings {
  exchange_rate: number
  user_leverage: number
  bank_account: string
  bank_name: string
  bank_holder: string
  bank_bin: string
  plan_starter_vnd: number
  plan_pro_vnd: number
  plan_max_vnd: number
  plan_ultra_vnd: number
}

interface TopupRequest {
  id: string
  vnd_amount: number
  credit_amount: number
  transfer_content: string
  status: string
  type: string
  plan_name?: string
}

const PRESETS = [100000, 200000, 500000, 1000000]

const PLAN_INFO = [
  { key: 'starter', label: 'Starter', color: 'from-slate-500 to-slate-600', badge: 'bg-slate-600/20 text-slate-300', limit: '35 credits · reset mỗi 5h', icon: '🌱' },
  { key: 'pro', label: 'Pro', color: 'from-blue-500 to-blue-600', badge: 'bg-blue-600/20 text-blue-300', limit: '80 credits · reset mỗi 5h', icon: '⚡' },
  { key: 'max', label: 'Max', color: 'from-purple-500 to-purple-600', badge: 'bg-purple-600/20 text-purple-300', limit: '180 credits · reset mỗi 5h', icon: '🚀' },
  { key: 'ultra', label: 'Ultra', color: 'from-pink-500 to-pink-600', badge: 'bg-pink-600/20 text-pink-300', limit: '400 credits · reset mỗi 5h', icon: '👑' },
]

const fetcher = (url: string) => fetch(url).then(r => r.json())

function QRView({ activeRequest, settings, onReset }: {
  activeRequest: TopupRequest
  settings: Settings
  onReset: () => void
}) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  const qrUrl = `https://img.vietqr.io/image/${settings.bank_bin}-${settings.bank_account}-compact2.png?amount=${activeRequest.vnd_amount}&addInfo=${encodeURIComponent(activeRequest.transfer_content)}&accountName=${encodeURIComponent(settings.bank_holder)}`

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">{t('topup.title')}</h1>
      <p className="text-slate-400 mb-8">Quét QR hoặc chuyển khoản thủ công</p>

      {activeRequest.type === 'plan' && activeRequest.plan_name && (
        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          <span className="text-purple-300 text-sm">
            Gói tháng: <strong className="capitalize">{activeRequest.plan_name}</strong> — sau khi duyệt sẽ kích hoạt ngay
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <QrCode size={20} className="text-purple-400" />
              {t('topup.scanQR')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-xl">
              <Image src={qrUrl} alt="VietQR" width={200} height={200} unoptimized />
            </div>
            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
              <RefreshCw size={12} className="mr-1 animate-spin" />
              {t('topup.pending')}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 size={20} className="text-green-400" />
              {t('topup.bankInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: t('topup.bankName'), value: settings.bank_name },
              { label: t('topup.accountNumber'), value: settings.bank_account },
              { label: t('topup.accountHolder'), value: settings.bank_holder },
              { label: 'Số tiền', value: formatVND(activeRequest.vnd_amount) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs text-slate-500 mb-1">{t('topup.transferContent')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-purple-900/30 text-purple-300 px-3 py-2 rounded-lg text-sm font-mono border border-purple-500/30">
                  {activeRequest.transfer_content}
                </code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(activeRequest.transfer_content)} className="border-white/10 hover:bg-white/10">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-green-900/20 border-green-500/30 mt-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-slate-400 text-sm">Bạn sẽ nhận được</p>
            {activeRequest.type === 'plan' ? (
              <p className="text-2xl font-bold text-purple-400 capitalize">Gói {activeRequest.plan_name}</p>
            ) : (
              <p className="text-2xl font-bold text-green-400">{formatUSD(activeRequest.credit_amount)} credit</p>
            )}
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>{t('topup.note')}</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/10" onClick={onReset}>
        Tạo yêu cầu mới
      </Button>
    </div>
  )
}

export default function TopupPage() {
  const t = useTranslations()
  const [tab, setTab] = useState<'credit' | 'plan'>('credit')
  const [amount, setAmount] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeRequest, setActiveRequest] = useState<TopupRequest | null>(null)

  const { data: settings } = useSWR<Settings>('/api/settings', fetcher)

  const vnd = Number(amount) || 0
  const usd = settings ? vndToUsd(vnd, settings.exchange_rate) : 0
  const credit = settings ? usdToCredit(usd, settings.user_leverage) : 0

  const planPrice = (plan: string) => {
    if (!settings) return 0
    const key = `plan_${plan}_vnd` as keyof Settings
    return Number(settings[key] || 0)
  }

  async function handleCreateCredit() {
    if (vnd < 50000) { toast.error(t('topup.minAmount')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/topup/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vnd_amount: vnd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo yêu cầu')
      setActiveRequest(data)
      toast.success('Đã tạo yêu cầu nạp tiền!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePlan() {
    if (!selectedPlan) { toast.error('Chọn gói trước!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/topup/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vnd_amount: planPrice(selectedPlan), plan_name: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo yêu cầu')
      setActiveRequest(data)
      toast.success(`Đã tạo yêu cầu gói ${selectedPlan}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  if (activeRequest && settings) {
    return <QRView activeRequest={activeRequest} settings={settings} onReset={() => setActiveRequest(null)} />
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">{t('topup.title')}</h1>
      <p className="text-slate-400 mb-6">Nạp tiền qua QR chuyển khoản ngân hàng</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('credit')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'credit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Zap size={15} /> Nạp credit
        </button>
        <button
          onClick={() => setTab('plan')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'plan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar size={15} /> Gói tháng
        </button>
      </div>

      {/* Credit tab */}
      {tab === 'credit' && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(p.toString())}
                  className={`border-white/10 text-sm ${amount === p.toString() ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  {p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}K`}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t('topup.amount')}</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={t('topup.amountPlaceholder')}
                min={50000}
                className="bg-white/10 border-white/20 text-white text-lg placeholder:text-slate-500"
              />
              {vnd > 0 && <p className="text-xs text-slate-500">{formatVND(vnd)}</p>}
            </div>
            {vnd >= 50000 && settings && (
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 space-y-3">
                <p className="text-slate-300 text-sm font-medium">{t('topup.youGet')}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{t('topup.usdEquivalent')}</span>
                  <span className="text-white">{formatUSD(usd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">{t('topup.leverage')}</span>
                  <span className="text-purple-400">x{settings.user_leverage}</span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{t('topup.creditAmount')}</span>
                  <span className="text-2xl font-bold text-green-400">{formatUSD(credit)}</span>
                </div>
                <p className="text-xs text-slate-500">Tỷ giá: 1 USD = {settings.exchange_rate.toLocaleString()} VND</p>
              </div>
            )}
            <Button onClick={handleCreateCredit} disabled={loading || vnd < 50000} className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-base">
              {loading ? t('common.loading') : t('topup.createRequest')}
            </Button>
            {vnd > 0 && vnd < 50000 && <p className="text-xs text-red-400 text-center">{t('topup.minAmount')}</p>}
          </CardContent>
        </Card>
      )}

      {/* Plan tab */}
      {tab === 'plan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAN_INFO.map(plan => {
              const price = planPrice(plan.key)
              return (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedPlan === plan.key
                      ? 'border-purple-500 bg-purple-600/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{plan.icon}</span>
                    <Badge className={plan.badge}>{plan.label}</Badge>
                  </div>
                  <p className="text-white font-bold text-xl mb-1">
                    {price > 0 ? formatVND(price) : '—'}
                    <span className="text-slate-400 text-xs font-normal">/tháng</span>
                  </p>
                  <p className="text-slate-400 text-xs">{plan.limit}</p>
                </button>
              )
            })}
          </div>

          {selectedPlan && (
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Gói đã chọn</p>
                  <p className="text-white font-bold capitalize text-lg">{selectedPlan}</p>
                  <p className="text-xs text-slate-500">{PLAN_INFO.find(p => p.key === selectedPlan)?.limit}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 font-bold text-xl">{formatVND(planPrice(selectedPlan))}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleCreatePlan}
            disabled={loading || !selectedPlan}
            className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-base"
          >
            {loading ? t('common.loading') : `Đăng ký ${selectedPlan ? `gói ${selectedPlan}` : 'gói tháng'}`}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Gói tháng sẽ được kích hoạt sau khi admin xác nhận thanh toán
          </p>
        </div>
      )}
    </div>
  )
}
