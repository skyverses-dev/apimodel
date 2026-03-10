'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={handleCopy}
      className="border-white/10 hover:bg-white/10 flex-shrink-0"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-400" />}
    </Button>
  )
}
