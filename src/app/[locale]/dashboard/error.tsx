'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Errors')

  useEffect(() => {
    console.error('[Dashboard Error Boundary]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-xl">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t('description')}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {t('retry')}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
