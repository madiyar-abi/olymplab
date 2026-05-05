import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProblemsClient, Problem } from './ProblemsClient'

export const dynamic = 'force-dynamic'

export default async function DashboardProblemsPage() {
  const supabase = await createClient()

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
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 text-muted-foreground shadow-[0_0_20px_rgba(39,39,42,0.1)] dark:shadow-[0_0_20px_rgba(39,39,42,0.5)]">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 font-mono">No Problems Found</h2>
        <p className="text-muted-foreground max-w-md font-mono text-sm">
          Run the ingestion script to populate the database.
        </p>
      </div>
    )
  }

  return <ProblemsClient 
    problems={problemList} 
    solvedProblemIds={solvedProblemIds}
    settings={settings}
  />
}

