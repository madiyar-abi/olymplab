'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { 
    name: 'Problem Catalog', 
    href: '/dashboard/problems',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  { 
    name: 'Randomized Exec', 
    href: '/dashboard/random',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  { 
    name: 'Structured Syllabi', 
    href: '/dashboard/learning',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    name: 'Telemetry Data', 
    href: '/dashboard/progress',
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
]

export function Sidebar({ username, email }: { username: string, email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r border-border h-full flex flex-col py-6 px-4">
      {/* Navigation Items */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}>
                {item.icon}
              </span>
              <span className="font-mono tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Spacer to push lower section to the bottom */}
      <div className="mt-auto pt-6" />

      {/* Lower Section (Profile & Logout) */}
      <div className="space-y-2 border-t border-border pt-4">
        {/* Profile Tab */}
        <Link
          href="/dashboard/profile"
          className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === '/dashboard/profile'
              ? 'bg-secondary text-foreground shadow-sm border border-border/50'
              : 'text-foreground hover:bg-secondary border border-transparent'
          }`}
        >
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold mr-3">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate font-semibold">{username}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </div>
        </Link>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-mono font-bold tracking-widest uppercase">Logout</span>
        </button>
      </div>
    </aside>
  )
}
