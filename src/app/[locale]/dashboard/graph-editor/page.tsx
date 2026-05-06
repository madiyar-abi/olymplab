import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GraphEditorClient from './GraphEditorClient'

export const metadata = {
  title: 'Graph Editor | OlympLab',
  description: 'Interactive graph and data structure visualization tool.',
}

export default async function GraphEditorPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <GraphEditorClient />
}
