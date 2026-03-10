'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch {
      toast.error(t('auth.loginError'))
    } finally {
      setLoading(false)
    }
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
