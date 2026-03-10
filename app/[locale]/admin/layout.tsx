import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'
import { RbUser } from '@/types'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth/login`)

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('rb_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar user={profile as RbUser} email={user.email || ''} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
