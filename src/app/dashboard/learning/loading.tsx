import { Skeleton } from "@/components/ui/Skeleton"

export default function LearningLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      {/* Header Skeleton */}
      <div className="border-b border-border px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>

      {/* Roadmap timeline Skeleton */}
      <div className="max-w-3xl mx-auto px-8 py-8 pb-24">
        {[1, 2].map((stage) => (
          <div key={stage} className="mb-10">
            {/* Stage header Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <div className="flex-1 h-px bg-white/5" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Topics timeline Skeleton */}
            <div className="relative pl-7 border-l border-white/5 ml-[5px]">
              {[1, 2].map((topic) => (
                <div key={topic} className="relative mb-3">
                  {/* Dot */}
                  <div className="absolute -left-[22px] top-[24px] w-3 h-3 rounded-full bg-white/10 animate-pulse" />
                  
                  {/* Card Skeleton */}
                  <div className="rounded-xl bg-white/[0.02] border-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-5 w-48" />
                        </div>
                        <div className="flex gap-1.5">
                          <Skeleton className="h-5 w-24 rounded-full" />
                          <Skeleton className="h-5 w-32 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Skeleton className="h-9 w-24 rounded-lg" />
                      <Skeleton className="h-9 w-28 rounded-lg" />
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
