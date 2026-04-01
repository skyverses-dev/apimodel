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
  description: string
}

const integrations: Integration[] = [
  {
    id: 'n8n',
    name: 'n8n',
    icon: Workflow,
    badge: 'Popular',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'Workflow automation — Anthropic & OpenAI nodes',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: Code2,
    description: 'AI-powered code editor',
  },
  {
    id: 'cline',
    name: 'Cline',
    icon: Terminal,
    description: 'VS Code AI coding assistant',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: MessageSquare,
    description: 'Anthropic CLI agent',
  },
  {
    id: 'openai-sdk',
    name: 'OpenAI SDK',
    icon: Cpu,
    badge: 'Python / Node.js',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Official OpenAI Python & Node.js SDKs',
  },
  {
    id: 'langchain',
    name: 'LangChain',
    icon: Blocks,
    description: 'LLM framework — Python & JS',
  },
  {
    id: 'custom',
    name: 'Custom / HTTP',
    icon: Bot,
    description: 'Any tool that supports custom API endpoint',
  },
]

/* ─── Reusable components ──────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors group shrink-0"
      title="Copy"
    >
      {copied
        ? <Check size={13} className="text-green-400" />
        : <Copy size={13} className="text-slate-500 group-hover:text-slate-300" />
      }
    </button>
  )
}

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg bg-slate-950 border border-white/10 overflow-hidden group">
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
      {!lang && (
        <div className="absolute top-2 right-2">
          <CopyButton text={code.trim()} />
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 hover:bg-white/5 transition-colors group">
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
    <span className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  )
}

/* ─── Integration guides ──────────────────────── */

