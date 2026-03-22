'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Zap, Bot, Coins } from 'lucide-react'

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
    setTimeout(() => router.push(href), 300)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-pink-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Page transition overlay */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] transition-all duration-500 ${navigating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
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
        <p className="text-white/60 text-sm animate-pulse">
          {navigating === 'register' ? 'Đang mở trang đăng ký...' : 'Đang mở trang đăng nhập...'}
        </p>
      </div>

      {/* ─── Nav ──────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto animate-[fadeDown_0.6s_ease-out]">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            2brain
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-medium tracking-wider uppercase">
            Beta
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 font-medium"
            onClick={() => handleNavigate(`/${locale}/auth/login`, 'login')}
          >
            {t('auth.login')}
          </Button>
          <Button
            className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-white/10"
            onClick={() => handleNavigate(`/${locale}/auth/register`, 'register')}
          >
            {t('auth.register')}
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 animate-[fadeUp_0.5s_ease-out]">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">Powered by 2BRAIN</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-[fadeUp_0.6s_ease-out]">
          AI Credits
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]">
            dễ dàng & tức thì
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed animate-[fadeUp_0.7s_ease-out]">
          Nạp tiền qua QR code, nhận credit AI tức thì.
          <br className="hidden sm:block" />
          Hỗ trợ Claude, GPT-4, Gemini và hơn <strong className="text-white/80">50+ mô hình AI</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeUp_0.8s_ease-out]">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg px-10 py-7 rounded-xl font-semibold shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 active:scale-95"
            onClick={() => handleNavigate(`/${locale}/auth/register`, 'register')}
          >
            Bắt đầu ngay — Miễn phí
            <ArrowRight size={18} className="ml-2" />
          </Button>
          <Link href={`/${locale}/dashboard/docs`}>
            <Button
              size="lg"
              className="bg-white/10 hover:bg-white/15 text-white text-lg px-10 py-7 rounded-xl font-medium border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Xem tài liệu
            </Button>
          </Link>
        </div>
      </main>

      {/* ─── Features ─────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap size={24} className="text-yellow-400" />,
              title: 'Nạp tiền nhanh',
              desc: 'QR VietQR — chuyển khoản xác nhận trong vài phút',
              delay: '0s',
            },
            {
              icon: <Bot size={24} className="text-purple-400" />,
              title: '50+ AI Models',
              desc: 'Claude, GPT-4o, Gemini, Llama và nhiều mô hình khác',
              delay: '0.1s',
            },
            {
              icon: <Coins size={24} className="text-green-400" />,
              title: 'Giá tốt nhất',
              desc: '1 USD nạp vào = 15 USD credit. Tiết kiệm gấp 15 lần',
              delay: '0.2s',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] transition-all duration-300 hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5"
              style={{ animation: `fadeUp 0.6s ease-out ${f.delay} both` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────── */}
      {plans.length > 0 && (
        <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Bảng giá</h2>
          <p className="text-white/40 mb-12 text-lg">Tỷ giá: 1 USD = 25,000 VND</p>

          <div className={`grid gap-6 max-w-3xl mx-auto ${plans.length === 1 ? 'grid-cols-1 max-w-md' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
            {plans.map(plan => (
              <div
                key={plan._id}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] ${plan.is_featured
                    ? 'bg-gradient-to-b from-purple-600/20 to-pink-600/10 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                    : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
              >
                {plan.is_featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold shadow-lg">
                    Phổ biến
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-3">{plan.name}</h3>
                <div className={`text-4xl font-bold my-5 ${plan.is_featured ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-400'}`}>
                  {plan.price_label}
                </div>
                {plan.description && <p className="text-white/50">{plan.description}</p>}
                {plan.description_sub && <p className="text-white/30 text-sm mt-3">{plan.description_sub}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/5 border border-purple-500/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-white/50 mb-8 text-lg max-w-lg mx-auto">
            Tạo tài khoản miễn phí, nạp tiền qua QR và bắt đầu sử dụng AI ngay hôm nay.
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 text-lg px-10 py-7 rounded-xl font-semibold shadow-2xl shadow-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={() => handleNavigate(`/${locale}/auth/register`, 'register')}
          >
            Đăng ký miễn phí
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center">
        <p className="text-white/30 text-sm">© 2026 2brain. All rights reserved.</p>
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
