'use client'

import React from 'react'
import { Verdict, VERDICT_METADATA, mapRawVerdict } from '@/types/verdict'
import { motion, AnimatePresence } from 'framer-motion'

interface VerdictBadgeProps {
  verdict: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, className = '', size = 'md' }) => {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  const v = mapRawVerdict(verdict)
  const meta = VERDICT_METADATA[v] || VERDICT_METADATA[Verdict.FAILED]

  // If it's a custom verdict like "Testing on test 5", we might want to show it as is
  // but use the TESTING color.
  const isTesting = v === Verdict.TESTING || (verdict && verdict.toUpperCase().includes('TESTING'))
  const displayLabel = isTesting ? (verdict || 'Testing') : v

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-4 py-1.5 text-lg md:text-xl'
  }

  return (
    <div className="relative inline-block">
      <span 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`cursor-help inline-flex items-center rounded-full font-bold font-mono border transition-all hover:scale-105 ${meta.bg} ${meta.color} ${meta.border} ${sizeClasses[size]} ${className}`}
      >
        {displayLabel}
      </span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-[10px] rounded-lg shadow-xl border border-white/10 w-48 text-center pointer-events-none"
          >
            <div className="font-bold mb-0.5">{isTesting ? 'Testing' : `${v}: ${meta.label}`}</div>
            <div className="text-white/70 leading-tight">{meta.description}</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r border-b border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
