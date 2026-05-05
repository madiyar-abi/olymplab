import { Skeleton } from "@/components/ui/Skeleton"

export default function ProfileLoading() {
  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <Skeleton className="h-9 w-64 rounded-lg mb-3" />
          <Skeleton className="h-5 w-48" />
        </header>

        {/* Profile Header Card Skeleton */}
        <div className="rounded-xl border-none bg-white/[0.02] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <Skeleton className="h-32 w-32 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col items-center md:items-start space-y-3 w-full">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-5 w-64" />
            <div className="pt-2">
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <Skeleton className="h-6 w-32 pt-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-none bg-white/[0.02] p-6 flex flex-col justify-between h-36">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Contribution Heatmap Skeleton */}
        <Skeleton className="h-6 w-32 pt-4" />
        <div className="rounded-xl border-none bg-white/[0.02] p-6 shadow-sm h-64 flex items-center justify-center">
          <Skeleton className="w-full h-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
