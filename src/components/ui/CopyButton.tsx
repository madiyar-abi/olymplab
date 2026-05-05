'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  value: string
  className?: string
  showText?: boolean
}

export function CopyButton({ value, className, showText = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
      } catch {
        console.error('Failed to copy text')
      }
      document.body.removeChild(textArea)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "relative flex items-center justify-center gap-1.5 transition-all duration-200 border overflow-hidden active:scale-95",
        showText ? "px-3 py-1.5 rounded-lg text-[11px] font-mono" : "p-2 rounded-lg",
        copied
          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
          : "bg-secondary/40 hover:bg-secondary text-muted-foreground border-border/60 hover:text-foreground hover:border-border",
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      <div className={cn(
        "flex items-center gap-1.5 transition-all duration-300",
        copied ? "opacity-0 scale-90 translate-y-2" : "opacity-100 scale-100 translate-y-0"
      )}>
        <Copy className={cn(showText ? "w-3.5 h-3.5" : "w-4 h-4")} strokeWidth={2} />
        {showText && <span className="font-bold tracking-tight">COPY</span>}
      </div>

      <div className={cn(
        "absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-300",
        copied ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-110 -translate-y-2"
      )}>
        <Check className={cn(showText ? "w-3.5 h-3.5" : "w-4 h-4")} strokeWidth={2.5} />
        {showText && <span className="font-bold tracking-tight">COPIED!</span>}
      </div>
    </button>
  )
}
