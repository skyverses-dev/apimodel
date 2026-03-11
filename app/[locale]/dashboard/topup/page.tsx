'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import useSWR from 'swr'
import Image from 'next/image'
import { formatVND, formatUSD, vndToUsd, usdToCredit } from '@/lib/utils/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, RefreshCw, QrCode, Building2, Zap, Calendar, ArrowRight, Sparkles } from 'lucide-react'

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
  { key: 'starter', label: 'Starter', emoji: '🌱', limit: '35 credits/5h', gradient: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { key: 'pro', label: 'Pro', emoji: '⚡', limit: '80 credits/5h', gradient: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  { key: 'max', label: 'Max', emoji: '🚀', limit: '180 credits/5h', gradient: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  { key: 'ultra', label: 'Ultra', emoji: '👑', limit: '400 credits/5h', gradient: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400' },
]

const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ============================================
   QR Payment View
   ============================================ */
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('topup.title')}</h1>
        <p className="text-slate-400">Quét QR hoặc chuyển khoản thủ công</p>
      </div>

      {/* Plan badge */}
      {activeRequest.type === 'plan' && activeRequest.plan_name && (
        <div className="mb-6 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3">
          <Calendar size={18} className="text-purple-400 shrink-0" />
          <span className="text-purple-200 text-sm">
            Gói tháng: <strong className="capitalize text-purple-300">{activeRequest.plan_name}</strong> — kích hoạt sau khi duyệt
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full">
              <QrCode size={18} className="text-purple-400" />
              <span className="text-white font-semibold text-sm">{t('topup.scanQR')}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/20">
              <Image src={qrUrl} alt="VietQR" width={220} height={220} unoptimized />
            </div>
            <Badge className="mt-4 bg-amber-500/15 text-amber-300 border-amber-500/30 px-4 py-1.5">
              <RefreshCw size={12} className="mr-1.5 animate-spin" />
              {t('topup.pending')}
            </Badge>
          </CardContent>
        </Card>

        {/* Bank Info */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={18} className="text-emerald-400" />
              <span className="text-white font-semibold text-sm">{t('topup.bankInfo')}</span>
            </div>

            <div className="space-y-4">
              {[
                { label: t('topup.bankName'), value: settings.bank_name },
                { label: t('topup.accountNumber'), value: settings.bank_account },
                { label: t('topup.accountHolder'), value: settings.bank_holder },
                { label: 'Số tiền', value: formatVND(activeRequest.vnd_amount) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                  <p className="text-white font-medium text-[15px]">{value}</p>
                </div>
              ))}

              <div className="h-px bg-slate-700/50 my-1" />

              <div>
                <p className="text-slate-400 text-xs mb-1.5">{t('topup.transferContent')}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-purple-500/10 text-purple-300 px-3 py-2.5 rounded-lg text-sm font-mono border border-purple-500/20 tracking-wide">
                    {activeRequest.transfer_content}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(activeRequest.transfer_content)}
                    className="border-slate-600 hover:bg-slate-700 shrink-0 h-10 w-10"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-300" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-emerald-500/10 border-emerald-500/20 mt-6">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-slate-400 text-sm mb-1">Bạn sẽ nhận được</p>
            {activeRequest.type === 'plan' ? (
              <p className="text-xl font-bold text-purple-300 capitalize">Gói {activeRequest.plan_name}</p>
            ) : (
              <p className="text-xl font-bold text-emerald-400">{formatUSD(activeRequest.credit_amount)} credit</p>
            )}
          </div>
          <p className="text-slate-500 text-xs text-right max-w-[180px]">{t('topup.note')}</p>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="mt-4 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
        onClick={onReset}
      >
        Tạo yêu cầu mới
      </Button>
    </div>
  )
}

/* ============================================
   Main Topup Page
   ============================================ */
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('topup.title')}</h1>
        <p className="text-slate-400">Nạp tiền qua QR chuyển khoản ngân hàng</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-slate-800/60 p-1 rounded-xl w-fit border border-slate-700/50">
        <button
          onClick={() => setTab('credit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === 'credit'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Zap size={15} /> Nạp credit
        </button>
        <button
          onClick={() => setTab('plan')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${tab === 'plan'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Calendar size={15} /> Gói tháng
        </button>
      </div>

      {/* ---- Credit Tab ---- */}
      {tab === 'credit' && (
        <div className="space-y-6">
          {/* Quick amounts */}
          <div>
            <p className="text-slate-300 text-sm font-medium mb-3">Chọn nhanh</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${amount === p.toString()
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  {p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-slate-300 text-sm font-medium mb-2">{t('topup.amount')}</p>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={t('topup.amountPlaceholder')}
              min={50000}
              className="bg-slate-800/50 border-slate-700/50 text-white text-lg h-12 placeholder:text-slate-600 focus:border-purple-500/50"
            />
            {vnd > 0 && <p className="text-slate-500 text-xs mt-1.5">{formatVND(vnd)}</p>}
          </div>

          {/* Calculation preview */}
          {vnd >= 50000 && settings && (
            <Card className="bg-slate-800/30 border-slate-700/40 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-slate-300 text-sm font-medium">{t('topup.youGet')}</span>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('topup.usdEquivalent')}</span>
                    <span className="text-white font-medium">{formatUSD(usd)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('topup.leverage')}</span>
                    <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30">x{settings.user_leverage}</Badge>
                  </div>
                  <div className="h-px bg-slate-700/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{t('topup.creditAmount')}</span>
                    <span className="text-2xl font-bold text-emerald-400">{formatUSD(credit)}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Tỷ giá: 1 USD = {settings.exchange_rate.toLocaleString()} VND</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Button
            onClick={handleCreateCredit}
            disabled={loading || vnd < 50000}
            className="w-full bg-purple-600 hover:bg-purple-500 py-6 text-base font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
          >
            {loading ? t('common.loading') : (
              <span className="flex items-center gap-2">
                {t('topup.createRequest')} <ArrowRight size={16} />
              </span>
            )}
          </Button>
          {vnd > 0 && vnd < 50000 && (
            <p className="text-red-400 text-xs text-center">{t('topup.minAmount')}</p>
          )}
        </div>
      )}

      {/* ---- Plan Tab ---- */}
      {tab === 'plan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAN_INFO.map(plan => {
              const price = planPrice(plan.key)
              const isSelected = selectedPlan === plan.key
              return (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`text-left p-5 rounded-xl border transition-all duration-200 ${isSelected
                      ? `bg-gradient-to-br ${plan.gradient} ${plan.border} shadow-lg`
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{plan.emoji}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isSelected ? `${plan.text} bg-white/10` : 'text-slate-400 bg-slate-700/50'}`}>
                      {plan.label}
                    </span>
                  </div>
                  <p className="text-white font-bold text-xl mb-1">
                    {price > 0 ? formatVND(price) : '—'}
                    <span className="text-slate-500 text-xs font-normal ml-1">/tháng</span>
                  </p>
                  <p className={`text-xs ${isSelected ? plan.text : 'text-slate-500'}`}>{plan.limit}</p>
                </button>
              )
            })}
          </div>

          {/* Selected plan summary */}
          {selectedPlan && (
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Gói đã chọn</p>
                  <p className="text-white font-bold capitalize text-lg">{selectedPlan}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{PLAN_INFO.find(p => p.key === selectedPlan)?.limit}</p>
                </div>
                <p className="text-purple-300 font-bold text-xl">{formatVND(planPrice(selectedPlan))}</p>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleCreatePlan}
            disabled={loading || !selectedPlan}
            className="w-full bg-purple-600 hover:bg-purple-500 py-6 text-base font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
          >
            {loading ? t('common.loading') : (
              <span className="flex items-center gap-2">
                Đăng ký {selectedPlan ? `gói ${selectedPlan}` : 'gói tháng'} <ArrowRight size={16} />
              </span>
            )}
          </Button>

          <p className="text-slate-500 text-xs text-center">
            Gói tháng sẽ được kích hoạt sau khi admin xác nhận thanh toán
          </p>
        </div>
      )}
    </div>
  )
}
