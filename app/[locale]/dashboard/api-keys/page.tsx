import connectDB from '@/lib/db/mongodb'
import { User, Settings } from '@/lib/db/models'
import { getSession } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key } from 'lucide-react'
import CopyButton from './CopyButton'
import { ezai } from '@/lib/ezai/client'

export default async function ApiKeysPage() {
  const t = await getTranslations()
  const session = await getSession()
  if (!session) return null

  await connectDB()
  const [profile, settings] = await Promise.all([
    User.findById(session.userId).lean(),
    Settings.findOne().lean(),
  ])

  const baseUrl = settings?.ai_base_url || 'https://ezaiapi.com'

  // Try to get live key from EzAI; fall back to stored key
  let apiKey: string | null = profile?.ezai_api_key ?? null
  let isActive = true

  if (profile?.ezai_user_id) {
    try {
      const ezaiUser = await ezai.getUser(profile.ezai_user_id)
      const activeKey = ezaiUser.api_keys?.find(k => k.is_active === 1)
      if (activeKey?.full_key) {
        apiKey = activeKey.full_key
        isActive = true
      } else if (ezaiUser.api_keys && ezaiUser.api_keys.length > 0) {
        apiKey = ezaiUser.api_keys[0].full_key
        isActive = ezaiUser.api_keys[0].is_active === 1
      }
    } catch {
      // EzAI unavailable — fall back to DB key silently
    }
  }

  const apiKeyDisplay = baseUrl

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">{t('apiKeys.title')}</h1>
      <p className="text-slate-400 mb-8">Sử dụng key này với bất kỳ OpenAI-compatible SDK nào</p>

      {!apiKey ? (
        <Card className="bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-8 text-center">
            <Key size={48} className="text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-300">{t('apiKeys.noKey')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* API Key */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key size={20} className="text-purple-400" />
                {t('apiKeys.yourKey')}
                {!isActive && (
                  <span className="text-xs font-normal text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                    Inactive
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-800 text-green-300 px-4 py-3 rounded-lg font-mono text-sm border border-white/10 overflow-hidden text-ellipsis">
                  {apiKey}
                </code>
                <CopyButton text={apiKey} />
              </div>
              <p className="text-xs text-slate-500">⚠️ Giữ bí mật key này, không chia sẻ công khai</p>
            </CardContent>
          </Card>

          {/* Base URL */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">{t('apiKeys.baseUrl')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-800 text-blue-300 px-4 py-3 rounded-lg font-mono text-sm border border-white/10">
                  {apiKeyDisplay}
                </code>
                <CopyButton text={apiKeyDisplay} />
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">{t('apiKeys.howToUse')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className="mb-2 bg-blue-600/20 text-blue-300">Python</Badge>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto border border-white/10">
                  {`from openai import OpenAI

client = OpenAI(
    api_key="${apiKey.slice(0, 10)}...",
    base_url="${apiKeyDisplay}/v1"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}
                </pre>
              </div>
              <div>
                <Badge className="mb-2 bg-yellow-600/20 text-yellow-300">Node.js</Badge>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto border border-white/10">
                  {`import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: '${apiKey.slice(0, 10)}...',
  baseURL: '${apiKeyDisplay}/v1'
})

const res = await client.chat.completions.create({
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'Hello!' }]
})
console.log(res.choices[0].message.content)`}
                </pre>
              </div>
              <div>
                <Badge className="mb-2 bg-green-600/20 text-green-300">cURL</Badge>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto border border-white/10">
                  {`curl ${apiKeyDisplay}/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey.slice(0, 10)}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "messages": [{"role":"user","content":"Hello!"}]
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
