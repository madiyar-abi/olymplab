export default function LearningLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      {/* Header Skeleton */}
      <div className="border-b border-border px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
            <div className="h-7 w-48 bg-muted/50 rounded-lg animate-pulse" />
          </div>
          <div className="h-4 w-72 bg-muted/30 rounded-md animate-pulse mt-2" />
        </div>
      </div>

      {/* Roadmap timeline Skeleton */}
      <div className="max-w-3xl mx-auto px-8 py-8 pb-24">
        {[1, 2].map((stage) => (
          <div key={stage} className="mb-10">
            {/* Stage header Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-8 w-32 bg-muted/40 rounded-lg animate-pulse" />
              <div className="flex-1 h-px bg-border" />
              <div className="h-4 w-16 bg-muted/20 rounded-md animate-pulse" />
            </div>

            {/* Topics timeline Skeleton */}
            <div className="relative pl-7 border-l border-muted/30 ml-[5px]">
              {[1, 2].map((topic) => (
                <div key={topic} className="relative mb-3">
                  {/* Dot */}
                  <div className="absolute -left-[22px] top-[24px] w-3 h-3 rounded-full bg-muted animate-pulse border-2 border-background" />
                  
                  {/* Card Skeleton */}
                  <div className="rounded-xl bg-card border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 bg-muted/40 rounded-xl animate-pulse shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 w-5 bg-muted/30 rounded-md animate-pulse" />
                          <div className="h-5 w-48 bg-muted/50 rounded-md animate-pulse" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-5 w-24 bg-muted/20 rounded-full animate-pulse" />
                          <div className="h-5 w-32 bg-muted/20 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <div className="h-9 w-24 bg-muted/40 rounded-lg animate-pulse" />
                      <div className="h-9 w-28 bg-muted/40 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
