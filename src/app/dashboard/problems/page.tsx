import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProblemsClient, Problem } from './ProblemsClient'

export const dynamic = 'force-dynamic'

export default async function DashboardProblemsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: problemsData, error: fetchError } = await supabase
    .from('problems')
    .select('id, title, difficulty, requirements')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (fetchError) {
    console.error('[Problems Catalog] Fetch error:', fetchError)
  }

  const problemList = (problemsData as unknown as Problem[]) || []
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

  return <ProblemsClient problems={problemList} />
}

