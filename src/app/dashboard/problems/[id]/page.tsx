import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import IDEClient, { Problem } from './IDEClient'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submissionId?: string }>
}

export default async function ProblemIDEPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { submissionId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: problem, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !problem) {
    notFound()
  }

  // Fetch user's code template and settings
  const { data: profileData } = await supabase
    .from('profiles')
    .select('code_template, settings')
    .eq('id', user.id)
    .single()

  const profile = profileData as { 
    code_template: string | null;
    settings: { sound_enabled: boolean; hide_unsolved_tags?: boolean } | null;
  } | null

  // Check if problem is already solved
  const { data: solvedData } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('problem_id', id)
    .in('verdict', ['Accepted', 'AC'])
    .limit(1)
  
  const isSolved = (solvedData?.length ?? 0) > 0

  let initialCode = profile?.code_template || undefined
  let initialLanguage: 'cpp' | 'python' | 'java' | 'rust' = 'cpp'

  // If viewing a specific submission, fetch that code instead
  if (submissionId) {
    const { data: subData } = await supabase
      .from('submissions')
      .select('code, language')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single() as unknown as { data: { code: string | null; language: string | null } | null }

    if (subData) {
      initialCode = subData.code || initialCode
      initialLanguage = (subData.language as 'cpp' | 'python' | 'java' | 'rust') || initialLanguage
    }
  } else {
    // Fetch latest submission for this problem to restore last code
    const { data: latestSub } = await supabase
      .from('submissions')
      .select('code, language')
      .eq('problem_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as { data: { code: string | null; language: string | null } | null }

    if (latestSub) {
      initialCode = latestSub.code || initialCode
      initialLanguage = (latestSub.language as 'cpp' | 'python' | 'java' | 'rust') || initialLanguage
    }
  }

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <IDEClient 
        problem={problem as unknown as Problem} 
        initialCode={initialCode}
        initialLanguage={initialLanguage}
        isSolved={isSolved}
        settings={profile?.settings || { sound_enabled: true }}
      />
    </div>
  )
}
