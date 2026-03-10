import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            2brain
          </span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/auth/login`}>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              {t('auth.login')}
            </Button>
          </Link>
          <Link href={`/${locale}/auth/register`}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              {t('auth.register')}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30">
          🚀 Powered by EzAI
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          AI Credits{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            dễ dàng
          </span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Nạp tiền qua QR code, nhận credit AI tức thì. Hỗ trợ Claude, GPT-4, Gemini và hơn 50 mô hình AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/${locale}/auth/register`}>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
              Bắt đầu ngay — Miễn phí
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/docs`}>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
              Xem tài liệu
            </Button>
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { icon: '⚡', title: 'Nạp tiền nhanh', desc: 'QR VietQR — chuyển khoản xác nhận trong vài phút' },
          { icon: '🤖', title: '50+ AI Models', desc: 'Claude, GPT-4o, Gemini, Llama và nhiều mô hình khác' },
          { icon: '💰', title: 'Giá tốt nhất', desc: '1 USD nạp vào = 30 USD credit. Tiết kiệm 2x so với trực tiếp' },
        ].map((f) => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Bảng giá</h2>
        <p className="text-slate-400 mb-10">Tỷ giá: 1 USD = 26,000 VND</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Pay-as-you-go</h3>
            <div className="text-4xl font-bold text-purple-400 my-4">x30</div>
            <p className="text-slate-400">100,000 VND → $3.84 USD credit</p>
            <p className="text-slate-400 text-sm mt-2">Không hết hạn, dùng khi cần</p>
          </div>
          <div className="bg-purple-600/20 border border-purple-500/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Monthly Plan</h3>
            <div className="text-4xl font-bold text-pink-400 my-4">Starter+</div>
            <p className="text-slate-400">Từ $2/tháng — Daily limit cao hơn</p>
            <p className="text-slate-400 text-sm mt-2">Phù hợp dùng thường xuyên</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500">
        <p>© 2026 2brain. All rights reserved.</p>
      </footer>
    </div>
  )
}
