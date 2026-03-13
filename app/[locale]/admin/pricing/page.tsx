'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Plus, Pencil, Trash2, GripVertical, Star, StarOff,
    Eye, EyeOff, Save, X, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface PricingPlan {
    _id: string
    name: string
    subtitle: string
    price_label: string
    description: string
    description_sub: string
    is_featured: boolean
    order: number
    is_active: boolean
}

const EMPTY_PLAN: Omit<PricingPlan, '_id'> = {
    name: '',
    subtitle: '',
    price_label: '',
    description: '',
    description_sub: '',
    is_featured: false,
    order: 0,
    is_active: true,
}

export default function PricingAdminPage() {
    const { data, isLoading, mutate, isValidating } = useSWR<{ plans: PricingPlan[] }>(
        '/api/admin/pricing',
        fetcher
    )

    const [editing, setEditing] = useState<PricingPlan | null>(null)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState<Omit<PricingPlan, '_id'>>(EMPTY_PLAN)
    const [saving, setSaving] = useState(false)

    const plans = data?.plans || []

    function startCreate() {
        setEditing(null)
        setForm({ ...EMPTY_PLAN, order: plans.length })
        setCreating(true)
    }

    function startEdit(plan: PricingPlan) {
        setCreating(false)
        setEditing(plan)
        setForm({
            name: plan.name,
            subtitle: plan.subtitle,
            price_label: plan.price_label,
            description: plan.description,
            description_sub: plan.description_sub,
            is_featured: plan.is_featured,
            order: plan.order,
            is_active: plan.is_active,
        })
    }

    function cancel() {
        setEditing(null)
        setCreating(false)
        setForm(EMPTY_PLAN)
    }

    async function handleSave() {
        if (!form.name || !form.price_label) {
            toast.error('Tên và giá không được trống')
            return
        }

        setSaving(true)
        try {
            if (creating) {
                const res = await fetch('/api/admin/pricing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
                if (!res.ok) throw new Error()
                toast.success('Đã tạo gói mới!')
            } else if (editing) {
                const res = await fetch('/api/admin/pricing', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: editing._id, ...form }),
                })
                if (!res.ok) throw new Error()
                toast.success('Đã cập nhật!')
            }
            cancel()
            mutate()
        } catch {
            toast.error('Lỗi khi lưu')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Xoá gói này?')) return
        try {
            const res = await fetch('/api/admin/pricing', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            if (!res.ok) throw new Error()
            toast.success('Đã xoá!')
            mutate()
        } catch {
            toast.error('Lỗi khi xoá')
        }
    }

    async function toggleActive(plan: PricingPlan) {
        try {
            await fetch('/api/admin/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: plan._id, is_active: !plan.is_active }),
            })
            mutate()
            toast.success(plan.is_active ? 'Đã ẩn' : 'Đã hiện')
        } catch {
            toast.error('Lỗi')
        }
    }

    async function toggleFeatured(plan: PricingPlan) {
        try {
            await fetch('/api/admin/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: plan._id, is_featured: !plan.is_featured }),
            })
            mutate()
        } catch {
            toast.error('Lỗi')
        }
    }

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bảng giá</h1>
                    <p className="text-slate-400 mt-1">Quản lý gói sản phẩm hiển thị trên landing page</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutate()}
                        disabled={isValidating}
                        className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    >
                        <RefreshCw size={14} className={cn('mr-2', isValidating && 'animate-spin')} />
                    </Button>
                    <Button onClick={startCreate} className="bg-purple-600 hover:bg-purple-700">
                        <Plus size={14} className="mr-2" /> Thêm gói
                    </Button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-20 bg-white/5 rounded-xl" />
                    <Skeleton className="h-20 bg-white/5 rounded-xl" />
                </div>
            )}

            {/* Plan list */}
            {!isLoading && (
                <div className="space-y-3">
                    {plans.length === 0 && !creating && (
                        <p className="text-center text-slate-500 py-12">
                            Chưa có gói nào. Nhấn "Thêm gói" để tạo.
                        </p>
                    )}

                    {plans.map(plan => (
                        <Card
                            key={plan._id}
                            className={cn(
                                'border-white/10 transition-all',
                                plan.is_active ? 'bg-[#0d1117]' : 'bg-[#0d1117]/50 opacity-60',
                                plan.is_featured && 'border-purple-500/40'
                            )}
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                <GripVertical size={16} className="text-slate-600 shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-white font-semibold">{plan.name}</span>
                                        {plan.is_featured && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                Featured
                                            </span>
                                        )}
                                        {!plan.is_active && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                                Ẩn
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-purple-400 font-bold">{plan.price_label}</span>
                                        {plan.subtitle && <span className="text-slate-500">{plan.subtitle}</span>}
                                    </div>
                                    {plan.description && (
                                        <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => toggleFeatured(plan)}
                                        className="h-8 w-8 text-slate-500 hover:text-yellow-400"
                                        title={plan.is_featured ? 'Bỏ featured' : 'Featured'}
                                    >
                                        {plan.is_featured ? <Star size={14} className="fill-yellow-400 text-yellow-400" /> : <StarOff size={14} />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => toggleActive(plan)}
                                        className="h-8 w-8 text-slate-500 hover:text-white"
                                        title={plan.is_active ? 'Ẩn gói' : 'Hiện gói'}
                                    >
                                        {plan.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => startEdit(plan)}
                                        className="h-8 w-8 text-slate-500 hover:text-white"
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete(plan._id)}
                                        className="h-8 w-8 text-slate-500 hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit form */}
            {(creating || editing) && (
                <Card className="bg-[#0d1117] border-purple-500/30 mt-6">
                    <CardHeader>
                        <CardTitle className="text-white text-base">
                            {creating ? '➕ Tạo gói mới' : `✏️ Sửa: ${editing!.name}`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Tên gói *</label>
                                <Input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Pay-as-you-go"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Giá hiển thị *</label>
                                <Input
                                    value={form.price_label}
                                    onChange={e => setForm(f => ({ ...f, price_label: e.target.value }))}
                                    placeholder="x30"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Subtitle</label>
                            <Input
                                value={form.subtitle}
                                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                placeholder="VD: Starter+"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Mô tả</label>
                            <Input
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="100,000 VND → $3.84 USD credit"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Mô tả phụ</label>
                            <Input
                                value={form.description_sub}
                                onChange={e => setForm(f => ({ ...f, description_sub: e.target.value }))}
                                placeholder="Không hết hạn, dùng khi cần"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Thứ tự</label>
                                <Input
                                    type="number"
                                    value={form.order}
                                    onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="flex items-end gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={form.is_featured}
                                        onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                                        className="rounded"
                                    />
                                    Featured
                                </label>
                            </div>
                            <div className="flex items-end gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                        className="rounded"
                                    />
                                    Hiển thị
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                                <Save size={14} className="mr-2" />
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                            <Button onClick={cancel} variant="ghost" className="text-slate-400 hover:text-white">
                                <X size={14} className="mr-2" /> Huỷ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
