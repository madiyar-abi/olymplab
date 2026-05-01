import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch username from profiles table
  let profile: { username: string } | null = null;
  const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  profile = data as { username: string } | null;

  const username = profile?.username || user?.email?.split('@')[0] || 'User'
  const initial = username.charAt(0).toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono">
          // User Environment
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Account configuration and performance telemetry.
        </p>
      </header>

      {/* Profile Header Card */}
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-bold text-5xl shrink-0 shadow-inner font-mono">
          {initial}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-extrabold text-foreground font-mono">{username}</h2>
          <p className="text-muted-foreground font-mono text-sm">{user.email}</p>
          <div className="pt-2">
            <span className="inline-flex items-center rounded border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-500 font-mono">
              [Status: Active]
            </span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button className="px-6 py-2 rounded bg-secondary text-foreground font-mono text-sm hover:bg-secondary/80 border border-border transition-colors">
            Configure
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
        Telemetry Data
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-muted-foreground font-mono uppercase">Algorithms Solved</p>
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-foreground font-mono">142</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-accent/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-muted-foreground font-mono uppercase">Global Rating</p>
            <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-foreground font-mono">
            1250 <span className="text-sm font-normal text-muted-foreground ml-2">Expert</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-green-500/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-muted-foreground font-mono uppercase">Current Streak</p>
            <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-foreground font-mono">
            5 <span className="text-sm font-normal text-muted-foreground ml-2">Days</span>
          </p>
        </div>
      </div>
    </div>
  )
}
