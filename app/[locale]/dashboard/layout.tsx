import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import Sidebar from '@/components/layout/Sidebar'
import TopProgressBar from '@/components/ui/TopProgressBar'
import { RbUser } from '@/types'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()

  if (!session) redirect(`/${locale}/auth/login`)

  await connectDB()
  let profile = await User.findById(session.userId).lean()

  if (!profile) {
    // Shouldn't happen if JWT is valid, but just in case
    redirect(`/${locale}/auth/login`)
  }

  const rbUser: RbUser = {
    id: profile._id.toString(),
    role: profile.role,
    name: profile.name,
    ezai_user_id: profile.ezai_user_id,
    ezai_api_key: profile.ezai_api_key,
    user_code: profile.user_code,
    leverage: profile.leverage,
    created_at: profile.created_at.toISOString(),
    updated_at: profile.updated_at.toISOString(),
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <TopProgressBar />
      <Sidebar user={rbUser} email={session.email} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
