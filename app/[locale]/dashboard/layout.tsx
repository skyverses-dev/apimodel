import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/layout/Sidebar'
import { RbUser } from '@/types'

export default async function DashboardLayout({
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

  // Get or create rb_users profile
  const admin = createAdminClient()
  let { data: profile } = await admin
    .from('rb_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await admin
      .from('rb_users')
      .insert({
        id: user.id,
        role: 'user',
        name: user.user_metadata?.name || user.email?.split('@')[0],
      })
      .select()
      .single()
    profile = newProfile
  }

  if (!profile) redirect(`/${locale}/auth/login`)

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar user={profile as RbUser} email={user.email || ''} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
