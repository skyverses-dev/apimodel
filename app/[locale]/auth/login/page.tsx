'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Show loading screen
      setRedirecting(true)

      // Small delay for smooth transition
      await new Promise(r => setTimeout(r, 500))
      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch {
      toast.error(t('auth.loginError'))
      setLoading(false)
    }
  }

  // Full-screen loading overlay
  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-purple-500 rounded-full animate-pulse" />
          <span className="relative text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            2brain
          </span>
        </div>

        {/* Loading spinner */}
        <div className="relative w-12 h-12 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" />
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-pink-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>

        {/* Loading text */}
        <p className="text-slate-400 text-sm animate-pulse">
          Đang tải dashboard...
        </p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-400"
              style={{
                animation: 'bounce 1s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 2s ease infinite;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            2brain
          </span>
        </div>
        <Card className="border-white/10 bg-white/5 backdrop-blur text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{t('auth.loginTitle')}</CardTitle>
            <CardDescription className="text-slate-400">
              {t('auth.noAccount')}{' '}
              <Link href={`/${locale}/auth/register`} className="text-purple-400 hover:text-purple-300">
                {t('auth.register')}
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('auth.password')}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
