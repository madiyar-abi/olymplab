import { Skeleton } from "@/components/ui/Skeleton"

export default function ArticleLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground relative">
      {/* Top Breadcrumb Nav */}
      <div className="sticky top-0 z-20 border-b border-border px-8 py-4 backdrop-blur-md bg-background/80">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <div className="h-4 w-4 bg-white/5 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Badges */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Title */}
        <Skeleton className="h-10 w-3/4 rounded-lg mb-6" />
        
        <div className="flex gap-2 mb-8 mt-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="border-t border-border mt-6 mb-8" />

        {/* Paragraphs */}
        <div className="space-y-4 mb-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>

        <Skeleton className="h-6 w-1/3 rounded-lg mb-4" />
        <div className="space-y-4 mb-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Code block skeleton */}
        <Skeleton className="h-48 w-full rounded-xl mb-10" />

        <div className="space-y-4">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}
