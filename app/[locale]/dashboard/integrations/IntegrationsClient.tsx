'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Terminal, Copy, Check, ChevronRight, ExternalLink,
  Workflow, Code2, MessageSquare, Cpu, Bot, Blocks
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  apiKey: string
  aiBase: string
}

/* ─── Integration definitions ──────────────────────── */

interface Integration {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
  badgeColor?: string
  color: string
}

const integrations: Integration[] = [
  { id: 'n8n', name: 'n8n', icon: Workflow, badge: 'Popular', badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30', color: 'text-[#FF6D5A]' },
  { id: 'cursor', name: 'Cursor', icon: Code2, color: 'text-blue-400' },
  { id: 'cline', name: 'Cline', icon: Terminal, color: 'text-emerald-400' },
  { id: 'claude-code', name: 'Claude Code', icon: MessageSquare, color: 'text-orange-400' },
  { id: 'openai-sdk', name: 'OpenAI SDK', icon: Cpu, badge: 'Py / JS', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30', color: 'text-green-400' },
  { id: 'langchain', name: 'LangChain', icon: Blocks, color: 'text-teal-400' },
  { id: 'custom', name: 'HTTP', icon: Bot, color: 'text-purple-400' },
]

/* ─── Reusable components ──────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors group shrink-0"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-slate-500 group-hover:text-slate-300" />}
    </button>
  )
}

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg bg-slate-950 border border-white/10 overflow-hidden">
      {lang && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-mono">{lang}</span>
          </div>
          <CopyButton text={code.trim()} />
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm text-slate-300 font-mono leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
      {!lang && <div className="absolute top-2 right-2"><CopyButton text={code.trim()} /></div>}
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 hover:bg-white/5 transition-colors">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <code className={cn('text-sm', mono ? 'text-purple-300 font-mono' : 'text-white')}>{value}</code>
        {mono && <CopyButton text={value} />}
      </div>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
  )
}

/* ─── N8N Guide ──────────────────────── */
function N8nGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-8">
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base text-white flex items-center gap-2">
            Thông tin API <CopyButton text={`Base URL: ${aiBase}\nAPI Key: ${apiKey}`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="divide-y divide-white/5 border-t border-white/10">
            <InfoRow label="Base URL" value={aiBase} mono />
            <InfoRow label="API Key" value={apiKey} mono />
            <InfoRow label="Model (ví dụ)" value="claude-sonnet-4-5" mono />
          </div>
        </CardContent>
      </Card>

      {/* Cách 1 — Anthropic Node */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">Cách 1</Badge>
          <h3 className="text-lg font-semibold text-white">Dùng Anthropic Node (Khuyến nghị)</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3"><StepNumber n={1} /><h4 className="text-white font-medium">Tạo Credential Anthropic</h4></div>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-slate-400">Mở n8n → <strong className="text-white">Settings</strong> → <strong className="text-white">Credentials</strong> → <strong className="text-white">Add Credential</strong></p>
            <p className="text-sm text-slate-400">Tìm chọn <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">&quot;Anthropic&quot;</code></p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3"><StepNumber n={2} /><h4 className="text-white font-medium">Điền thông tin Connection</h4></div>
          <div className="ml-10">
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0 divide-y divide-white/5">
                <div className="grid grid-cols-[130px_1fr]">
                  <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Field</div>
                  <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400">Value</div>
                </div>
                <div className="grid grid-cols-[130px_1fr]">
                  <div className="px-4 py-2.5 text-sm font-medium text-white border-r border-white/5">API Key</div>
                  <div className="px-4 py-2.5 flex items-center gap-2"><code className="text-sm text-purple-300 font-mono break-all">{apiKey}</code><CopyButton text={apiKey} /></div>
                </div>
                <div className="grid grid-cols-[130px_1fr]">
                  <div className="px-4 py-2.5 text-sm font-medium text-white border-r border-white/5">Base URL</div>
                  <div className="px-4 py-2.5 flex items-center gap-2"><code className="text-sm text-purple-300 font-mono">{aiBase}</code><CopyButton text={aiBase} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3"><StepNumber n={3} /><h4 className="text-white font-medium">Bật Custom Header</h4></div>
          <div className="ml-10 space-y-3">
            <p className="text-sm text-slate-400">Tìm <strong className="text-white">&quot;Add Custom Header&quot;</strong> → Bật toggle <strong className="text-green-400">ON</strong>. Thêm header:</p>
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0 divide-y divide-white/5">
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Header Name</div>
                  <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400">Header Value</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-2.5 flex items-center gap-2 border-r border-white/5"><code className="text-sm text-purple-300 font-mono">anthropic-version</code><CopyButton text="anthropic-version" /></div>
                  <div className="px-4 py-2.5 flex items-center gap-2"><code className="text-sm text-purple-300 font-mono">2023-06-01</code><CopyButton text="2023-06-01" /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3"><StepNumber n={4} /><h4 className="text-white font-medium">Thêm node vào Workflow</h4></div>
          <div className="ml-10">
            <p className="text-sm text-slate-400">Thêm node <strong className="text-white">Anthropic</strong> → Chọn credential vừa tạo → Nhập model: <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">claude-sonnet-4-5</code></p>
          </div>
        </div>

        <Card className="bg-green-500/10 border-green-500/20 ml-10">
          <CardContent className="p-4 flex items-start gap-3">
            <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-green-200"><strong>Xong!</strong> Tất cả models (Claude, GPT, Gemini, Grok) đều dùng được qua node Anthropic này.</p>
          </CardContent>
        </Card>
      </div>

      {/* Cách 2 — OpenAI Node */}
      <div className="space-y-5 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Cách 2</Badge>
          <h3 className="text-lg font-semibold text-white">Dùng OpenAI Node</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3"><StepNumber n={1} /><h4 className="text-white font-medium">Tạo Credential OpenAI</h4></div>
          <div className="ml-10">
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0 divide-y divide-white/5">
                <InfoRow label="API Key" value={apiKey} mono />
                <InfoRow label="Base URL" value={`${aiBase}/v1`} mono />
              </CardContent>
            </Card>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
              <p className="text-xs text-yellow-300">⚠️ Nếu gặp lỗi 403, thêm Custom Header: <code className="bg-yellow-500/10 px-1 rounded">User-Agent: 2BRAIN/1.0</code></p>
            </div>
          </div>
        </div>
      </div>

      {/* Cách 3 — HTTP Request */}
      <div className="space-y-5 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Cách 3</Badge>
          <h3 className="text-lg font-semibold text-white">HTTP Request Node</h3>
        </div>
        <CodeBlock lang="HTTP Request Config" code={`URL: ${aiBase}/v1/messages
Method: POST

Headers:
  x-api-key: ${apiKey}
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body (JSON):
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "messages": [
    { "role": "user", "content": "{{$json.input}}" }
  ]
}`} />
      </div>

      {/* Models */}
      <div className="space-y-3 pt-6 border-t border-white/10">
        <h3 className="text-base font-semibold text-white">Models phù hợp cho n8n</h3>
        <Card className="bg-slate-950 border-white/10 overflow-hidden">
          <CardContent className="p-0 divide-y divide-white/5">
            <div className="grid grid-cols-3">
              <div className="px-4 py-2 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Model</div>
              <div className="px-4 py-2 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Tốc độ</div>
              <div className="px-4 py-2 bg-white/5 text-xs font-medium text-slate-400">Phù hợp</div>
            </div>
            {[
              { model: 'claude-sonnet-4-5', speed: '⚡ Nhanh', use: 'Workflow chính, xử lý text' },
              { model: 'claude-haiku-4-5', speed: '⚡⚡ Rất nhanh', use: 'Tasks đơn giản, classify' },
              { model: 'gpt-4.1-mini', speed: '⚡⚡ Rất nhanh', use: 'Extract data, format' },
              { model: 'gemini-2.5-flash', speed: '⚡⚡⚡ Siêu nhanh', use: 'Batch, giá rẻ' },
            ].map(({ model, speed, use }) => (
              <div key={model} className="grid grid-cols-3 hover:bg-white/5 transition-colors">
                <div className="px-4 py-2.5 border-r border-white/5 flex items-center gap-2">
                  <code className="text-sm text-purple-300 font-mono">{model}</code><CopyButton text={model} />
                </div>
                <div className="px-4 py-2.5 text-sm text-slate-300 border-r border-white/5">{speed}</div>
                <div className="px-4 py-2.5 text-sm text-slate-400">{use}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ─── Cursor Guide ──────────────────────── */
function CursorGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={1} /><h4 className="text-white font-medium">Mở Cursor Settings → Models → Add Model</h4></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={2} /><h4 className="text-white font-medium">Cấu hình</h4></div>
        <div className="ml-10">
          <Card className="bg-slate-950 border-white/10 overflow-hidden">
            <CardContent className="p-0 divide-y divide-white/5">
              <InfoRow label="API Key" value={apiKey} mono />
              <InfoRow label="Base URL" value={aiBase} mono />
              <InfoRow label="Model" value="claude-sonnet-4-5" mono />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="bg-green-500/10 border-green-500/20 ml-10"><CardContent className="p-4"><p className="text-sm text-green-200"><strong>Xong!</strong> Cursor sẽ dùng 2BRAIN API cho tất cả AI requests.</p></CardContent></Card>
    </div>
  )
}

/* ─── Cline Guide ──────────────────────── */
function ClineGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={1} /><h4 className="text-white font-medium">VS Code → Extensions → Cline → ⚙️ Settings</h4></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={2} /><h4 className="text-white font-medium">Chọn Provider & nhập thông tin</h4></div>
        <div className="ml-10">
          <Card className="bg-slate-950 border-white/10 overflow-hidden">
            <CardContent className="p-0 divide-y divide-white/5">
              <InfoRow label="Provider" value="Anthropic" />
              <InfoRow label="API Key" value={apiKey} mono />
              <InfoRow label="Base URL" value={aiBase} mono />
              <InfoRow label="Model" value="claude-sonnet-4-5" mono />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="bg-green-500/10 border-green-500/20 ml-10"><CardContent className="p-4"><p className="text-sm text-green-200"><strong>Xong!</strong> Cline sẽ dùng 2BRAIN API thay vì Anthropic trực tiếp.</p></CardContent></Card>
    </div>
  )
}

/* ─── Claude Code Guide ──────────────────────── */
function ClaudeCodeGuide({ apiKey, aiBase }: Props) {
  const settingsJson = `{
  "env": {
    "ANTHROPIC_API_KEY": "${apiKey}",
    "ANTHROPIC_BASE_URL": "${aiBase}/",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "API_TIMEOUT_MS": "200000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}`
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={1} /><h4 className="text-white font-medium">Chạy install script (tự động)</h4></div>
        <div className="ml-10 space-y-2">
          <CodeBlock lang="macOS / Linux" code={`curl -fsSL "${aiBase}/install.sh?key=${apiKey}" | sh`} />
          <CodeBlock lang="Windows (PowerShell)" code={`irm "${aiBase}/install.ps1?key=${apiKey}" | iex`} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3"><StepNumber n={2} /><h4 className="text-white font-medium">Restart terminal & dùng</h4></div>
        <div className="ml-10"><CodeBlock lang="bash" code={`source ~/.bashrc  # or ~/.zshrc\nclaude`} /></div>
      </div>
      <details className="group ml-10" open>
        <summary className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />Cài đặt thủ công (settings.json)
        </summary>
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Thêm vào <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">~/.claude/settings.json</code>:</p>
            <CodeBlock lang="~/.claude/settings.json" code={settingsJson} />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-200 font-medium">📋 Giải thích các biến:</p>
            <div className="grid gap-1.5 text-xs text-slate-400">
              <div className="flex gap-2">
                <code className="text-cyan-300 shrink-0">ANTHROPIC_BASE_URL</code>
                <span>— Endpoint API proxy</span>
              </div>
              <div className="flex gap-2">
                <code className="text-cyan-300 shrink-0">ANTHROPIC_DEFAULT_OPUS_MODEL</code>
                <span>— Model mặc định khi chọn Opus</span>
              </div>
              <div className="flex gap-2">
                <code className="text-cyan-300 shrink-0">ANTHROPIC_DEFAULT_SONNET_MODEL</code>
                <span>— Model mặc định khi chọn Sonnet</span>
              </div>
              <div className="flex gap-2">
                <code className="text-cyan-300 shrink-0">API_TIMEOUT_MS</code>
                <span>— Timeout 200s, tránh bị ngắt khi xử lý nặng</span>
              </div>
              <div className="flex gap-2">
                <code className="text-cyan-300 shrink-0">CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC</code>
                <span>— Tắt telemetry, tiết kiệm quota</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Hoặc export trực tiếp trong terminal:</p>
            <CodeBlock lang="bash" code={`export ANTHROPIC_API_KEY="${apiKey}"
export ANTHROPIC_BASE_URL="${aiBase}/"
export ANTHROPIC_DEFAULT_OPUS_MODEL="claude-opus-4-6"
export ANTHROPIC_DEFAULT_SONNET_MODEL="claude-sonnet-4-6"
export API_TIMEOUT_MS="200000"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"`} />
          </div>
        </div>
      </details>
    </div>
  )
}

/* ─── OpenAI SDK Guide ──────────────────────── */
function OpenAISdkGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <CodeBlock lang="Python" code={`from openai import OpenAI

client = OpenAI(
    base_url="${aiBase}/v1",
    api_key="${apiKey}",
    default_headers={"User-Agent": "2BRAIN/1.0"}  # Required!
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=1024
)
print(response.choices[0].message.content)`} />

      <CodeBlock lang="Node.js" code={`import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${aiBase}/v1',
  apiKey: '${apiKey}',
  defaultHeaders: { 'User-Agent': '2BRAIN/1.0' }
})

const res = await client.chat.completions.create({
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1024
})
console.log(res.choices[0].message.content)`} />

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-sm text-yellow-300">⚠️ <strong>Bắt buộc:</strong> Thêm <code className="bg-yellow-500/10 px-1 rounded">User-Agent: 2BRAIN/1.0</code> header để tránh Cloudflare chặn 403.</p>
      </div>
    </div>
  )
}

/* ─── LangChain Guide ──────────────────────── */
function LangChainGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <CodeBlock lang="Python (Anthropic)" code={`from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4-5",
    anthropic_api_key="${apiKey}",
    anthropic_api_url="${aiBase}",
)
response = llm.invoke("Hello from LangChain!")
print(response.content)`} />

      <CodeBlock lang="Python (OpenAI compat)" code={`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="claude-sonnet-4-5",
    openai_api_key="${apiKey}",
    openai_api_base="${aiBase}/v1",
    default_headers={"User-Agent": "2BRAIN/1.0"},
)
response = llm.invoke("Hello from LangChain!")
print(response.content)`} />
    </div>
  )
}

