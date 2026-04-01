import connectDB from '@/lib/db/mongodb'
import { User, Settings } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage() {
  const session = await getSession()

  let apiKey = 'YOUR_API_KEY'
  let aiBase = 'https://ezaiapi.com'

  if (session) {
    await connectDB()
    const [profile, settings] = await Promise.all([
      User.findById(session.userId).select('ezai_api_key').lean(),
      Settings.findOne().lean(),
    ])
    if (profile?.ezai_api_key) apiKey = profile.ezai_api_key
    if (settings?.ai_base_url) aiBase = settings.ai_base_url
  }

  return <IntegrationsClient apiKey={apiKey} aiBase={aiBase} />
}
