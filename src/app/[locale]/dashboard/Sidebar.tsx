'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/* ── TYPES ─────────────────────────────────────────────────────────────────── */

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

/* ── NAVIGATION CONFIG ─────────────────────────────────────────────────────── */

const mainNavItems: NavItem[] = [
  {
    name: 'Problem Catalog',
    href: '/dashboard/problems',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Randomized Exec',
    href: '/dashboard/random',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    name: 'Structured Syllabi',
    href: '/dashboard/learning',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: 'Flagged Problems',
    href: '/dashboard/problems/flagged',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
  {
    name: 'Submissions',
    href: '/dashboard/submissions',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Whiteboard',
    href: '/dashboard/whiteboard',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    name: 'Graph Editor',
    href: '/dashboard/graph-editor',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

/* ── HELPER COMPONENTS ─────────────────────────────────────────────────────── */

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

interface SidebarItemProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
}

function SidebarItem({ item, isActive, isCollapsed }: SidebarItemProps) {
  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        'group relative flex items-center py-2.5 rounded-xl text-sm transition-all duration-300 ease-in-out',
        isCollapsed ? 'justify-center px-2' : 'px-4 gap-3',
        isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white hover:bg-white/5'
      )}
    >
      {/* Magic Indicator Pill */}
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-xl z-0"
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />
      )}

      {/* Icon Container - CRITICAL FOR ALIGNMENT */}
      <div className={cn(
        'relative z-10 w-5 flex justify-center flex-shrink-0 transition-colors duration-300',
        isActive ? 'text-blue-400' : 'group-hover:text-white'
      )}>
        {item.icon}
      </div>

      {/* Label */}
      {!isCollapsed && (
        <span className="relative z-10 whitespace-nowrap overflow-hidden">
          {item.name}
        </span>
      )}
    </Link>
  )
}

/* ── MAIN COMPONENT ────────────────────────────────────────────────────────── */

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

  if (!isMounted) {
    return (
      <aside className="w-64 flex-shrink-0 bg-background/60 backdrop-blur-xl border-r border-white/5 h-full" />
    )
  }

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64'
  const paddingX = isCollapsed ? 'px-3' : 'px-4'

  return (
    <aside
      className={cn(
        sidebarWidth,
        'flex-shrink-0 flex flex-col h-full bg-[#0a0a0a] border-r border-white/5 relative transition-all duration-500 ease-in-out pb-6'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 bg-[#121212] border border-white/10 rounded-full p-1.5 hover:bg-white/5 text-neutral-500 hover:text-white transition-all z-50 shadow-2xl"
      >
        <svg
          className={cn('w-3.5 h-3.5 transition-transform duration-500', isCollapsed && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="h-4" /> {/* Spacer */}


      {/* ── NAVIGATION ───────────────────────────────────────────────────────── */}
      <nav className={cn('flex-1 space-y-1', paddingX)}>
        {mainNavItems.map((item) => {
          const isActive = (() => {
            if (item.href === '/dashboard/problems') {
              return pathname === '/dashboard/problems' || 
                (pathname.startsWith('/dashboard/problems/') && !pathname.startsWith('/dashboard/problems/flagged'))
            }
            return pathname === item.href || pathname.startsWith(item.href + '/')
          })()
          return (
            <SidebarItem 
              key={item.href} 
              item={item} 
              isActive={isActive} 
              isCollapsed={isCollapsed} 
            />
          )
        })}
      </nav>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <div className={cn('mt-auto space-y-4', paddingX)}>
        {/* Profile Card */}
        <Link
          href="/dashboard/profile"
          className={cn(
            'group flex items-center rounded-xl transition-all duration-300 ease-in-out',
            isCollapsed ? 'justify-center p-2' : 'p-2.5 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]',
            pathname === '/dashboard/profile' && 'border-blue-500/30 bg-blue-500/5'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 group-hover:text-white transition-colors flex-shrink-0 border border-white/5">
            {username.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{username}</span>
              <span className="text-[10px] text-neutral-500 font-medium">Lvl 12 Expert</span>
            </div>
          )}
        </Link>

        {/* Action Buttons */}
        <div className="space-y-1">
          {/* Settings */}
          <Link
            href="/dashboard/settings"
            className={cn(
              'group relative flex items-center py-2.5 rounded-xl text-sm transition-all duration-300 ease-in-out',
              isCollapsed ? 'justify-center px-2' : 'px-4 gap-3',
              pathname === '/dashboard/settings' ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white hover:bg-white/5'
            )}
          >
            {pathname === '/dashboard/settings' && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-xl z-0"
              />
            )}
            <div className="relative z-10 w-5 flex justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {!isCollapsed && <span className="relative z-10">Settings</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'group flex items-center py-2.5 rounded-xl text-sm transition-all duration-300 ease-in-out w-full',
              isCollapsed ? 'justify-center px-2' : 'px-4 gap-3',
              'text-neutral-400 hover:text-red-400 hover:bg-red-400/5'
            )}
          >
            <div className="w-5 flex justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Status indicator */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">System Ready</span>
          </div>
        )}
      </div>
    </aside>
  )
}
