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
    settings: { sound_enabled: boolean } | null;
  } | null

  let initialCode = profile?.code_template || undefined

  // If viewing a specific submission, fetch that code instead
  if (submissionId) {
    const { data: subData } = await supabase
      .from('submissions')
      .select('code')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single()
    
    const subCode = (subData as { code: string } | null)?.code
    if (subCode) {
      initialCode = subCode
    }
  }

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <IDEClient 
        problem={problem as unknown as Problem} 
        initialCode={initialCode}
        settings={profile?.settings || { sound_enabled: true }}
      />
    </div>
  )
}
