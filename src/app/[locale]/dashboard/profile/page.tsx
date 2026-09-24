import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { ContributionGraph } from '@/components/ContributionGraph'
import { calculateStreak } from '@/lib/analytics/streaks'
import VerdictAnalytics from '@/components/Profile/VerdictAnalytics'
import SkillRadar from '@/components/Profile/SkillRadar'
import { ProfileHeaderEditor } from '@/components/Profile/ProfileHeaderEditor'
import { mapRawVerdict, Verdict } from '@/types/verdict'
import { VerdictStat } from '@/lib/verdictInsights'
import type { SkillAxes } from '@/types/database'

export const dynamic = 'force-dynamic'

type ProfileRecord = { 
  username: string; 
  solved_count?: number;
  level?: number;
  skills?: Partial<Record<SkillAxes, number>>;
  cf_handle?: string | null;
  cf_rating?: number | null;
  cf_rank?: string | null;
  cf_max_rating?: number | null;
  cf_avatar?: string | null;
  cf_last_synced_at?: string | null;
  avatar_url?: string | null;
  cf_submissions_data?: {
    total?: number;
    solvedCount?: number;
    verdicts?: Record<string, number>;
    activity?: { date: string; count: number }[];
  } | null;
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('Profile')
  const format = await getFormatter()

  // 1. Fetch username, stats, skills, and cf data from profiles table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username, solved_count, level, skills, cf_handle, cf_rating, cf_rank, cf_max_rating, cf_avatar, cf_last_synced_at, avatar_url, cf_submissions_data')
    .eq('id', user.id)
    .single()

  let profile: ProfileRecord | null = profileData as ProfileRecord | null

  if (!profile) {
    const metaUsername = (user.user_metadata?.username as string) || (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'User'
    const metaAvatar = (user.user_metadata?.avatar_url as string) || null
    const metaCfHandle = (user.user_metadata?.cf_handle as string) || null
    const { data: newRow } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: metaUsername,
        avatar_url: metaAvatar,
        cf_handle: metaCfHandle,
        level: 1,
        solved_count: 0,
        skills: {},
        primary_subject: 'C++ Programming',
        experience_level: 'Intermediate',
      } as never)
      .select('username, solved_count, level, skills, cf_handle, cf_rating, cf_rank, cf_max_rating, cf_avatar, cf_last_synced_at, avatar_url, cf_submissions_data')
      .single()
    if (newRow) {
      profile = newRow as unknown as ProfileRecord
    }
  }

  const cfData = profile?.cf_submissions_data
  const username = profile?.username || user?.email?.split('@')[0] || 'User'
  const solvedCount = profile?.solved_count || cfData?.solvedCount || 0
  const skills = profile?.skills || {}
  const cfHandle = profile?.cf_handle

  // 2. Fetch verdict stats using RPC
  const { data: verdictStatsRaw } = await supabase.rpc(
    'get_user_verdict_stats' as never,
    { p_user_id: user.id } as never,
  )
  
  // Map raw verdicts to standardized Verdict enum and group them
  const statsMap = new Map<Verdict, { verdict: Verdict; count: number }>()
  let totalSubmissions = 0
  
  const rawStats = (verdictStatsRaw || []) as { verdict: string; count: number }[]
  
  rawStats.forEach(row => {
    const v = mapRawVerdict(row.verdict)
    const existing = statsMap.get(v) || { verdict: v, count: 0 }
    const count = Number(row.count)
    existing.count += count
    totalSubmissions += count
    statsMap.set(v, existing)
  })

  // Merge Codeforces verdicts if synced
  if (cfData?.verdicts) {
    const cfVerdictsMap: Record<string, Verdict> = {
      AC: Verdict.AC,
      WA: Verdict.WA,
      TLE: Verdict.TLE,
      MLE: Verdict.MLE,
      RE: Verdict.RE,
      CE: Verdict.CE,
    }
    for (const [key, vEnum] of Object.entries(cfVerdictsMap)) {
      const count = cfData.verdicts[key] || 0
      if (count > 0) {
        const existing = statsMap.get(vEnum) || { verdict: vEnum, count: 0 }
        existing.count += count
        totalSubmissions += count
        statsMap.set(vEnum, existing)
      }
    }
  }
  
  const stats: VerdictStat[] = Array.from(statsMap.values()).map(s => ({
    ...s,
    percentage: totalSubmissions > 0 ? (s.count / totalSubmissions) * 100 : 0
  }))

  // 3. Fetch real contribution data for the heatmap (unique problems solved per day)
  const { data: contributionsData } = await supabase
    .from('submissions')
    .select('problem_id, created_at, cf_submission_id, problems ( external_id )')
    .eq('user_id', user.id)
    .in('verdict', ['Accepted', 'AC', 'OK', 'CORRECT'])

  const dailyProblemsMap = new Map<string, Set<string>>()

  ;(contributionsData as { problem_id: string; created_at: string; problems?: { external_id?: string | null } | null }[] | null)?.forEach(sub => {
    const date = new Date(sub.created_at).toISOString().split('T')[0]
    if (!dailyProblemsMap.has(date)) {
      dailyProblemsMap.set(date, new Set())
    }
    // Canonical problem identifier (lowercase cf-contest/index or problem_id)
    const probKey = sub.problems?.external_id 
      ? sub.problems.external_id.toLowerCase().replace('-', '/').replace('cf/', 'cf-')
      : sub.problem_id
    dailyProblemsMap.get(date)!.add(probKey)
  })

  // Merge Codeforces activity dates
  if (cfData?.activity && Array.isArray(cfData.activity)) {
    cfData.activity.forEach((item: { date: string; count: number; problems?: string[] }) => {
      if (!dailyProblemsMap.has(item.date)) {
        dailyProblemsMap.set(item.date, new Set())
      }
      const set = dailyProblemsMap.get(item.date)!
      if (Array.isArray(item.problems) && item.problems.length > 0) {
        item.problems.forEach(pKey => set.add(pKey.toLowerCase()))
      } else {
        // Fallback for legacy cached CF data without problems array:
        // Use Math.max to prevent double-counting local submissions that were synced to CF
        if (set.size === 0) {
          for (let i = 0; i < item.count; i++) {
            set.add(`cf-legacy-${item.date}-${i}`)
          }
        } else if (item.count > set.size) {
          const diff = item.count - set.size
          for (let i = 0; i < diff; i++) {
            set.add(`cf-legacy-${item.date}-${set.size + i}`)
          }
        }
      }
    })
  }

  const realContributions = Array.from(dailyProblemsMap.entries()).map(([date, set]) => ({
    date,
    count: set.size
  }))

  const allActivityDates = Array.from(dailyProblemsMap.keys()).filter(d => (dailyProblemsMap.get(d)?.size || 0) > 0)
  const streakCount = calculateStreak(allActivityDates)

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('subtitle')}
        </p>
      </header>

      {/* Interactive Profile Header & Avatar Editor */}
      <ProfileHeaderEditor
        key={`${user.id}-${username}-${profile?.avatar_url || ''}-${cfHandle || ''}-${profile?.cf_rating || ''}-${profile?.cf_avatar || ''}`}
        userId={user.id}
        initialUsername={username}
        initialAvatarUrl={profile?.avatar_url}
        cfHandle={cfHandle}
        cfRating={profile?.cf_rating}
        cfRank={profile?.cf_rank}
        cfAvatar={profile?.cf_avatar}
        email={user.email || ''}
        level={profile?.level || 1}
      />

      {/* Stats Grid */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 pt-4">
        {t('statistics')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('solvedProblems')}</p>
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
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('currentStreak')}</p>
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.662 15 9.986c4.5.344 6.88 5.437 2.657 8.671z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{streakCount}</p>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('days')}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('accountJoined')}</p>
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-neutral-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {format.dateTime(new Date(user.created_at), { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* 9-Axis Algorithmic Skill Profile */}
      <SkillRadar skills={skills} />

      {/* Contribution Heatmap */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 pt-4">
        {t('activity')}
      </h3>
      <div className="rounded-xl border border-border bg-card p-6 transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
        <ContributionGraph data={realContributions} />
      </div>

      {/* Verdict Analytics & Insights */}
      <VerdictAnalytics stats={stats} />
      </div>
    </div>
  )
}
