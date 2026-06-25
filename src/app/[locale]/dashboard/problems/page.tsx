import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProblemsClient, Problem } from './ProblemsClient'
import { cookies } from 'next/headers'

import { EmptyState } from '@/components/ui/EmptyState'
import { Database } from 'lucide-react'

export const dynamic = 'force-dynamic'

type ProblemRow = {
  id: string
  title: string
  difficulty: string
  requirements: Problem['requirements']
  topic_problems: { tags: string[] | null }[] | null
}

export default async function DashboardProblemsPage() {
  const t = await getTranslations('Problems')
  const supabase = await createClient()
  const cookieStore = await cookies()
  const initialView = (cookieStore.get('problems-view')?.value as 'grid' | 'table') || 'grid'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch problems
  const { data: problemsData, error: fetchError } = await supabase
    .from('problems')
    .select('id, title, difficulty, requirements, topic_problems(tags)')
    .order('created_at', { ascending: false })
    .limit(1000)

  // Fetch user settings, solved problems, and revealed problems
  const [profileResult, solvedResult, revealedResult] = await Promise.all([
    supabase.from('profiles').select('settings').eq('id', user.id).single(),
    supabase.from('submissions').select('problem_id').eq('user_id', user.id).in('verdict', ['Accepted', 'AC']) as unknown as Promise<{ data: { problem_id: string }[] | null }>,
    supabase.from('revealed_problems').select('problem_id').eq('user_id', user.id) as unknown as Promise<{ data: { problem_id: string }[] | null }>
  ])

  const profile = profileResult.data as { settings: { sound_enabled: boolean; hide_unsolved_tags?: boolean } } | null
  const settings = profile?.settings || { sound_enabled: true, hide_unsolved_tags: false }
  
  const solvedProblemIds = new Set<string>((solvedResult.data || []).map(s => s.problem_id))
  const revealedProblemIds = new Set<string>((revealedResult.data || []).map(r => r.problem_id))


  if (fetchError) {
    console.error('[Problems Catalog] Fetch error:', fetchError)
  }

  const problemList: Problem[] = ((problemsData as ProblemRow[] | null) || []).map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    requirements: p.requirements,
    tags: Array.from(new Set((p.topic_problems || []).flatMap(tp => tp.tags || [])))
  }))
  console.log('[Problems Catalog] Found', problemList.length, 'problems')

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

  return <ProblemsClient 
    problems={problemList} 
    solvedProblemIds={solvedProblemIds}
    revealedProblemIds={revealedProblemIds}
    settings={settings}
    userId={user.id}
    initialView={initialView}
  />
}
