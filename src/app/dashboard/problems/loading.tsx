import { Skeleton } from "@/components/ui/Skeleton"

export default function ProblemsLoading() {
  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-10">
        {/* Header Skeleton */}
        <header className="flex items-end justify-between">
          <div>
            <Skeleton className="h-9 w-64 rounded-lg mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-7 w-24 rounded-lg" />
        </header>

        {/* Sections Skeletons */}
        {[1, 2].map((section) => (
          <section key={section}>
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="w-1.5 h-5 rounded-full" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item}
                  className="h-[180px] bg-white/[0.02] border-none rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex items-end justify-between mt-auto gap-2">
                    <div className="flex gap-1.5">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-9 w-20 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
