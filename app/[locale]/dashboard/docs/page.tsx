import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, ExternalLink, Key, Globe, AlertTriangle, Zap,
  Terminal, CheckCircle, Clock, ChevronRight, Cpu
} from 'lucide-react'
import Link from 'next/link'

const aiBase = 'https://ezaiapi.com'

const models = [
  // Claude
  { id: 'claude-opus-4-6',    provider: 'Claude',  color: 'orange',  desc: 'Most powerful — complex reasoning' },
  { id: 'claude-opus-4-5',    provider: 'Claude',  color: 'orange',  desc: 'Powerful — long context' },
  { id: 'claude-sonnet-4-6',  provider: 'Claude',  color: 'purple', badge: 'new', desc: 'Balanced speed & quality' },
  { id: 'claude-sonnet-4-5',  provider: 'Claude',  color: 'purple',  desc: 'Balanced speed & quality' },
  { id: 'claude-sonnet-4',    provider: 'Claude',  color: 'purple',  desc: 'Previous generation Sonnet' },
  { id: 'claude-haiku-4-5',   provider: 'Claude',  color: 'blue',    desc: 'Fast and cost-efficient' },
  // GPT / OpenAI
  { id: 'gpt-5.4',            provider: 'GPT',     color: 'green',  badge: 'new', desc: 'Latest GPT flagship' },
  { id: 'gpt-5.3-codex',      provider: 'GPT',     color: 'green',   desc: 'Codex reasoning model' },
  { id: 'gpt-5.2',            provider: 'GPT',     color: 'green',   desc: 'GPT-5.2 general' },
  { id: 'gpt-5.1',            provider: 'GPT',     color: 'green',   desc: 'GPT-5.1 general' },
  { id: 'gpt-5',              provider: 'GPT',     color: 'green',   desc: 'GPT-5 base model' },
  { id: 'gpt-5-mini',         provider: 'GPT',     color: 'green',   desc: 'Compact GPT-5' },
  { id: 'gpt-4.1',            provider: 'GPT',     color: 'green',   desc: 'GPT-4.1 flagship' },
  { id: 'gpt-4.1-mini',       provider: 'GPT',     color: 'green',   desc: 'GPT-4.1 compact' },
  { id: 'gpt-4.1-nano',       provider: 'GPT',     color: 'green',   desc: 'Ultra-fast nano' },
  { id: 'gpt-4o',             provider: 'GPT',     color: 'green',   desc: 'GPT-4o multimodal' },
  { id: 'gpt-4o-mini',        provider: 'GPT',     color: 'green',   desc: 'GPT-4o compact' },
  { id: 'o3',                 provider: 'GPT',     color: 'green',   desc: 'o3 reasoning' },
  { id: 'o3-mini',            provider: 'GPT',     color: 'green',   desc: 'o3-mini reasoning' },
  { id: 'o4-mini',            provider: 'GPT',     color: 'green',   desc: 'o4-mini reasoning' },
  // Gemini
  { id: 'gemini-3-pro',       provider: 'Gemini',  color: 'sky',    badge: 'preview', desc: 'Gemini 3 Pro preview' },
  { id: 'gemini-3-flash',     provider: 'Gemini',  color: 'sky',    badge: 'preview', desc: 'Gemini 3 Flash preview' },
  { id: 'gemini-2.5-pro',     provider: 'Gemini',  color: 'sky',     desc: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash',   provider: 'Gemini',  color: 'sky',     desc: 'Gemini 2.5 Flash' },
  // xAI
  { id: 'grok-code-fast-1',   provider: 'xAI',     color: 'pink',    desc: 'Grok fast code model' },
]

const rateLimits = [
  { tier: 'Free',    rpm: 5,   concurrent: 2,  condition: '$0 balance, no plan' },
  { tier: 'Top-up',  rpm: 30,  concurrent: 5,  condition: 'Has credit balance' },
  { tier: 'Starter', rpm: 30,  concurrent: 5,  condition: 'Monthly plan' },
  { tier: 'Pro',     rpm: 60,  concurrent: 10, condition: 'Monthly plan' },
  { tier: 'Max',     rpm: 90,  concurrent: 15, condition: 'Monthly plan' },
  { tier: 'Ultra',   rpm: 120, concurrent: 20, condition: 'Monthly plan' },
]

const errorCodes = [
  { code: '400', meaning: 'Bad request / invalid body', action: 'Check your JSON payload and required fields' },
  { code: '401', meaning: 'Invalid or missing API key', action: 'Check x-api-key header value' },
  { code: '402', meaning: 'Insufficient balance', action: 'Top up credits in dashboard' },
  { code: '403', meaning: 'IP blocked or Cloudflare WAF', action: 'Wait 5 min (IP block) or set custom User-Agent (SDK)' },
  { code: '405', meaning: 'Method not allowed', action: 'Use POST for /v1/messages' },
  { code: '408', meaning: 'Request timeout', action: 'Retry — upstream model was slow' },
  { code: '413', meaning: 'Payload too large', action: 'Reduce input tokens or message count' },
  { code: '429', meaning: 'Rate limit exceeded (RPM or concurrent)', action: 'Check Retry-After header; reduce frequency' },
  { code: '502', meaning: 'Upstream error', action: 'Retry after a few seconds' },
  { code: '503', meaning: 'All upstream providers busy', action: 'Retry with exponential backoff' },
  { code: '529', meaning: 'Upstream overloaded', action: 'Wait and resend — automatic retry recommended' },
]

const compatibility = [
  { tool: 'Claude Code',      status: '✅', setup: 'Set env vars or run install script' },
  { tool: 'Cursor',           status: '✅', setup: 'Settings → Models → Custom API provider' },
  { tool: 'Cline',            status: '✅', setup: 'Extension settings → Anthropic → Base URL' },
  { tool: 'Continue',         status: '✅', setup: 'config.json → custom provider' },
  { tool: 'Aider',            status: '✅', setup: 'Set ANTHROPIC_BASE_URL env var' },
  { tool: 'OpenAI SDK',       status: '✅', setup: 'Set custom User-Agent (see below)' },
  { tool: 'LiteLLM',          status: '✅', setup: 'Set api_base + api_key' },
  { tool: 'Any Anthropic tool', status: '✅', setup: 'Change base URL + API key' },
]

const providerColor: Record<string, string> = {
  Claude: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  GPT:    'bg-green-500/20 text-green-300 border-green-500/30',
  Gemini: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  xAI:    'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

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

function Section({ id, icon: Icon, title, badge, children }: {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Icon size={18} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {badge && <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">{badge}</Badge>}
      </div>
      {children}
    </section>
  )
}

export default async function DocsPage() {
  // Fetch the user's API key to pre-fill examples
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let apiKey = 'YOUR_API_KEY'
  if (user) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('rb_users')
      .select('ezai_api_key')
      .eq('id', user.id)
      .single()
    if (profile?.ezai_api_key) apiKey = profile.ezai_api_key
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <BookOpen size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">API Documentation</h1>
            <p className="text-slate-400 mt-1">EzAI API — 20+ models, one endpoint</p>
          </div>
        </div>

        {/* What is EzAI */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-slate-800/30 border-purple-500/20">
          <CardContent className="p-6">
            <p className="text-slate-300 leading-relaxed">
              EzAI API is a unified AI gateway that gives you access to{' '}
              <span className="text-purple-300 font-medium">20+ models</span> from Anthropic, OpenAI,
              Google, and xAI through a single endpoint. Fully compatible with{' '}
              <span className="text-white font-medium">Claude Code, Cursor, Cline</span>, and any
              Anthropic or OpenAI-compatible tool.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {[
                { icon: Cpu, title: '20+ AI Models', desc: 'Claude, GPT, Gemini, Grok — one API' },
                { icon: Zap, title: 'Real-time Dashboard', desc: 'Live usage, costs & request tracking' },
                { icon: Globe, title: 'Drop-in Compatible', desc: 'Works with any Anthropic / OpenAI tool' },
              ].map(({ icon: I, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <I size={16} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost advantages */}
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-semibold text-green-300 mb-2">How We Keep Costs Low</p>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-start gap-2"><CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" /><span><span className="font-medium">Smart caching</span> — Maximizing prompt cache hits to cut token costs</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" /><span><span className="font-medium">Infrastructure optimization</span> — Efficient routing reduces overhead</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" /><span><span className="font-medium">Transparent pricing</span> — Pay per token, no hidden fees, no subscriptions required</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '#quickstart', label: 'Quickstart', color: 'text-green-400' },
            { href: '#models', label: 'Models', color: 'text-orange-400' },
            { href: '#endpoints', label: 'Endpoints', color: 'text-purple-400' },
            { href: '#rate-limits', label: 'Rate Limits', color: 'text-yellow-400' },
          ].map(({ href, label, color }) => (
            <a key={href} href={href} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
              <ChevronRight size={14} className={`${color} group-hover:translate-x-0.5 transition-transform`} />
              <span className="text-sm text-slate-300">{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quickstart */}
      <Section id="quickstart" icon={Zap} title="Quickstart" badge="< 1 minute">
        <p className="text-slate-400 text-sm">Up and running in under a minute. Your API key is pre-filled below.</p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <h3 className="text-white font-medium">Your API key</h3>
            </div>
            <div className="ml-8">
              {apiKey !== 'YOUR_API_KEY' ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Key size={14} className="text-green-400 shrink-0" />
                  <code className="text-green-300 font-mono text-sm">{apiKey}</code>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                  <span className="text-yellow-300 text-sm">No API key yet — top up your account to activate one.</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 — install script */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <h3 className="text-white font-medium">Run the install command (Claude Code)</h3>
            </div>
            <div className="ml-8 space-y-3">
              <p className="text-xs text-slate-400">Sets <code className="text-purple-300">ANTHROPIC_BASE_URL</code>, <code className="text-purple-300">ANTHROPIC_API_KEY</code>, and configures <code className="text-slate-300">~/.claude/settings.json</code>.</p>
              <CodeBlock lang="macOS / Linux" code={`curl -fsSL "https://ezaiapi.com/install.sh?key=${apiKey}" | sh`} />
              <CodeBlock lang="Windows (PowerShell)" code={`irm "https://ezaiapi.com/install.ps1?key=${apiKey}" | iex`} />
            </div>
          </div>

          {/* Step 3 — restart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <h3 className="text-white font-medium">Restart your terminal</h3>
            </div>
            <div className="ml-8">
              <CodeBlock lang="bash" code={`source ~/.bashrc  # or ~/.zshrc`} />
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <h3 className="text-white font-medium">Start using Claude Code</h3>
            </div>
            <div className="ml-8">
              <CodeBlock lang="bash" code={`claude`} />
            </div>
          </div>
        </div>

        {/* Manual setup */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 select-none">
            <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
            Manual Installation (if you prefer not to run scripts)
          </summary>
          <div className="mt-3 ml-5 space-y-3">
            <p className="text-xs text-slate-400">Add to <code className="text-purple-300">~/.bashrc</code>, <code className="text-purple-300">~/.zshrc</code>, or your shell config:</p>
            <CodeBlock lang="bash" code={`export ANTHROPIC_BASE_URL="https://ezaiapi.com"\nexport ANTHROPIC_API_KEY="${apiKey}"`} />
            <p className="text-xs text-slate-400">Create or edit <code className="text-purple-300">~/.claude/settings.json</code>:</p>
            <CodeBlock lang="json" code={`{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://ezaiapi.com",\n    "ANTHROPIC_API_KEY": "${apiKey}"\n  },\n  "disableLoginPrompt": true\n}`} />
          </div>
        </details>

        {/* Uninstall */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 select-none">
            <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
            Uninstall
          </summary>
          <div className="mt-3 ml-5">
            <CodeBlock lang="bash" code={`# Remove env vars from your shell config\nunset ANTHROPIC_BASE_URL\nunset ANTHROPIC_API_KEY\n\n# Remove Claude Code settings\nrm ~/.claude/settings.json`} />
          </div>
        </details>
      </Section>

      {/* Authentication */}
      <Section id="auth" icon={Key} title="Authentication">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-slate-300">Include your API key in every request:</p>
            <CodeBlock lang="Request headers" code={`# Required headers\nx-api-key: ${apiKey}\ncontent-type: application/json\nanthropic-version: 2023-06-01`} />
            <p className="text-xs text-slate-400">Base URL: <code className="text-purple-300">https://ezaiapi.com</code> — all requests go here.</p>
          </CardContent>
        </Card>
      </Section>

      {/* Create Message */}
      <Section id="endpoints" icon={Terminal} title="API Endpoints">
        <div className="space-y-6">

          {/* POST /v1/messages */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono text-xs">POST</Badge>
                <code className="text-white font-mono">/v1/messages</code>
              </CardTitle>
              <p className="text-sm text-slate-400">Send a message to any model. The proxy auto-converts between formats — you always use the Anthropic Messages format.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock lang="curl" code={`curl https://ezaiapi.com/v1/messages \\\n  -H "x-api-key: ${apiKey}" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '{\n    "model": "claude-sonnet-4-5",\n    "max_tokens": 1024,\n    "messages": [\n      { "role": "user", "content": "Hello, Claude!" }\n    ]\n  }'`} />
              <p className="text-xs text-slate-500">Response follows the standard Anthropic Messages API format for all models.</p>
            </CardContent>
          </Card>

          {/* Streaming */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 font-mono text-xs">STREAM</Badge>
                <span className="text-white">Streaming</span>
              </CardTitle>
              <p className="text-sm text-slate-400">Add <code className="text-purple-300">&quot;stream&quot;: true</code> to receive Server-Sent Events.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock lang="curl" code={`curl https://ezaiapi.com/v1/messages \\\n  -H "x-api-key: ${apiKey}" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '{\n    "model": "claude-sonnet-4-5",\n    "max_tokens": 1024,\n    "stream": true,\n    "messages": [\n      { "role": "user", "content": "Write a haiku" }\n    ]\n  }'`} />
              <p className="text-xs text-slate-500">SSE events: <code className="text-slate-400">message_start</code> → <code className="text-slate-400">content_block_delta</code> → <code className="text-slate-400">message_stop</code></p>
            </CardContent>
          </Card>

          {/* Extended Thinking */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-mono text-xs">THINK</Badge>
                <span className="text-white">Extended Thinking</span>
              </CardTitle>
              <p className="text-sm text-slate-400">Enable Claude&apos;s chain-of-thought reasoning for complex tasks.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock lang="json" code={`{\n  "model": "claude-opus-4-6",\n  "max_tokens": 16000,\n  "stream": true,\n  "thinking": {\n    "type": "enabled",\n    "budget_tokens": 10000\n  },\n  "messages": [\n    { "role": "user", "content": "Solve this step by step..." }\n  ]\n}`} />
              <div className="text-xs text-slate-500 space-y-1">
                <p>Supported: <code className="text-slate-400">claude-opus-4-6 · claude-sonnet-4-5 · claude-sonnet-4</code></p>
                <p>💡 <code className="text-purple-300">budget_tokens</code>: 5K–10K for most tasks. Max: 32,000. Always use with streaming.</p>
              </div>
            </CardContent>
          </Card>

          {/* Count Tokens */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-xs">POST</Badge>
                <code className="text-white font-mono">/v1/messages/count_tokens</code>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Free</Badge>
              </CardTitle>
              <p className="text-sm text-slate-400">Count tokens without sending — no credits charged.</p>
            </CardHeader>
            <CardContent>
              <CodeBlock lang="curl" code={`curl https://ezaiapi.com/v1/messages/count_tokens \\\n  -H "x-api-key: ${apiKey}" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '{ "model": "claude-sonnet-4-5", "messages": [{ "role": "user", "content": "Hello!" }] }'\n\n// → { "input_tokens": 12 }`} />
            </CardContent>
          </Card>

          {/* OpenAI compat */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono text-xs">POST</Badge>
                <code className="text-white font-mono">/v1/chat/completions</code>
              </CardTitle>
              <p className="text-sm text-slate-400">Native OpenAI Chat Completions format. Use with OpenAI SDK, LiteLLM, or any OpenAI-compatible tool.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock lang="curl" code={`curl https://ezaiapi.com/v1/chat/completions \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "claude-sonnet-4-5",\n    "messages": [\n      { "role": "system", "content": "You are helpful." },\n      { "role": "user", "content": "Hello!" }\n    ],\n    "max_tokens": 1024\n  }'`} />
            </CardContent>
          </Card>

          {/* Responses API */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono text-xs">POST</Badge>
                <code className="text-white font-mono">/v1/responses</code>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">NEW</Badge>
              </CardTitle>
              <p className="text-sm text-slate-400">OpenAI Responses API format. Compatible with n8n, LangChain, and tools using the newer OpenAI SDK.</p>
            </CardHeader>
            <CardContent>
              <CodeBlock lang="curl" code={`curl https://ezaiapi.com/v1/responses \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "model": "claude-sonnet-4-5", "input": "Hello!", "max_output_tokens": 1024 }'`} />
            </CardContent>
          </Card>

        </div>
      </Section>

      {/* SDK Examples */}
      <Section id="sdk" icon={Terminal} title="SDK Examples">
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Anthropic SDK (Python)</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock lang="python" code={`# pip install anthropic\nimport anthropic\n\nclient = anthropic.Anthropic(\n    api_key="${apiKey}",\n    base_url="https://ezaiapi.com"\n)\n\n# Claude\nmsg = client.messages.create(\n    model="claude-sonnet-4-5",\n    max_tokens=1024,\n    messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(msg.content[0].text)\n\n# GPT — same client, just change model\nmsg = client.messages.create(model="gpt-4.1", max_tokens=1024,\n    messages=[{"role": "user", "content": "Hello GPT!"}])\n\n# Gemini\nmsg = client.messages.create(model="gemini-2.5-pro", max_tokens=1024,\n    messages=[{"role": "user", "content": "Hello Gemini!"}])`} />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Anthropic SDK (Node.js)</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock lang="javascript" code={`// npm install @anthropic-ai/sdk\nimport Anthropic from '@anthropic-ai/sdk'\n\nconst client = new Anthropic({\n  apiKey: '${apiKey}',\n  baseURL: 'https://ezaiapi.com'\n})\n\nconst msg = await client.messages.create({\n  model: 'claude-sonnet-4-5',\n  max_tokens: 1024,\n  messages: [{ role: 'user', content: 'Hello!' }]\n})\nconsole.log(msg.content[0].text)`} />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base text-white">OpenAI SDK (Python)</CardTitle>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs shrink-0 ml-2">⚠️ User-Agent required</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">Cloudflare blocks the default <code className="text-slate-300">User-Agent: OpenAI/Python</code> header with a 403. Set a custom User-Agent.</p>
            </CardHeader>
            <CardContent>
              <CodeBlock lang="python" code={`# pip install openai\nfrom openai import OpenAI\n\nclient = OpenAI(\n    base_url="https://ezaiapi.com/v1",\n    api_key="${apiKey}",\n    default_headers={"User-Agent": "EzAI/1.0"}  # Required!\n)\n\nresponse = client.chat.completions.create(\n    model="claude-sonnet-4-5",\n    messages=[\n        {"role": "system", "content": "You are helpful."},\n        {"role": "user", "content": "Hello!"}\n    ],\n    max_tokens=1024\n)\nprint(response.choices[0].message.content)`} />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Models */}
      <Section id="models" icon={Cpu} title="Supported Models">
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Model ID</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Provider</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {models.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <code className="text-white font-mono text-xs">{m.id}</code>
                          {m.badge && (
                            <Badge className={
                              m.badge === 'new' ? 'bg-green-500/20 text-green-300 border-green-500/30 text-[10px] px-1 py-0' :
                              'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px] px-1 py-0'
                            }>{m.badge}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${providerColor[m.provider]}`}>
                          {m.provider}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 hidden sm:table-cell">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-slate-500">All models accessible via <code className="text-purple-300">/v1/messages</code> (Anthropic), <code className="text-purple-300">/v1/chat/completions</code> (OpenAI), and <code className="text-purple-300">/v1/responses</code> (Responses API).</p>
      </Section>

      {/* Compatibility */}
      <Section id="compatibility" icon={CheckCircle} title="Compatibility">
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Tool</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Setup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {compatibility.map((c) => (
                    <tr key={c.tool} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{c.tool}</td>
                      <td className="px-4 py-2.5 text-green-400">{c.status}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{c.setup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Rate Limits */}
      <Section id="rate-limits" icon={Clock} title="Rate Limits">
        <p className="text-sm text-slate-400">Rate limits are applied per account based on your tier. Two limits apply simultaneously: RPM (requests per minute) and Concurrent (max parallel requests).</p>
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Tier</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">RPM</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Concurrent</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 hidden sm:table-cell">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rateLimits.map((r) => (
                    <tr key={r.tier} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{r.tier}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{r.rpm}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{r.concurrent}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs hidden sm:table-cell">{r.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-900/20 border-purple-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-purple-300">💎 <span className="font-medium">Monthly Plans</span> — Get free credits that reset every 5 hours + higher rate limits. Starting from $10/month.</p>
          </CardContent>
        </Card>

        {/* Response headers */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Response Headers</h3>
          <CodeBlock lang="Response headers" code={`x-ratelimit-tier: topup\nx-ratelimit-limit-requests: 30          # RPM limit for your tier\nx-ratelimit-remaining-requests: 28      # Remaining requests this minute\nx-ratelimit-reset-requests: 2026-03-03T09:00:00.000Z\nx-concurrent-limit: 5                   # Max parallel requests\nx-concurrent-remaining: 3               # Available parallel slots`} />
        </div>
      </Section>

      {/* Error Codes */}
      <Section id="errors" icon={AlertTriangle} title="Error Codes">
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Code</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Meaning</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 hidden md:table-cell">What to Do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {errorCodes.map((e) => (
                    <tr key={e.code} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <code className={`font-mono font-bold text-xs ${
                          e.code.startsWith('4') ? 'text-red-400' : 'text-orange-400'
                        }`}>{e.code}</code>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{e.meaning}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs hidden md:table-cell">{e.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Troubleshooting */}
      <Section id="troubleshooting" icon={AlertTriangle} title="Troubleshooting">
        <div className="space-y-4">
          {[
            {
              title: '403 Forbidden with OpenAI SDK',
              desc: 'Cloudflare WAF blocks the default User-Agent: OpenAI/Python header. Set a custom User-Agent:',
              code: `client = OpenAI(\n    base_url="https://ezaiapi.com/v1",\n    api_key="${apiKey}",\n    default_headers={"User-Agent": "EzAI/1.0"}\n)`,
              lang: 'python'
            },
            {
              title: '403 Forbidden — IP Blocked',
              desc: 'Your IP was auto-blocked after 50+ failed auth attempts. Wait 5 minutes for the block to expire, then fix your API key.',
              code: null, lang: ''
            },
            {
              title: '429 Too Many Requests',
              desc: 'You\'ve exceeded your tier\'s rate limit (RPM or concurrent). Check the Retry-After header. If balance is exhausted (402), top up in dashboard.',
              code: null, lang: ''
            },
            {
              title: 'Claude Code not using proxy',
              desc: 'Verify your environment variables are set:',
              code: `echo $ANTHROPIC_BASE_URL   # Should show https://ezaiapi.com\necho $ANTHROPIC_API_KEY    # Should show your API key\ncat ~/.claude/settings.json # Should contain env block`,
              lang: 'bash'
            },
          ].map(({ title, desc, code, lang }) => (
            <Card key={title} className="bg-white/5 border-white/10">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-medium text-white">{title}</h3>
                <p className="text-xs text-slate-400">{desc}</p>
                {code && <CodeBlock lang={lang} code={code} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Changelog */}
      <Section id="changelog" icon={Clock} title="Changelog">
        <div className="space-y-6">
          {[
            {
              month: 'Mar 2026',
              items: [
                'GPT-5.3 Codex, GPT-4.1 Mini/Nano, o3/o3-mini/o4-mini',
                'Streaming usage fix: input_tokens now reported correctly in message_delta',
                'Cache token tracking in Usage tab',
                'Responses API endpoint /v1/responses (n8n, LangChain)',
                'Legacy model auto-mapping (Claude 3.x → 4.x)',
                'GPT-5.1 Codex Mini/Max, GPT-5.2 Codex',
                'LZT Market payment (Invoice + Transfer)',
                'Crypto payment via NOWPayments (350+ coins)',
                'Per-user rate limiting (RPM + Concurrent, 6 tiers)',
                'Reseller system (reseller panel, end-user management, API)',
                'Database optimization (daily aggregation, auto-cleanup)',
              ]
            },
            {
              month: 'Feb 2026',
              items: [
                'Free models: Step 3.5 Flash, GLM 4.5 Air, Nemotron 3 Nano',
                'OpenAI-compatible endpoint /v1/chat/completions',
                'Claude Sonnet 4.6 support',
                'Model discovery endpoint GET /v1/models',
              ]
            },
            {
              month: 'Jan 2026',
              items: [
                'GPT-5.2, GPT-5.2-codex',
                'Gemini 3.1 Pro',
                'Extended thinking support',
                'Real-time usage dashboard',
              ]
            },
            {
              month: 'Dec 2025',
              items: ['🚀 EzAI API launch'],
              launch: true
            }
          ].map(({ month, items, launch }) => (
            <div key={month} className="flex gap-4">
              <div className="shrink-0 pt-0.5">
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${launch ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-400'}`}>{month}</span>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5 shrink-0">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
        <Link href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <BookOpen size={14} />
          Anthropic Docs
          <ExternalLink size={12} />
        </Link>
        <Link href="https://ezaiapi.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <Globe size={14} />
          EzAI Docs
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}