function N8nGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#FF6D5A]/10 border border-[#FF6D5A]/20">
            <Workflow size={22} className="text-[#FF6D5A]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Kết nối với n8n</h2>
            <p className="text-slate-400 text-sm">Sử dụng 2BRAIN API trong n8n workflows</p>
          </div>
        </div>
      </div>

      {/* API Info Card */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base text-white flex items-center gap-2">
            Thông tin API
            <CopyButton text={`Base URL: ${aiBase}\nAPI Key: ${apiKey}`} />
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

      {/* Method 1: Anthropic Node */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">Cách 1</Badge>
          <h3 className="text-lg font-semibold text-white">Dùng Anthropic Node (Khuyến nghị)</h3>
        </div>

        {/* Step 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <h4 className="text-white font-medium">Tạo Credential Anthropic</h4>
          </div>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-slate-400">
              Mở n8n → <strong className="text-white">Settings</strong> → <strong className="text-white">Credentials</strong> → <strong className="text-white">Add Credential</strong>
            </p>
            <p className="text-sm text-slate-400">
              Tìm chọn <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">&quot;Anthropic&quot;</code>
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <h4 className="text-white font-medium">Điền thông tin Connection</h4>
          </div>
          <div className="ml-10">
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Field</div>
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400">Value</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 text-sm font-medium text-white border-r border-white/5">API Key</div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <code className="text-sm text-purple-300 font-mono break-all">{apiKey}</code>
                      <CopyButton text={apiKey} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 text-sm font-medium text-white border-r border-white/5">Base URL</div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <code className="text-sm text-purple-300 font-mono">{aiBase}</code>
                      <CopyButton text={aiBase} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={3} />
            <h4 className="text-white font-medium">Bật Custom Header</h4>
          </div>
          <div className="ml-10 space-y-3">
            <p className="text-sm text-slate-400">
              Tìm mục <strong className="text-white">&quot;Add Custom Header&quot;</strong> → Bật toggle <strong className="text-green-400">ON</strong>
            </p>
            <p className="text-sm text-slate-400">Thêm header:</p>
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Header Name</div>
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400">Header Value</div>
                  </div>
                  <div className="grid grid-cols-2 gap-0">
                    <div className="px-4 py-3 flex items-center gap-2 border-r border-white/5">
                      <code className="text-sm text-purple-300 font-mono">anthropic-version</code>
                      <CopyButton text="anthropic-version" />
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <code className="text-sm text-purple-300 font-mono">2023-06-01</code>
                      <CopyButton text="2023-06-01" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={4} />
            <h4 className="text-white font-medium">Thêm Anthropic Node vào Workflow</h4>
          </div>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-slate-400">
              Tạo workflow mới → Thêm node <strong className="text-white">Anthropic</strong> → Chọn credential vừa tạo.
            </p>
            <p className="text-sm text-slate-400">
              Nhập model: <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">claude-sonnet-4-5</code> (hoặc bất kỳ model nào trong danh sách)
            </p>
          </div>
        </div>

        {/* Tip */}
        <Card className="bg-green-500/10 border-green-500/20 ml-10">
          <CardContent className="p-4 flex items-start gap-3">
            <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-green-200">
              <strong>Xong!</strong> Bạn có thể dùng tất cả models (Claude, GPT, Gemini, Grok) qua node Anthropic này.
              Model sẽ được tự động route phía server.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Method 2: OpenAI Node */}
      <div className="space-y-5 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Cách 2</Badge>
          <h3 className="text-lg font-semibold text-white">Dùng OpenAI Node</h3>
        </div>

        <p className="text-sm text-slate-400">
          Nếu bạn muốn dùng format OpenAI (Chat Completions hoặc Responses API):
        </p>

        {/* Step 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <h4 className="text-white font-medium">Tạo Credential OpenAI</h4>
          </div>
          <div className="ml-10">
            <p className="text-sm text-slate-400 mb-3">
              <strong className="text-white">Settings</strong> → <strong className="text-white">Credentials</strong> → <strong className="text-white">Add Credential</strong> → Chọn <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">&quot;OpenAI&quot;</code>
            </p>
            <Card className="bg-slate-950 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Field</div>
                    <div className="px-4 py-3 bg-white/5 text-xs font-medium text-slate-400">Value</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 text-sm font-medium text-white border-r border-white/5">API Key</div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <code className="text-sm text-purple-300 font-mono break-all">{apiKey}</code>
                      <CopyButton text={apiKey} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-0">
                    <div className="px-4 py-3 text-sm font-medium text-white border-r border-white/5">Base URL</div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <code className="text-sm text-purple-300 font-mono">{aiBase}/v1</code>
                      <CopyButton text={`${aiBase}/v1`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <h4 className="text-white font-medium">Sử dụng trong workflow</h4>
          </div>
          <div className="ml-10 space-y-2">
            <p className="text-sm text-slate-400">
              Thêm node <strong className="text-white">OpenAI</strong> → Chọn credential vừa tạo → Nhập model name.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                ⚠️ <strong>Lưu ý:</strong> Nếu gặp lỗi 403, thêm Custom Header: <code className="bg-yellow-500/10 px-1 rounded">User-Agent: 2BRAIN/1.0</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HTTP Request fallback */}
      <div className="space-y-5 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Cách 3</Badge>
          <h3 className="text-lg font-semibold text-white">Dùng HTTP Request Node</h3>
        </div>

        <p className="text-sm text-slate-400">Linh hoạt nhất — dùng khi node Anthropic/OpenAI không phù hợp:</p>

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

      {/* Models reference */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h3 className="text-base font-semibold text-white">Models thường dùng trong n8n</h3>
        <Card className="bg-slate-950 border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-3 gap-0">
                <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Model</div>
                <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400 border-r border-white/5">Tốc độ</div>
                <div className="px-4 py-2.5 bg-white/5 text-xs font-medium text-slate-400">Phù hợp</div>
              </div>
              {[
                { model: 'claude-sonnet-4-5', speed: '⚡ Nhanh', use: 'Workflow chính, xử lý text' },
                { model: 'claude-haiku-4-5', speed: '⚡⚡ Rất nhanh', use: 'Tasks đơn giản, classify' },
                { model: 'gpt-4.1-mini', speed: '⚡⚡ Rất nhanh', use: 'Extract data, format' },
                { model: 'gemini-2.5-flash', speed: '⚡⚡⚡ Siêu nhanh', use: 'Batch processing, giá rẻ' },
                { model: 'claude-opus-4-6', speed: '🐢 Chậm hơn', use: 'Reasoning phức tạp' },
              ].map(({ model, speed, use }) => (
                <div key={model} className="grid grid-cols-3 gap-0 hover:bg-white/5 transition-colors">
                  <div className="px-4 py-2.5 border-r border-white/5 flex items-center gap-2">
                    <code className="text-sm text-purple-300 font-mono">{model}</code>
                    <CopyButton text={model} />
                  </div>
                  <div className="px-4 py-2.5 text-sm text-slate-300 border-r border-white/5">{speed}</div>
                  <div className="px-4 py-2.5 text-sm text-slate-400">{use}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CursorGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Code2 size={22} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Kết nối với Cursor</h2>
          <p className="text-slate-400 text-sm">AI code editor — custom API provider</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={1} />
          <h4 className="text-white font-medium">Mở Settings</h4>
        </div>
        <div className="ml-10">
          <p className="text-sm text-slate-400">
            <strong className="text-white">Cursor Settings</strong> → <strong className="text-white">Models</strong> → <strong className="text-white">Add Model</strong>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={2} />
          <h4 className="text-white font-medium">Cấu hình API</h4>
        </div>
        <div className="ml-10">
          <Card className="bg-slate-950 border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                <InfoRow label="API Key" value={apiKey} mono />
                <InfoRow label="Base URL" value={aiBase} mono />
                <InfoRow label="Model" value="claude-sonnet-4-5" mono />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-green-500/10 border-green-500/20 ml-10">
        <CardContent className="p-4">
          <p className="text-sm text-green-200">
            <strong>Xong!</strong> Cursor sẽ dùng 2BRAIN API cho tất cả AI requests.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ClineGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Terminal size={22} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Kết nối với Cline</h2>
          <p className="text-slate-400 text-sm">VS Code AI coding assistant extension</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={1} />
          <h4 className="text-white font-medium">Mở Extension Settings</h4>
        </div>
        <div className="ml-10">
          <p className="text-sm text-slate-400">
            VS Code → Extensions → <strong className="text-white">Cline</strong> → ⚙️ Settings
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={2} />
          <h4 className="text-white font-medium">Chọn Provider & nhập thông tin</h4>
        </div>
        <div className="ml-10">
          <Card className="bg-slate-950 border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                <InfoRow label="Provider" value="Anthropic" />
                <InfoRow label="API Key" value={apiKey} mono />
                <InfoRow label="Base URL" value={aiBase} mono />
                <InfoRow label="Model" value="claude-sonnet-4-5" mono />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-green-500/10 border-green-500/20 ml-10">
        <CardContent className="p-4">
          <p className="text-sm text-green-200">
            <strong>Xong!</strong> Cline sẽ dùng 2BRAIN API thay vì Anthropic trực tiếp.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ClaudeCodeGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <MessageSquare size={22} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Kết nối với Claude Code</h2>
          <p className="text-slate-400 text-sm">Anthropic CLI agent — terminal</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={1} />
          <h4 className="text-white font-medium">Chạy install script (tự động)</h4>
        </div>
        <div className="ml-10 space-y-2">
          <CodeBlock lang="macOS / Linux" code={`curl -fsSL "${aiBase}/install.sh?key=${apiKey}" | sh`} />
          <CodeBlock lang="Windows (PowerShell)" code={`irm "${aiBase}/install.ps1?key=${apiKey}" | iex`} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StepNumber n={2} />
          <h4 className="text-white font-medium">Restart terminal & dùng</h4>
        </div>
        <div className="ml-10">
          <CodeBlock lang="bash" code={`source ~/.bashrc  # or ~/.zshrc\nclaude`} />
        </div>
      </div>

      <details className="group ml-10">
        <summary className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
          Cài đặt thủ công
        </summary>
        <div className="mt-3 space-y-3">
          <CodeBlock lang="bash" code={`export ANTHROPIC_BASE_URL="${aiBase}"\nexport ANTHROPIC_API_KEY="${apiKey}"`} />
          <CodeBlock lang="~/.claude/settings.json" code={`{\n  "env": {\n    "ANTHROPIC_BASE_URL": "${aiBase}",\n    "ANTHROPIC_API_KEY": "${apiKey}"\n  },\n  "disableLoginPrompt": true\n}`} />
        </div>
      </details>
    </div>
  )
}

function OpenAISdkGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <Cpu size={22} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">OpenAI SDK</h2>
          <p className="text-slate-400 text-sm">Python & Node.js — Chat Completions format</p>
        </div>
      </div>

      <CodeBlock lang="Python" code={`from openai import OpenAI

client = OpenAI(
    base_url="${aiBase}/v1",
    api_key="${apiKey}",
    default_headers={"User-Agent": "2BRAIN/1.0"}  # Required!
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hello!"}
    ],
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
        <p className="text-sm text-yellow-300">
          ⚠️ <strong>Bắt buộc:</strong> Thêm <code className="bg-yellow-500/10 px-1 rounded">User-Agent: 2BRAIN/1.0</code> header để tránh Cloudflare chặn 403.
        </p>
      </div>
    </div>
  )
}

function LangChainGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
          <Blocks size={22} className="text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">LangChain</h2>
          <p className="text-slate-400 text-sm">LLM framework — Python</p>
        </div>
      </div>

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

function CustomGuide({ apiKey, aiBase }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Bot size={22} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Custom / HTTP Request</h2>
          <p className="text-slate-400 text-sm">Bất kỳ tool nào hỗ trợ custom API endpoint</p>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        2BRAIN tương thích với bất kỳ tool nào hỗ trợ Anthropic hoặc OpenAI API format. Chỉ cần thay:
      </p>

      <Card className="bg-slate-950 border-white/10 overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            <InfoRow label="Base URL (Anthropic)" value={aiBase} mono />
            <InfoRow label="Base URL (OpenAI)" value={`${aiBase}/v1`} mono />
            <InfoRow label="API Key" value={apiKey} mono />
            <InfoRow label="Header (Anthropic)" value="x-api-key: YOUR_KEY" />
            <InfoRow label="Header (OpenAI)" value="Authorization: Bearer YOUR_KEY" />
          </div>
        </CardContent>
      </Card>

      <h3 className="text-base font-semibold text-white pt-2">cURL Example</h3>
      <CodeBlock lang="bash" code={`curl ${aiBase}/v1/messages \\
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

const guideComponents: Record<string, React.ComponentType<Props>> = {
  'n8n': N8nGuide,
  'cursor': CursorGuide,
  'cline': ClineGuide,
  'claude-code': ClaudeCodeGuide,
  'openai-sdk': OpenAISdkGuide,
  'langchain': LangChainGuide,
  'custom': CustomGuide,
}

/* ─── Main page ──────────────────────── */

export default function IntegrationsClient({ apiKey, aiBase }: Props) {
  const [active, setActive] = useState('n8n')
  const GuideComponent = guideComponents[active] || N8nGuide

  return (
    <div className="flex min-h-[calc(100vh-2rem)]">
      {/* Left sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 py-6 pr-4 hidden md:block">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-3 font-medium">Integrations</h3>
        <nav className="space-y-0.5">
          {integrations.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge className={cn('text-[10px] px-1.5 py-0 h-4', item.badgeColor || 'bg-white/10 text-slate-400')}>
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight size={12} />}
              </button>
            )
          })}
        </nav>

        {/* Help link */}
        <div className="mt-6 px-3">
          <a
            href={`${aiBase}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink size={12} />
            API Documentation
          </a>
        </div>
      </aside>

      {/* Mobile selector */}
      <div className="md:hidden sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm border-b border-white/10 p-3 -mx-6 mb-6">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          {integrations.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <main className="flex-1 py-6 pl-6 md:pl-8 overflow-y-auto">
        <GuideComponent apiKey={apiKey} aiBase={aiBase} />
      </main>
    </div>
  )
}
