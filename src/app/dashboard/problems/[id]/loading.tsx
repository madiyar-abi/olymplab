import { Loader2 } from 'lucide-react'
import { Skeleton } from "@/components/ui/Skeleton"

export default function IDELoading() {
  return (
    <div className="w-full h-full flex overflow-hidden bg-background">
      {/* Sidebar Skeleton (Problem Info) */}
      <div className="w-1/3 border-r border-border h-full flex flex-col bg-background">
        {/* Tab Header */}
        <div className="h-10 flex border-b border-border bg-white/[0.02] items-center px-4 gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20 opacity-50" />
        </div>
        {/* Content */}
        <div className="p-6 flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <div className="space-y-3 mt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="mt-8 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Editor Skeleton */}
      <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
        {/* Toolbar */}
        <div className="h-10 border-b border-white/5 bg-[#2d2d2d] flex justify-between items-center px-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 bg-white/10" />
            <Skeleton className="h-6 w-24 bg-white/20" />
          </div>
        </div>
        {/* Code Area */}
        <div className="flex-1 relative flex items-center justify-center p-8">
          <div className="absolute inset-0 flex flex-col gap-2 p-6 opacity-20">
            <Skeleton className="h-4 w-1/3 bg-white/30" />
            <Skeleton className="h-4 w-1/4 bg-white/30" />
            <Skeleton className="h-4 w-1/2 bg-white/30 ml-4" />
            <Skeleton className="h-4 w-2/5 bg-white/30 ml-8" />
            <Skeleton className="h-4 w-1/4 bg-white/30 ml-8" />
            <Skeleton className="h-4 w-1/5 bg-white/30 ml-4" />
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
