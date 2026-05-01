'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="relative h-9 w-9 rounded-md border border-border hover:bg-secondary flex items-center justify-center transition-colors"
    >
      {/* Sun icon (visible in dark mode) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 transition-all ${resolvedTheme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9H21m-18 0H2.34M17.66 5.34l-.71.71M6.34 17.66l-.71.71M17.66 18.66l-.71-.71M6.34 5.34l-.71-.71M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {/* Moon icon (visible in light mode) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 transition-all ${resolvedTheme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  )
}
