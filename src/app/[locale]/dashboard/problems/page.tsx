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
  const initialView = (cookieStore.get('problems-view')?.value as 'grid' | 'table') || 'grid'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch problems directly using indexed columns: tags and rating
  const { data: problemsData, error: fetchError } = await supabase
    .from('problems')
    .select('id, title, difficulty, rating, requirements, tags')
    .order('created_at', { ascending: false })
    .limit(1200)

  // Fetch user settings, solved problems, revealed spoilers, and bookmarks in parallel
  const [profileResult, solvedResult, revealedResult, bookmarksResult] = await Promise.all([
    supabase.from('profiles').select('settings').eq('id', user.id).single(),
    supabase.from('submissions').select('problem_id').eq('user_id', user.id).in('verdict', ['Accepted', 'AC', 'OK', 'CORRECT']),
    supabase.from('revealed_problems').select('problem_id').eq('user_id', user.id),
    supabase.from('user_bookmarks').select('problem_id').eq('user_id', user.id),
  ])

  const profile = profileResult.data as { settings: { sound_enabled: boolean; hide_unsolved_tags?: boolean } } | null
  const settings = profile?.settings || { sound_enabled: true, hide_unsolved_tags: false }
  
  const solvedProblemIds = new Set<string>((solvedResult.data || []).map(s => s.problem_id))
  const revealedProblemIds = new Set<string>((revealedResult.data || []).map(r => r.problem_id))
  const bookmarkedProblemIds = new Set<string>((bookmarksResult.data || []).map(b => b.problem_id))

  if (fetchError) {
    console.error('[Problems Catalog] Fetch error:', fetchError)
  }

  const problemList: Problem[] = (problemsData || []).map(p => ({
    id: p.id,
    title: p.title,
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
