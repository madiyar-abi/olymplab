import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateStreak } from '@/lib/analytics/streaks'
import RandomizedExecutionClient from './RandomizedExecutionClient'

export default async function RandomProblemPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real contribution data for the streak
  const { data: contributionsData } = await supabase
    .from('submissions')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('verdict', 'Accepted')

  const streakCount = calculateStreak((contributionsData as { created_at: string }[])?.map(c => c.created_at) || [])

  return (
    <div className="min-h-full p-4 md:p-8">
      <RandomizedExecutionClient streakCount={streakCount} />
    </div>
  )
}
