import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProblemsClient, Problem } from './ProblemsClient'
import { cookies } from 'next/headers'

import { EmptyState } from '@/components/ui/EmptyState'
import { Database } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardProblemsPage() {
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

  // Fetch user settings and solved problems
  const [profileResult, solvedResult] = await Promise.all([
    supabase.from('profiles').select('settings').eq('id', user.id).single(),
    supabase.from('submissions').select('problem_id').eq('user_id', user.id).in('verdict', ['Accepted', 'AC']) as unknown as Promise<{ data: { problem_id: string }[] | null }>
  ])

  const profile = profileResult.data as { settings: { sound_enabled: boolean; hide_unsolved_tags?: boolean } } | null
  const settings = profile?.settings || { sound_enabled: true, hide_unsolved_tags: false }
  
  const solvedProblemIds = new Set<string>((solvedResult.data || []).map(s => s.problem_id))


  if (fetchError) {
    console.error('[Problems Catalog] Fetch error:', fetchError)
  }

  const problemList: Problem[] = (problemsData as any[] || []).map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    requirements: p.requirements,
    tags: Array.from(new Set((p.topic_problems || []).flatMap((tp: any) => tp.tags || [])))
  }))
  console.log('[Problems Catalog] Found', problemList.length, 'problems')

  if (problemList.length === 0) {
    return (
      <EmptyState 
        title="Репозиторий пуст"
        description="В базе данных пока нет задач. Инициализируйте каталог, запустив скрипты загрузки данных, или загляните позже."
        icon={Database}
        ctaText="Обновить страницу"
        ctaHref="/dashboard/problems"
      />
    )
  }

  return <ProblemsClient 
    problems={problemList} 
    solvedProblemIds={solvedProblemIds}
    settings={settings}
    userId={user.id}
    initialView={initialView}
  />
}
