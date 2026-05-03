import { Loader2 } from 'lucide-react'

export default function IDELoading() {
  return (
    <div className="w-full h-full flex overflow-hidden bg-background">
      {/* Sidebar Skeleton (Problem Info) */}
      <div className="w-1/3 border-r border-border h-full flex flex-col bg-card">
        {/* Tab Header */}
        <div className="h-10 flex border-b border-border bg-muted/20 items-center px-4 gap-2">
          <div className="h-4 w-20 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/20 rounded animate-pulse" />
        </div>
        {/* Content */}
        <div className="p-6 flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div className="h-8 w-3/4 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-6 w-16 bg-muted/30 rounded-md animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-muted/20 rounded-md animate-pulse" />
            <div className="h-5 w-20 bg-muted/20 rounded-md animate-pulse" />
          </div>
          <div className="space-y-3 mt-8">
            <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
            <div className="h-24 w-full bg-muted/20 border border-muted/30 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Editor Skeleton */}
      <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
        {/* Toolbar */}
        <div className="h-10 border-b border-white/5 bg-[#2d2d2d] flex justify-between items-center px-4">
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-24 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        {/* Code Area */}
        <div className="flex-1 relative flex items-center justify-center p-8">
          <div className="absolute inset-0 flex flex-col gap-2 p-6 opacity-20">
            <div className="h-4 w-1/3 bg-white/30 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-white/30 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/30 rounded animate-pulse ml-4" />
            <div className="h-4 w-2/5 bg-white/30 rounded animate-pulse ml-8" />
            <div className="h-4 w-1/4 bg-white/30 rounded animate-pulse ml-8" />
            <div className="h-4 w-1/5 bg-white/30 rounded animate-pulse ml-4" />
          </div>
          
          <div className="flex flex-col items-center gap-3 text-white/30 z-10">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-mono tracking-widest uppercase">Initializing Environment</span>
          </div>
        </div>
      </div>
    </div>
  )
}
