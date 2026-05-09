'use client'

import { Link, useRouter, usePathname } from '@/i18n/routing'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const t = useTranslations('Navbar')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

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
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Handle case where we might be at root or specific locale root
  if (pathname === '/') {
    // Note: next-intl usePathname returns path WITHOUT locale prefix
    // So if we are on /en, usePathname returns /
    return null
  }

  return (
    <nav className="border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container flex h-16 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="OlympLab"
            width={30}
            height={30}
            className="rounded-lg flex-shrink-0"
          />
          <span className="font-bold text-xl tracking-tight text-foreground font-mono group-hover:text-primary transition-colors">OlympLab</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <nav className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  {t('dashboard')}
                </Link>
                <Button
                  id="logout-btn"
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                >
                  {t('logout')}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  {t('login')}
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    {t('signup')}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  )
}
