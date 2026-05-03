'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StackQueueVisualizerProps {
  type?: 'stack' | 'queue'
}

export default function StackQueueVisualizer({ type = 'stack' }: StackQueueVisualizerProps) {
  const [items, setItems] = useState<number[]>([10, 20, 30])
  const [nextValue, setNextValue] = useState(40)

  const push = () => {
    setItems([...items, nextValue])
    setNextValue(v => v + 10)
  }

  const pop = () => {
    if (items.length === 0) return
    if (type === 'stack') {
      setItems(items.slice(0, -1))
    } else {
      setItems(items.slice(1))
    }
  }

  const reset = () => {
    setItems([10, 20, 30])
    setNextValue(40)
  }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: {type === 'stack' ? 'Стек (LIFO)' : 'Очередь (FIFO)'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {type === 'stack' 
              ? 'Last In, First Out — последний пришел, первый ушел' 
              : 'First In, First Out — первый пришел, первый ушел'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Сброс"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={pop}
            disabled={items.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
          >
            <Minus className="w-4 h-4" />
            {type === 'stack' ? 'Pop' : 'Dequeue'}
          </button>
          <button
            onClick={push}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white shadow-sm hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            {type === 'stack' ? 'Push' : 'Enqueue'}
          </button>
        </div>
      </div>

      <div className={cn(
        "flex min-h-[200px] border-2 border-dashed border-border/50 rounded-xl p-8 items-center justify-center",
        type === 'stack' ? "flex-col-reverse" : "flex-row"
      )}>
        <AnimatePresence mode="popLayout">
          {items.map((val, idx) => (
            <motion.div
              key={val}
              layout
              initial={{ opacity: 0, scale: 0.8, x: type === 'queue' ? 50 : 0, y: type === 'stack' ? -50 : 0 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                x: type === 'queue' ? -50 : 0, 
                y: type === 'stack' ? -50 : 0,
                transition: { duration: 0.2 } 
              }}
              className={cn(
                "w-16 h-16 flex items-center justify-center rounded-xl border-2 font-mono font-bold text-lg shadow-lg bg-background relative",
                idx === items.length - 1 && type === 'stack' ? "border-amber-500 text-amber-500 shadow-amber-500/20" : 
                idx === 0 && type === 'queue' ? "border-amber-500 text-amber-500 shadow-amber-500/20" : "border-primary/50 text-foreground"
              )}
            >
              {val}
              {(idx === items.length - 1 && type === 'stack') && (
                <div className="absolute -right-12 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">TOP</div>
              )}
              {(idx === 0 && type === 'queue') && (
                <div className="absolute -top-8 text-[10px] font-bold text-amber-500 uppercase tracking-tighter text-center w-full">FRONT</div>
              )}
              {(idx === items.length - 1 && type === 'queue') && (
                <div className="absolute -bottom-8 text-[10px] font-bold text-sky-500 uppercase tracking-tighter text-center w-full">REAR</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="text-muted-foreground font-mono text-sm italic opacity-50">Пусто...</div>
        )}
      </div>
    </div>
  )
}
