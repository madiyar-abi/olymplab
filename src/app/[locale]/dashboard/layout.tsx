import { Sidebar } from './Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile: { username: string, primary_subject?: string, experience_level?: string } | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('username, primary_subject, experience_level').eq('id', user.id).single();
    profile = data as { username: string; primary_subject?: string; experience_level?: string } | null;
  }

  // Enforce Onboarding
  if (profile && (!profile.primary_subject || !profile.experience_level)) {
    redirect('/onboarding')
  }
  
  const username = profile?.username || user?.email?.split('@')[0] || 'User'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar - hidden on very small screens, visible on md+ */}
      <div className="hidden md:flex h-full animate-in fade-in slide-in-from-left duration-700 ease-out">
        <Sidebar username={username} email={user?.email || ''} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>
    </div>
  )
}