/* ─── Custom / HTTP Guide ──────────────────────── */
function CustomGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">2BRAIN tương thích với bất kỳ tool nào hỗ trợ Anthropic hoặc OpenAI format. Chỉ cần thay Base URL + API Key:</p>
      <Card className="bg-slate-950 border-white/10 overflow-hidden">
        <CardContent className="p-0 divide-y divide-white/5">
          <InfoRow label="Base URL (Anthropic)" value={aiBase} mono />
          <InfoRow label="Base URL (OpenAI)" value={`${aiBase}/v1`} mono />
          <InfoRow label="API Key" value={apiKey} mono />
          <InfoRow label="Header (Anthropic)" value="x-api-key: YOUR_KEY" />
          <InfoRow label="Header (OpenAI)" value="Authorization: Bearer YOUR_KEY" />
        </CardContent>
      </Card>

      <CodeBlock lang="cURL" code={`curl ${aiBase}/v1/messages \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`} />
    </div>
  )
}

/* ─── Guide router ──────────────────────── */

const guideMap: Record<string, { component: React.ComponentType<Props>; title: string; desc: string }> = {
  'n8n': { component: N8nGuide, title: 'Kết nối với n8n', desc: 'Workflow automation — Anthropic & OpenAI nodes' },
  'cursor': { component: CursorGuide, title: 'Kết nối với Cursor', desc: 'AI-powered code editor' },
  'cline': { component: ClineGuide, title: 'Kết nối với Cline', desc: 'VS Code AI coding assistant' },
  'claude-code': { component: ClaudeCodeGuide, title: 'Kết nối với Claude Code', desc: 'Anthropic CLI agent' },
  'openai-sdk': { component: OpenAISdkGuide, title: 'OpenAI SDK', desc: 'Python & Node.js — Chat Completions' },
  'langchain': { component: LangChainGuide, title: 'LangChain', desc: 'LLM framework — Python' },
  'custom': { component: CustomGuide, title: 'Custom / HTTP Request', desc: 'Bất kỳ tool hỗ trợ custom endpoint' },
}

