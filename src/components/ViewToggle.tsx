"use client"

import { motion } from 'framer-motion'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'table'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary/50 backdrop-blur-md border border-border p-1 rounded-xl shadow-sm">
      <button
        onClick={() => onChange('grid')}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors z-10",
          view === 'grid' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Grid View"
      >
        <LayoutGrid className="w-4 h-4" />
        {view === 'grid' && (
          <motion.div
            layoutId="view-toggle-pill"
            className="absolute inset-0 bg-background border border-border shadow-sm rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <button
        onClick={() => onChange('table')}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors z-10",
          view === 'table' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Table View"
      >
        <List className="w-4 h-4" />
        {view === 'table' && (
          <motion.div
            layoutId="view-toggle-pill"
            className="absolute inset-0 bg-background border border-border shadow-sm rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    </div>
  )
}
