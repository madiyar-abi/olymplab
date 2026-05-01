import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import IDEClient from './IDEClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProblemIDEPage({ params }: PageProps) {
  const { id } = await params
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

  return (
    <div className="w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#09090b]">
      <IDEClient problem={problem as any} />
    </div>
  )
}
