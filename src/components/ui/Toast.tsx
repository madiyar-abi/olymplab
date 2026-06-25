'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

type ToastInput = Omit<ToastItem, 'id' | 'variant' | 'duration'> & {
  variant?: ToastVariant
  duration?: number
}

// ── Module-level pub/sub store so toasts can be fired from anywhere ──────────
let counter = 0
const listeners = new Set<() => void>()
let toasts: ToastItem[] = []
const EMPTY: ToastItem[] = []

function emit() {
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot() {
  return toasts
}

function push(input: ToastInput) {
  const item: ToastItem = {
    id: ++counter,
    title: input.title,
    description: input.description,
    variant: input.variant ?? 'info',
    duration: input.duration ?? 4500,
  }
  toasts = [...toasts, item]
  emit()
  return item.id
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Fire a toast from any client component: `toast.success('Saved')`. */
export const toast = Object.assign(
  (input: ToastInput) => push(input),
  {
    success: (title: string, description?: string) => push({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => push({ title, description, variant: 'error', duration: 6000 }),
    info: (title: string, description?: string) => push({ title, description, variant: 'info' }),
    warning: (title: string, description?: string) => push({ title, description, variant: 'warning' }),
    dismiss,
  },
)

const VARIANT_CONFIG: Record<ToastVariant, { icon: typeof CheckCircle2; accent: string; iconColor: string }> = {
  success: { icon: CheckCircle2, accent: 'before:bg-emerald-500', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, accent: 'before:bg-red-500', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, accent: 'before:bg-amber-500', iconColor: 'text-amber-500' },
  info: { icon: Info, accent: 'before:bg-cyan-500', iconColor: 'text-cyan-500' },
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const cfg = VARIANT_CONFIG[item.variant]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(onClose, item.duration)
    return () => clearTimeout(t)
  }, [item.duration, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn(
        'pointer-events-auto relative w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border',
        'bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/30',
        'pl-4 pr-3 py-3 flex items-start gap-3',
        // left accent bar
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1',
        cfg.accent,
      )}
      role="status"
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">{item.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors rounded-md p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

/** Mount once near the root. Renders the live toast stack. */
export function Toaster() {
  // useSyncExternalStore subscribes to the module store without a setState-in-effect.
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2.5 pointer-events-none">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
