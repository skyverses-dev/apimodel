import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, ExternalLink, Users, CreditCard, BarChart2,
  Key, Globe, AlertTriangle, Zap, Terminal, ChevronRight, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

const resellerBase = 'https://ezaiapi.com/reseller/api'

const plans = [
  { name: 'starter', price: '$10/month', daily: '$35/day', rpm: 30,  concurrent: 5  },
  { name: 'pro',     price: '$20/month', daily: '$80/day', rpm: 60,  concurrent: 10 },
  { name: 'max',     price: '$40/month', daily: '$180/day', rpm: 90, concurrent: 15 },
  { name: 'ultra',   price: '$80/month', daily: '$400/day', rpm: 120, concurrent: 20 },
]

const errorCodes = [
  { status: '200', meaning: 'Success' },
  { status: '201', meaning: 'Created successfully' },
  { status: '400', meaning: 'Bad request — missing or invalid parameters' },
  { status: '401', meaning: 'Invalid or missing reseller key' },
  { status: '402', meaning: 'Insufficient reseller balance' },
  { status: '403', meaning: 'Forbidden — not a reseller account' },
  { status: '404', meaning: 'User or resource not found' },
  { status: '409', meaning: 'Conflict — user already exists' },
  { status: '500', meaning: 'Internal server error' },
]

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg bg-slate-950 border border-white/10 overflow-hidden">
      {lang && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
          <Terminal size={12} className="text-slate-500" />
          <span className="text-xs text-slate-500 font-mono">{lang}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm text-slate-300 font-mono leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}

function Section({ id, icon: Icon, title, children }: {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
          <Icon size={18} className="text-pink-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Endpoint({ method, path, description, children }: {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  description: string
  children?: React.ReactNode
}) {
  const methodColor = {
    GET: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    POST: 'bg-green-500/20 text-green-300 border-green-500/30',
    DELETE: 'bg-red-500/20 text-red-300 border-red-500/30',
  }[method]

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base flex-wrap">
          <Badge className={`font-mono text-xs ${methodColor}`}>{method}</Badge>
          <code className="text-white font-mono text-sm">{path}</code>
        </CardTitle>
        <p className="text-sm text-slate-400">{description}</p>
      </CardHeader>
      {children && <CardContent className="space-y-3">{children}</CardContent>}
    </Card>
  )
}