/* ─── Main page ──────────────────────── */

export default function IntegrationsClient({ apiKey, aiBase }: Props) {
  const [active, setActive] = useState('n8n')
  const guide = guideMap[active]
  const GuideComponent = guide.component

  return (
    <div className="p-6 sm:p-8">
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Workflow size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Integrations</h1>
            <p className="text-slate-400 mt-1">Hướng dẫn kết nối 2BRAIN API với các tools phổ biến</p>
          </div>
        </div>
      </div>

      {/* Tool pills — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {integrations.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap border shrink-0',
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
              )}
            >
              <Icon size={16} className={isActive ? 'text-purple-400' : ''} />
              {item.name}
              {item.badge && (
                <Badge className={cn('text-[10px] px-1.5 py-0 h-4 ml-0.5', isActive ? 'bg-purple-500/30 text-purple-200 border-purple-400/30' : item.badgeColor || 'bg-white/10 text-slate-500')}>
                  {item.badge}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Active guide header */}
      <div className="flex items-center gap-3 pb-2 border-b border-white/10">
        {(() => { const Icon = integrations.find(i => i.id === active)?.icon || Workflow; const color = integrations.find(i => i.id === active)?.color || 'text-purple-400'; return (
          <div className={cn('p-2 rounded-lg bg-white/5 border border-white/10')}>
            <Icon size={18} className={color} />
          </div>
        )})()}
        <div>
          <h2 className="text-xl font-bold text-white">{guide.title}</h2>
          <p className="text-sm text-slate-400">{guide.desc}</p>
        </div>
        <a href={aiBase} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          API Docs <ExternalLink size={11} />
        </a>
      </div>

      {/* Guide content */}
      <GuideComponent apiKey={apiKey} aiBase={aiBase} />
    </div>
    </div>
  )
}
