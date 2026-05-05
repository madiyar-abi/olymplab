import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContributionGraph } from '@/components/ContributionGraph'
import { calculateStreak } from '@/lib/analytics/streaks'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real statistics: total solved problems (Accepted)
  const { count: solvedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('verdict', ['Accepted', 'AC'])

  // Fetch real contribution data for the heatmap
  const { data: contributionsData } = await supabase
    .from('submissions')
    .select('created_at')
    .eq('user_id', user.id)
    .in('verdict', ['Accepted', 'AC'])

  const contributionsMap = new Map<string, number>()
  ;(contributionsData as { created_at: string }[] | null)?.forEach(sub => {
    const date = new Date(sub.created_at).toISOString().split('T')[0]
    contributionsMap.set(date, (contributionsMap.get(date) || 0) + 1)
  })

  const realContributions = Array.from(contributionsMap.entries()).map(([date, count]) => ({
    date,
    count
  }))

  const streakCount = calculateStreak((contributionsData as { created_at: string }[])?.map(c => c.created_at) || [])

  // Fetch username from profiles table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const profile = profileData as { 
    username: string; 
  } | null
  const username = profile?.username || user?.email?.split('@')[0] || 'User'
  const initial = username.charAt(0).toUpperCase()

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
          Profile & Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Your personal statistics and activity.
        </p>
      </header>

      {/* Profile Header Card */}
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
        <div className="h-24 w-24 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground font-semibold text-4xl shrink-0 shadow-sm">
          {initial}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{username}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
          <div className="pt-2">
            <span className="inline-flex items-center rounded border border-white/5 bg-gray-50 dark:bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status: Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 pt-4">
        Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solved Problems</p>
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{solvedCount || 0}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Streak</p>
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.662 15 9.986c4.5.344 6.88 5.437 2.657 8.671z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{streakCount}</p>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Joined</p>
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Contribution Heatmap */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 pt-4">
        Activity
      </h3>
      <div className="rounded-xl border border-border bg-card p-6 transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
        <ContributionGraph data={realContributions} />
      </div>
      </div>
    </div>
  )
}