export default function ResellerDocsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <ShieldCheck size={24} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Reseller API Documentation</h1>
            <p className="text-slate-400 mt-1">Programmatically manage end-users, billing, and analytics</p>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '#auth',    label: 'Authentication', color: 'text-pink-400' },
            { href: '#users',   label: 'User Management', color: 'text-blue-400' },
            { href: '#billing', label: 'Billing & Plans', color: 'text-green-400' },
            { href: '#analytics', label: 'Analytics', color: 'text-yellow-400' },
          ].map(({ href, label, color }) => (
            <a key={href} href={href} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
              <ChevronRight size={14} className={`${color} group-hover:translate-x-0.5 transition-transform`} />
              <span className="text-sm text-slate-300">{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Authentication */}
      <Section id="auth" icon={Key} title="Authentication">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-300">
              All Reseller API requests require your reseller key (starts with <code className="text-pink-300">rk-</code>).
              Find it in your reseller panel at{' '}
              <Link href="https://ezaiapi.com/reseller" target="_blank" className="text-pink-400 hover:text-pink-300 underline underline-offset-2">
                ezaiapi.com/reseller
              </Link>.
            </p>
            <CodeBlock lang="Authorization header" code={`Authorization: Bearer rk-your_reseller_key_here\nContent-Type: application/json`} />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">Keep your reseller key secret — it has full access to create, modify, and delete all end-users and their data.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Base URL</h3>
          <CodeBlock lang="Reseller API" code={`${resellerBase}`} />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Error Response Format</h3>
          <CodeBlock lang="json" code={`{ "error": "Descriptive error message" }`} />
        </div>

        {/* Error codes table */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {errorCodes.map((e) => (
                    <tr key={e.status} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <code className={`font-mono font-bold text-xs ${
                          e.status === '200' || e.status === '201' ? 'text-green-400' :
                          e.status.startsWith('4') ? 'text-red-400' : 'text-orange-400'
                        }`}>{e.status}</code>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{e.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* User Management */}
      <Section id="users" icon={Users} title="User Management">
        <div className="space-y-4">

          <Endpoint method="POST" path="/users" description="Create a new end-user. Returns an API key (starts with ek-) for the user.">
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Request body:</p>
              <CodeBlock lang="json" code={`{\n  "email": "user@example.com",    // required\n  "name": "John Doe"              // required\n}`} />
              <p className="text-xs text-slate-400">Response:</p>
              <CodeBlock lang="json" code={`{\n  "id": "eu_abc123",\n  "email": "user@example.com",\n  "name": "John Doe",\n  "balance": 0,\n  "plan_type": "none",\n  "api_key": "ek-xxxxxxxxxxxx",\n  "created_at": "2026-03-01T00:00:00Z"\n}`} />
            </div>
          </Endpoint>

          <Endpoint method="GET" path="/users" description="List all end-users with pagination.">
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Query parameters: <code className="text-slate-300">page</code> (default: 1), <code className="text-slate-300">limit</code> (default: 20, max: 100)</p>
              <CodeBlock lang="curl" code={`curl "${resellerBase}/users?page=1&limit=20" \\\n  -H "Authorization: Bearer rk-your_key"`} />
              <CodeBlock lang="json" code={`{\n  "users": [ ... ],\n  "total": 42\n}`} />
            </div>
          </Endpoint>

          <Endpoint method="GET" path="/users/:id" description="Get a single end-user including their active plans and API keys.">
            <CodeBlock lang="curl" code={`curl "${resellerBase}/users/eu_abc123" \\\n  -H "Authorization: Bearer rk-your_key"`} />
          </Endpoint>

          <Endpoint method="DELETE" path="/users/:id" description="Deactivate an end-user (preserves data, disables access).">
            <CodeBlock lang="curl" code={`curl -X DELETE "${resellerBase}/users/eu_abc123" \\\n  -H "Authorization: Bearer rk-your_key"`} />
          </Endpoint>

        </div>
      </Section>

      {/* Billing & Plans */}
      <Section id="billing" icon={CreditCard} title="Billing & Plans">
        <div className="space-y-4">

          <Endpoint method="POST" path="/users/:id/topup" description="Add credit to a user's balance. Amount is deducted from your reseller balance.">
            <div className="space-y-2">
              <CodeBlock lang="json" code={`{\n  "amount": 5.00   // USD amount to add to user balance\n}`} />
              <p className="text-xs text-slate-400">Response includes updated user balance, your reseller balance, and the bonus multiplier applied.</p>
            </div>
          </Endpoint>

          <Endpoint method="POST" path="/users/:id/plan" description="Activate a monthly plan for an end-user. Duration: 30 days.">
            <div className="space-y-2">
              <CodeBlock lang="json" code={`{\n  "plan": "starter"   // starter | pro | max | ultra\n}`} />
            </div>
          </Endpoint>

          <Endpoint method="DELETE" path="/users/:id/plan" description="Cancel a user's monthly plan immediately. No refund.">
            <CodeBlock lang="curl" code={`curl -X DELETE "${resellerBase}/users/eu_abc123/plan" \\\n  -H "Authorization: Bearer rk-your_key"`} />
          </Endpoint>

          {/* Plans table */}
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300">Available Plans</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Plan</th>
                      <th className="text-right text-slate-400 font-medium px-4 py-3">Price</th>
                      <th className="text-right text-slate-400 font-medium px-4 py-3">5h Credit Limit</th>
                      <th className="text-right text-slate-400 font-medium px-4 py-3">RPM</th>
                      <th className="text-right text-slate-400 font-medium px-4 py-3">Concurrent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {plans.map((p) => (
                      <tr key={p.name} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-white capitalize font-medium">{p.name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{p.price}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{p.daily}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{p.rpm}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{p.concurrent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </Section>

      {/* API Key Management */}
      <Section id="keys" icon={Key} title="API Key Management">
        <div className="space-y-4">

          <Endpoint method="POST" path="/users/:id/keys" description="Create a new API key for a user.">
            <CodeBlock lang="json" code={`{\n  "name": "Production Key"   // optional, default: "Default Key"\n}`} />
          </Endpoint>

          <Endpoint method="DELETE" path="/users/:id/keys/:keyId" description="Deactivate (delete) a specific API key.">
            <CodeBlock lang="curl" code={`curl -X DELETE "${resellerBase}/users/eu_abc123/keys/key_xyz" \\\n  -H "Authorization: Bearer rk-your_key"`} />
          </Endpoint>

          <Endpoint method="POST" path="/users/:id/keys/:keyId/reset" description="Regenerate (reset) a specific API key. Returns the new key value.">
            <div className="space-y-2">
              <CodeBlock lang="curl" code={`curl -X POST "${resellerBase}/users/eu_abc123/keys/key_xyz/reset" \\\n  -H "Authorization: Bearer rk-your_key"`} />
              <CodeBlock lang="json" code={`{\n  "key_id": "key_xyz",\n  "api_key": "ek-newkeyvalue",\n  "prefix": "ek-newke"\n}`} />
            </div>
          </Endpoint>

        </div>
      </Section>

      {/* Analytics */}
      <Section id="analytics" icon={BarChart2} title="Analytics">
        <div className="space-y-4">

          <Endpoint method="GET" path="/stats" description="Get reseller dashboard overview stats.">
            <div className="space-y-2">
              <CodeBlock lang="curl" code={`curl "${resellerBase}/stats" \\\n  -H "Authorization: Bearer rk-your_key"`} />
              <CodeBlock lang="json" code={`{\n  "total_users": 42,\n  "reseller_balance": 150.00,\n  "reseller_quota": 500.00,\n  "bonus_multiplier": 1.2,\n  "total_transactions": 238,\n  "total_topups": 180,\n  "total_plan_activations": 58\n}`} />
            </div>
          </Endpoint>

          <Endpoint method="GET" path="/transactions" description="Get transaction history. Filter by end_user_id to see a specific user's transactions.">
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Query params: <code className="text-slate-300">end_user_id</code> (optional), <code className="text-slate-300">limit</code> (default: 20)</p>
              <CodeBlock lang="curl" code={`curl "${resellerBase}/transactions?limit=50" \\\n  -H "Authorization: Bearer rk-your_key"\n\n# Filter by user:\ncurl "${resellerBase}/transactions?end_user_id=eu_abc123" \\\n  -H "Authorization: Bearer rk-your_key"`} />
              <CodeBlock lang="json" code={`{\n  "transactions": [\n    {\n      "id": "tx_abc123",\n      "end_user_id": "eu_abc123",\n      "type": "topup",\n      "amount": 5.00,\n      "status": "success",\n      "description": "Manual topup by reseller",\n      "created_at": "2026-03-01T00:00:00Z"\n    }\n  ]\n}`} />
            </div>
          </Endpoint>

          <Endpoint method="GET" path="/usage" description="Get API usage logs. Optionally filter by user_id.">
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Query params: <code className="text-slate-300">user_id</code> (optional), <code className="text-slate-300">limit</code> (default: 50)</p>
              <CodeBlock lang="curl" code={`curl "${resellerBase}/usage?limit=100" \\\n  -H "Authorization: Bearer rk-your_key"`} />
              <CodeBlock lang="json" code={`{\n  "usage": [\n    {\n      "id": "log_abc123",\n      "user_id": "eu_abc123",\n      "model": "claude-sonnet-4-5",\n      "prompt_tokens": 512,\n      "completion_tokens": 256,\n      "total_tokens": 768,\n      "cost": 0.0023,\n      "created_at": "2026-03-01T00:00:00Z"\n    }\n  ]\n}`} />
            </div>
          </Endpoint>

        </div>
      </Section>

      {/* Quickstart code examples */}
      <Section id="quickstart" icon={Zap} title="Quickstart Examples">
        <p className="text-sm text-slate-400">Full workflow: create user → activate plan → top up → check stats.</p>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Python</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock lang="python" code={`import requests\n\nBASE = "https://ezaiapi.com/reseller/api"\nHEADERS = {\n    "Authorization": "Bearer rk-your_reseller_key",\n    "Content-Type": "application/json"\n}\n\n# 1. Create end-user\nuser = requests.post(f"{BASE}/users", json={\n    "email": "customer@example.com",\n    "name": "Jane Smith"\n}, headers=HEADERS).json()\nprint("API key:", user["api_key"])  # ek-xxxxxxxx\n\n# 2. Activate a plan\nrequests.post(f"{BASE}/users/{user['id']}/plan", json={\n    "plan": "pro"\n}, headers=HEADERS)\n\n# 3. Top up balance\nrequests.post(f"{BASE}/users/{user['id']}/topup", json={\n    "amount": 10.00\n}, headers=HEADERS)\n\n# 4. Get stats\nstats = requests.get(f"{BASE}/stats", headers=HEADERS).json()\nprint("Reseller balance:", stats["reseller_balance"])`} />
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">JavaScript / Node.js</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock lang="javascript" code={`const BASE = 'https://ezaiapi.com/reseller/api'\nconst HEADERS = {\n  'Authorization': 'Bearer rk-your_reseller_key',\n  'Content-Type': 'application/json'\n}\n\n// 1. Create end-user\nconst user = await fetch(\`\${BASE}/users\`, {\n  method: 'POST',\n  headers: HEADERS,\n  body: JSON.stringify({ email: 'customer@example.com', name: 'Jane Smith' })\n}).then(r => r.json())\nconsole.log('API key:', user.api_key)\n\n// 2. Activate plan\nawait fetch(\`\${BASE}/users/\${user.id}/plan\`, {\n  method: 'POST', headers: HEADERS,\n  body: JSON.stringify({ plan: 'pro' })\n})\n\n// 3. Top up\nawait fetch(\`\${BASE}/users/\${user.id}/topup\`, {\n  method: 'POST', headers: HEADERS,\n  body: JSON.stringify({ amount: 10.00 })\n})\n\n// 4. Stats\nconst stats = await fetch(\`\${BASE}/stats\`, { headers: HEADERS }).then(r => r.json())\nconsole.log('Reseller balance:', stats.reseller_balance)`} />
          </CardContent>
        </Card>
      </Section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
        <Link href="https://ezaiapi.com/reseller" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <Globe size={14} />
          EzAI Reseller Panel
          <ExternalLink size={12} />
        </Link>
        <Link href="https://ezaiapi.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <BookOpen size={14} />
          EzAI Docs
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}
