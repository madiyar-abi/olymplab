export default function ArticleLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground relative">
      {/* Top Breadcrumb Nav */}
      <div className="sticky top-0 z-20 border-b border-border px-8 py-4 backdrop-blur-md bg-background/80">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-muted/40 rounded-md animate-pulse" />
            <div className="h-4 w-4 bg-muted/20 rounded-md" />
            <div className="h-4 w-32 bg-muted/30 rounded-md animate-pulse" />
          </div>
          <div className="h-6 w-32 bg-muted/20 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Badges */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-28 bg-muted/30 rounded-lg animate-pulse" />
            <div className="h-4 w-16 bg-muted/20 rounded-md animate-pulse" />
          </div>
          <div className="h-6 w-32 bg-muted/20 rounded-md animate-pulse" />
        </div>

        {/* Title */}
        <div className="h-10 w-3/4 bg-muted/50 rounded-lg animate-pulse mb-6" />
        
        <div className="flex gap-2 mb-8 mt-4">
          <div className="h-5 w-24 bg-muted/20 rounded-md animate-pulse" />
          <div className="h-5 w-16 bg-muted/20 rounded-md animate-pulse" />
        </div>

        <div className="border-t border-border mt-6 mb-8" />

        {/* Paragraphs */}
        <div className="space-y-4 mb-10">
          <div className="h-4 w-full bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-11/12 bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-muted/30 rounded-md animate-pulse" />
        </div>

        <div className="h-6 w-1/3 bg-muted/40 rounded-lg animate-pulse mb-4" />
        <div className="space-y-4 mb-10">
          <div className="h-4 w-full bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-full bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-4/6 bg-muted/30 rounded-md animate-pulse" />
        </div>

        {/* Code block skeleton */}
        <div className="h-48 w-full bg-muted/10 border border-border/50 rounded-xl animate-pulse mb-10" />

        <div className="space-y-4">
          <div className="h-4 w-11/12 bg-muted/30 rounded-md animate-pulse" />
          <div className="h-4 w-3/4 bg-muted/30 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  )
}
