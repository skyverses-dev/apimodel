'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { RbUser } from '@/types'
import {
  LayoutDashboard, Wallet, History, Key, BookOpen, Activity,
  Users, Settings, LogOut, ChevronRight, Globe, ShieldCheck
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: RbUser
  email: string
}

export default function Sidebar({ user, email }: SidebarProps) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = user.role === 'admin'

  const userNav = [
    { href: `/${locale}/dashboard`, icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: `/${locale}/dashboard/topup`, icon: Wallet, label: t('nav.topup') },
    { href: `/${locale}/dashboard/transactions`, icon: History, label: t('nav.transactions') },
    { href: `/${locale}/dashboard/api-keys`, icon: Key, label: t('nav.apiKeys') },
    { href: `/${locale}/dashboard/docs`, icon: BookOpen, label: t('nav.docs') },
  ]

  const adminNav = [
    { href: `/${locale}/admin`, icon: ShieldCheck, label: t('nav.admin') },
    { href: `/${locale}/admin/users`, icon: Users, label: t('nav.users') },
    { href: `/${locale}/admin/ezai-users`, icon: Activity, label: '2BRAIN Users' },
    { href: `/${locale}/admin/topups`, icon: Wallet, label: t('nav.topup') },
    { href: `/${locale}/admin/transactions`, icon: History, label: t('nav.transactions') },
    { href: `/${locale}/admin/webhooks`, icon: Globe, label: 'Webhooks' },
    { href: `/${locale}/admin/settings`, icon: Settings, label: t('nav.settings') },
    { href: `/${locale}/admin/docs`, icon: BookOpen, label: t('nav.resellerDocs') },
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${locale}/auth/login`)
    router.refresh()
    toast.success('Đã đăng xuất')
  }

  const otherLocale = locale === 'vi' ? 'en' : 'vi'
  const switchLang = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`)
    router.push(newPath)
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            2brain
          </span>
          {isAdmin && <Badge className="bg-purple-600 text-xs">Admin</Badge>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* User Nav */}
        <p className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</p>
        {userNav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              pathname === href || (href !== `/${locale}/dashboard` && pathname.startsWith(href))
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
            {pathname === href && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}

        {/* Admin Nav */}
        {isAdmin && (
          <>
            <Separator className="my-3 bg-white/10" />
            <p className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-2">Admin</p>
            {adminNav.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  pathname === href || (href !== `/${locale}/admin` && pathname.startsWith(href))
                    ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button onClick={switchLang} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded w-full transition-colors">
          <Globe size={14} />
          {locale === 'vi' ? 'Switch to English' : 'Chuyển Tiếng Việt'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-left">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-700 text-white text-xs">
                {(user.name || email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm text-white truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-white/10">
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 cursor-pointer">
              <LogOut size={14} className="mr-2" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
