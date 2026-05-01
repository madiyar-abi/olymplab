'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          {/* Geometric Logo */}
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent shadow-md flex items-center justify-center text-white text-xs font-mono font-bold select-none border border-white/10">
            {'{'}OL{'}'}
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground font-mono">Olymp<span className="text-primary">Lab</span></span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  )
}
