import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProblemsClient, Problem } from './ProblemsClient'
import { cookies } from 'next/headers'

import { EmptyState } from '@/components/ui/EmptyState'
import { Database } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardProblemsPage() {
  const t = await getTranslations('Problems')
  const supabase = await createClient()
  const cookieStore = await cookies()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch problems directly using indexed columns: tags and rating
  const { data: problemsData, error: fetchError } = await supabase
    .from('problems')
    .select('id, title, title_ru, difficulty, rating, requirements, tags')
    .order('created_at', { ascending: false })
    .limit(1200)

  // Fetch user settings, solved problems, revealed spoilers, and bookmarks in parallel
  const [profileResult, solvedResult, revealedResult, bookmarksResult] = await Promise.all([
    supabase.from('profiles').select('settings, hide_unsolved_tags, problems_view').eq('id', user.id).single(),
    supabase.from('submissions').select('problem_id').eq('user_id', user.id).in('verdict', ['Accepted', 'AC', 'OK', 'CORRECT']),
    supabase.from('revealed_problems').select('problem_id').eq('user_id', user.id),
    supabase.from('user_bookmarks').select('problem_id').eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const cookieSpoiler = cookieStore.get('hide-unsolved-tags')?.value
  const hideUnsolvedTags = cookieSpoiler !== undefined
    ? cookieSpoiler === 'true'
    : (profile?.hide_unsolved_tags ?? (profile?.settings as { hide_unsolved_tags?: boolean } | null)?.hide_unsolved_tags ?? true)
  const initialView = (profile?.problems_view as 'grid' | 'table') || (cookieStore.get('problems-view')?.value as 'grid' | 'table') || 'grid'
  const settings = {
    sound_enabled: (profile?.settings as { sound_enabled?: boolean } | null)?.sound_enabled ?? true,
    hide_unsolved_tags: hideUnsolvedTags
  }
  
  const solvedProblemIds = new Set<string>((solvedResult.data || []).map(s => s.problem_id))
  const revealedProblemIds = new Set<string>((revealedResult.data || []).map(r => r.problem_id))
  const bookmarkedProblemIds = new Set<string>((bookmarksResult.data || []).map(b => b.problem_id))

  if (fetchError) {
    console.error('[Problems Catalog] Fetch error:', fetchError)
  }

  const problemList: Problem[] = (problemsData || []).map(p => ({
    id: p.id,
    title: p.title,
    title_ru: p.title_ru,
    difficulty: p.difficulty,
    rating: p.rating,
    requirements: p.requirements,
    tags: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags : []
  }))

  if (problemList.length === 0) {
    return (
      <EmptyState
        title={t('emptyRepoTitle')}
        description={t('emptyRepoDesc')}
        icon={Database}
        ctaText={t('refresh')}
        ctaHref="/dashboard/problems"
      />
    )
  }

  return (
    <ProblemsClient 
      problems={problemList} 
      solvedProblemIds={solvedProblemIds}
      revealedProblemIds={revealedProblemIds}
      initialBookmarkedIds={bookmarkedProblemIds}
      settings={settings}
      userId={user.id}
      initialView={initialView}
    />
  )
}
