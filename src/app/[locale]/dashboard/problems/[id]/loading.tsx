import { Loader2 } from 'lucide-react'
import { Skeleton } from "@/components/ui/Skeleton"

export default function IDELoading() {
  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background z-10">
      {/* Left Panel — Problem Description Skeleton */}
      <div className="w-[38%] min-w-[280px] border-r border-border h-full flex flex-col bg-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-2/3 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
        {/* Description Lines */}
        <div className="p-6 flex-1 space-y-4 overflow-hidden">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/6" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-5 w-28 mb-2" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-1.5 bg-white/5 shrink-0" />

      {/* Right Panel — Editor + Console Skeleton */}
      <div className="flex-1 flex flex-col h-full bg-[#0B0D12] overflow-hidden">
        {/* Toolbar */}
        <div className="shrink-0 h-14 border-b border-white/5 bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-24 bg-white/10" />
            <Skeleton className="h-7 w-20 bg-white/10" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-8 bg-white/10" />
            <Skeleton className="h-7 w-8 bg-white/10" />
            <Skeleton className="h-7 w-24 bg-white/10" />
            <Skeleton className="h-7 w-20 bg-white/10" />
            <Skeleton className="h-7 w-24 bg-primary/40" />
          </div>
        </div>

        {/* Editor area (60%) */}
        <div className="h-[60%] bg-[#1e1e1e] relative min-h-0 flex flex-col">
          {/* Editor Header (File tabs) */}
          <div className="h-10 bg-[#1e1e1e] border-b border-white/5 flex items-center px-2">
            <Skeleton className="h-6 w-24 bg-white/10 rounded-md" />
          </div>
          {/* Editor Content */}
          <div className="flex-1 p-6 flex flex-col gap-3 relative">
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            <Skeleton className="h-4 w-1/4 bg-white/10" />
            <Skeleton className="h-4 w-1/2 bg-white/10 ml-8" />
            <Skeleton className="h-4 w-2/5 bg-white/10 ml-8" />
            <Skeleton className="h-4 w-1/5 bg-white/10 ml-8" />
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/60 backdrop-blur-[1px] z-10 gap-4">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-500/80">Initializing Workspace</span>
            </div>
          </div>
        </div>

        {/* Resizer hint */}
        <div className="h-1.5 bg-[#1e1e1e] shrink-0 border-y border-white/5" />

        {/* Console area (40%) */}
        <div className="flex-1 flex flex-col min-h-0 bg-card">
          {/* Tabs */}
          <div className="flex items-center border-b border-border shrink-0 px-2 gap-1 h-11">
            {['Test Cases', 'Test Results', 'Current', 'My Submissions', 'Mentor'].map((tab, i) => (
              <div key={tab} className={`px-4 py-2 text-xs font-semibold font-mono whitespace-nowrap ${i === 0 ? 'border-b-2 border-cyan-500 text-cyan-500' : 'text-muted-foreground/40'}`}>
                {tab}
              </div>
            ))}
          </div>
          {/* Console content */}
          <div className="flex-1 p-4 flex flex-col gap-3">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/5" />
            <Skeleton className="h-12 w-full rounded-lg bg-white/5" />
            <Skeleton className="h-12 w-full rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
