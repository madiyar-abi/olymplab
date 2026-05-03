export default function ProfileLoading() {
  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <div className="h-9 w-64 bg-muted/50 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-48 bg-muted/30 rounded-md animate-pulse" />
        </header>

        {/* Profile Header Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="h-32 w-32 rounded-xl bg-muted/40 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col items-center md:items-start space-y-3 w-full">
            <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-muted/30 rounded-md animate-pulse" />
            <div className="pt-2">
              <div className="h-6 w-32 bg-muted/20 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="h-6 w-32 bg-muted/30 rounded-md animate-pulse pt-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between h-36">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-muted/30 rounded-md animate-pulse" />
                <div className="h-8 w-8 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="h-10 w-20 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Contribution Heatmap Skeleton */}
        <div className="h-6 w-32 bg-muted/30 rounded-md animate-pulse pt-4" />
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-64 flex items-center justify-center">
          <div className="w-full h-40 bg-muted/20 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
