import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const locale = url.searchParams.get('locale') || 'vi'
  const next = url.searchParams.get('next') || `/${locale}/dashboard`

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create rb_users profile if not exists
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('rb_users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        await admin.from('rb_users').insert({
          id: data.user.id,
          role: 'user',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        })
      }

      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/auth/login?error=auth_callback_failed`, url.origin))
}
