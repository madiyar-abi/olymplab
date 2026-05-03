export default function ProblemsLoading() {
  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-10">
        {/* Header Skeleton */}
        <header className="flex items-end justify-between">
          <div>
            <div className="h-9 w-64 bg-muted/50 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted/30 rounded-md animate-pulse" />
          </div>
          <div className="h-7 w-24 bg-muted/40 rounded-lg animate-pulse" />
        </header>

        {/* Sections Skeletons */}
        {[1, 2].map((section) => (
          <section key={section}>
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-muted rounded-full animate-pulse" />
                <div className="h-6 w-40 bg-muted/50 rounded-md animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-muted/30 rounded-md animate-pulse" />
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item}
                  className="h-[180px] bg-card border border-border rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="h-5 w-3/4 bg-muted/50 rounded-md animate-pulse" />
                    <div className="h-6 w-16 bg-muted/40 rounded-md animate-pulse" />
                  </div>
                  <div className="flex items-end justify-between mt-auto gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-6 w-12 bg-muted/30 rounded-md animate-pulse" />
                      <div className="h-6 w-16 bg-muted/30 rounded-md animate-pulse" />
                    </div>
                    <div className="h-9 w-20 bg-muted/40 rounded-xl animate-pulse" />
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
