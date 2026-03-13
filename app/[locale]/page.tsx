'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [navigating, setNavigating] = useState<string | null>(null)

  const { data: pricingData } = useSWR<{
    plans: Array<{
      _id: string; name: string; subtitle: string; price_label: string;
      description: string; description_sub: string; is_featured: boolean;
    }>
  }>('/api/pricing', (url: string) => fetch(url).then(r => r.json()))
  const plans = pricingData?.plans || []

  function handleNavigate(href: string, label: string) {
    setNavigating(label)
    // Brief delay for animation to show, then navigate
    setTimeout(() => {
      router.push(href)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">

      {/* Page transition overlay */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-all duration-500 ${navigating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl opacity-40 bg-purple-500 rounded-full animate-pulse" />
          <span className="relative text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_2s_ease_infinite]">
            2brain
          </span>
        </div>
        <div className="relative w-10 h-10 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">
          {navigating === 'register' ? 'Đang mở trang đăng ký...' : 'Đang mở trang đăng nhập...'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto animate-[fadeDown_0.6s_ease-out]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            2brain
          </span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
            onClick={() => handleNavigate(`/${locale}/auth/login`, 'login')}
          >
            {t('auth.login')}
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            onClick={() => handleNavigate(`/${locale}/auth/register`, 'register')}
          >
            {t('auth.register')}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30 animate-[fadeUp_0.5s_ease-out]">
          🚀 Powered by 2BRAIN
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-[fadeUp_0.6s_ease-out]">
          AI Credits{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            dễ dàng
          </span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto animate-[fadeUp_0.7s_ease-out]">
          Nạp tiền qua QR code, nhận credit AI tức thì. Hỗ trợ Claude, GPT-4, Gemini và hơn 50 mô hình AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeUp_0.8s_ease-out]">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 active:scale-95"
            onClick={() => handleNavigate(`/${locale}/auth/register`, 'register')}
          >
            Bắt đầu ngay — Miễn phí
          </Button>
          <Link href={`/${locale}/dashboard/docs`}>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
              Xem tài liệu
            </Button>
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { icon: '⚡', title: 'Nạp tiền nhanh', desc: 'QR VietQR — chuyển khoản xác nhận trong vài phút', delay: '0s' },
          { icon: '🤖', title: '50+ AI Models', desc: 'Claude, GPT-4o, Gemini, Llama và nhiều mô hình khác', delay: '0.1s' },
          { icon: '💰', title: 'Giá tốt nhất', desc: '1 USD nạp vào = 30 USD credit. Tiết kiệm 2x so với trực tiếp', delay: '0.2s' },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
            style={{ animation: `fadeUp 0.6s ease-out ${f.delay} both` }}
          >
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      {plans.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Bảng giá</h2>
          <p className="text-slate-400 mb-10">Tỷ giá: 1 USD = 26,000 VND</p>
          <div className={`grid gap-8 max-w-3xl mx-auto ${plans.length === 1 ? 'grid-cols-1 max-w-md' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
            {plans.map(plan => (
              <div
                key={plan._id}
                className={`rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] ${plan.is_featured
                    ? 'bg-purple-600/20 border border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                  }`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className={`text-4xl font-bold my-4 ${plan.is_featured ? 'text-pink-400' : 'text-purple-400'}`}>
                  {plan.price_label}
                </div>
                {plan.description && <p className="text-slate-400">{plan.description}</p>}
                {plan.description_sub && <p className="text-slate-400 text-sm mt-2">{plan.description_sub}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500">
        <p>© 2026 2brain. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
