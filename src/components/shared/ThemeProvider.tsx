'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  // After mount, read from localStorage
  useEffect(() => {
    const initTheme = () => {
      try {
        const stored = (localStorage.getItem('theme') as Theme) || 'dark'
        setThemeState(stored)
      } catch {}
      setSystemTheme(getSystemTheme())
      setMounted(true)
    }
    const timer = setTimeout(initTheme, 0)
    return () => clearTimeout(timer)
  }, [])

  const resolvedTheme: 'dark' | 'light' = mounted
    ? (theme === 'system' ? systemTheme : theme)
    : 'dark'

  // Apply class to <html> on every change after mount
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme, mounted])

  // Listen for OS preference changes when theme = 'system'
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    try { localStorage.setItem('theme', newTheme) } catch {}
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
