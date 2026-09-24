import { Sidebar } from './Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// The whole dashboard is auth-gated and reads request-time cookies/user, so it
// must never be statically prerendered at build (doing so would try to create a
// Supabase client without request context / env). Forcing dynamic here applies
// to every route nested under this layout.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile: {
    username: string
    primary_subject?: string
    experience_level?: string
    level?: number
    avatar_url?: string | null
    cf_avatar?: string | null
  } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, primary_subject, experience_level, level, avatar_url, cf_avatar')
      .eq('id', user.id)
      .single()
    profile = data as {
      username: string
      primary_subject?: string
      experience_level?: string
      level?: number
      avatar_url?: string | null
      cf_avatar?: string | null
    } | null
  }

  // Enforce Onboarding
  if (profile && (!profile.primary_subject || !profile.experience_level)) {
    redirect('/onboarding')
  }
  
  const username = profile?.username || user?.email?.split('@')[0] || 'User'
  const level = profile?.level || 1
  const avatarUrl = profile?.avatar_url || profile?.cf_avatar || null

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar - hidden on very small screens, visible on md+ */}
      <div className="hidden md:flex h-full animate-in fade-in slide-in-from-left duration-700 ease-out">
        <Sidebar username={username} email={user?.email || ''} level={level} avatarUrl={avatarUrl} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>
    </div>
  )
}
