'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Globe, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface WebhookLogItem {
    id: string
    source: string
    method: string
    headers: Record<string, string>
    body: Record<string, unknown>
    matched_topup_id: string | null
    matched_user_email: string | null
    result: string
    result_message: string
    ip: string | null
    created_at: string
}

const RESULT_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    success: { label: 'Thành công', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    no_match: { label: 'Không khớp', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: XCircle },
    error: { label: 'Lỗi', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
    amount_mismatch: { label: 'Sai số tiền', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle },
    no_ezai: { label: 'Chưa có EzAI', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertTriangle },
}

function LogRow({ log }: { log: WebhookLogItem }) {
    const [expanded, setExpanded] = useState(false)
    const config = RESULT_CONFIG[log.result] || RESULT_CONFIG.error
    const Icon = config.icon
    const time = new Date(log.created_at)

    return (
        <>
            <tr
                className="border-b border-slate-700/30 hover:bg-slate-800/30 cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="text-xs font-mono">
                            {time.toLocaleDateString('vi')} {time.toLocaleTimeString('vi')}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <Badge className={config.color}>
                        <Icon size={12} className="mr-1" />
                        {config.label}
                    </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300 max-w-[300px] truncate">
                    {log.result_message}
                </td>
                <td className="px-4 py-3 text-sm text-purple-300">
                    {log.matched_user_email || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {log.ip}
                </td>
            </tr>
            {expanded && (
                <tr className="border-b border-slate-700/30">
                    <td colSpan={5} className="px-4 py-4 bg-slate-800/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Body */}
                            <div>
                                <p className="text-xs text-slate-400 font-semibold mb-2">📦 Request Body</p>
                                <pre className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg overflow-auto max-h-64 border border-slate-700/50">
                                    {JSON.stringify(log.body, null, 2)}
                                </pre>
                            </div>
                            {/* Headers */}
                            <div>
                                <p className="text-xs text-slate-400 font-semibold mb-2">📋 Headers</p>
                                <pre className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg overflow-auto max-h-64 border border-slate-700/50">
                                    {JSON.stringify(log.headers, null, 2)}
                                </pre>
                            </div>
                        </div>
                        {log.matched_topup_id && (
                            <p className="text-xs text-slate-500 mt-3">
                                Topup ID: <span className="text-slate-400 font-mono">{log.matched_topup_id}</span>
                            </p>
                        )}
                    </td>
                </tr>
            )}
        </>
    )
}

export default function WebhookLogsTable({ logs }: { logs: WebhookLogItem[] }) {
    const successCount = logs.filter(l => l.result === 'success').length
    const errorCount = logs.filter(l => l.result === 'error' || l.result === 'no_ezai').length

    return (
        <div>
            {/* Stats */}
            <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <Globe size={16} className="text-slate-400" />
                    <span className="text-white text-sm font-semibold">{logs.length}</span>
                    <span className="text-slate-400 text-sm">total</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-semibold">{successCount}</span>
                    <span className="text-slate-400 text-sm">success</span>
                </div>
                {errorCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm font-semibold">{errorCount}</span>
                        <span className="text-slate-400 text-sm">errors</span>
                    </div>
                )}
            </div>

            {/* Table */}
            {logs.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Globe size={40} className="mx-auto mb-4 opacity-30" />
                    <p>Chưa có webhook log nào</p>
                </div>
            ) : (
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Thời gian</th>
                                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Kết quả</th>
                                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Chi tiết</th>
                                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">User</th>
                                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => <LogRow key={log.id} log={log} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
