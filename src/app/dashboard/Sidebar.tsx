'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Problem Catalog',
    href: '/dashboard/problems',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Randomized Exec',
    href: '/dashboard/random',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    name: 'Structured Syllabi',
    href: '/dashboard/learning',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: 'Flagged Problems',
    href: '/dashboard/problems/flagged',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
  {
    name: 'Submissions',
    href: '/dashboard/submissions',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Whiteboard',
    href: '/dashboard/whiteboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
]

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function Sidebar({ username }: { username: string; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('sidebarCollapsed') === 'true') setIsCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sidebarCollapsed', String(next))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  /* ── Skeleton while hydrating ─────────────────────────────────────────────── */
  if (!isMounted) {
    return (
      <aside className="w-64 flex-shrink-0 bg-background/60 backdrop-blur-xl border-r border-white/5 h-full" />
    )
  }

  const w = isCollapsed ? 'w-20' : 'w-64'
  /* Consistent horizontal padding — used for BOTH logo and nav items */
  const px = isCollapsed ? 'px-0' : 'px-4'

  return (
    <aside
      className={cn(
        w,
        'flex-shrink-0 flex flex-col h-full',
        'bg-background/60 backdrop-blur-xl',
        'border-r border-white/5',          /* ← hairline vertical line, full height */
        'transition-all duration-300 relative group/sidebar',
        'pb-6'
      )}
    >
      {/* SVG gradient def for active icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="sidebar-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-[72px] bg-background border border-white/5 rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all z-50 opacity-0 group-hover/sidebar:opacity-100 shadow-sm"
      >
        <svg
          className={cn('w-3.5 h-3.5 transition-transform duration-300', isCollapsed && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── LOGO — top header ──────────────────────────────────────────────────── */}
      <div className={cn('pt-8 mb-8', isCollapsed ? 'flex justify-center' : 'px-4')}>
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 group',
            isCollapsed && 'justify-center'
          )}
        >
          <Image
            src="/logo.png"
            alt="OlympLab"
            width={28}
            height={28}
            className="rounded-lg flex-shrink-0 group-hover:opacity-80 transition-opacity"
          />
          {!isCollapsed && (
            <span className="font-mono font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
              OlympLab
            </span>
          )}
        </Link>
      </div>

      {/* ── NAV ITEMS ─────────────────────────────────────────────────────────── */}
      <nav className={cn('space-y-0.5', px)}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'flex items-center py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group',
                isCollapsed ? 'justify-center px-2' : 'px-3',
                isActive
                  ? 'bg-primary/10 text-primary [&_svg]:stroke-[url(#sidebar-icon-gradient)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {/* Active accent bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
              )}
              <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className={cn(
                  'whitespace-nowrap overflow-hidden',
                  isActive && 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 font-semibold'
                )}>
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── FOOTER — anchored to bottom ────────────────────────────────────────── */}
      <div className={cn('mt-auto', px)}>
        {/* Hairline separator */}
        <div className="border-t border-white/5 mb-3" />

        <div className={cn('space-y-0.5', isCollapsed && 'flex flex-col items-center')}>
          {/* Profile */}
          <Link
            href="/dashboard/profile"
            title={isCollapsed ? 'Profile' : undefined}
            className={cn(
              'flex items-center rounded-lg transition-colors group/profile hover:bg-muted/50',
              isCollapsed ? 'justify-center w-10 h-10' : 'px-2 py-2',
              pathname === '/dashboard/profile'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-muted border border-white/5',
              'flex items-center justify-center text-[10px] font-bold text-foreground',
              'group-hover/profile:border-primary/30 transition-colors',
              !isCollapsed && 'mr-3'
            )}>
              {username.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <span className={cn(
                'truncate text-sm font-medium',
                pathname === '/dashboard/profile' && 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 font-semibold'
              )}>
                {username}
              </span>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center rounded-lg transition-all duration-200',
              isCollapsed ? 'justify-center w-10 h-10' : 'px-3 py-2',
              pathname === '/dashboard/settings'
                ? 'bg-primary/10 text-primary [&_svg]:stroke-[url(#sidebar-icon-gradient)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            {!isCollapsed && (
              <span className={cn(
                'truncate text-sm font-medium',
                pathname === '/dashboard/settings' && 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 font-semibold'
              )}>
                Settings
              </span>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium transition-all',
              'text-muted-foreground hover:text-destructive hover:bg-destructive/5',
              isCollapsed ? 'justify-center w-10 h-10' : 'w-full px-3 py-2'
            )}
          >
            <span className={cn('flex-shrink-0', !isCollapsed && 'mr-3')}>
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!isCollapsed && <span>Logout</span>}
          </button>

          {/* Status indicator */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Ready</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
