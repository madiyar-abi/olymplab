'use client'

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const GOLD = 'bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent'

/* Shared dark/branded shell for the login & signup pages. Always dark so the
 * landing → auth → app funnel stays cohesive with the ink + amber identity. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const t = useTranslations('Auth')

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex bg-[#070709] text-white">
      {/* Left: form */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 left-1/4 w-[40vw] h-[40vw] bg-amber-500/10 blur-[160px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-blue-600/10 blur-[160px] rounded-full" />
        </div>

        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backHome')}
        </Link>

        <div className="relative w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <Image src="/logo.png" alt="OlympLab" width={48} height={48} className="rounded-xl mb-5" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-white/50">{subtitle}</p>
          </div>

          {children}

          <div className="mt-8 text-center text-sm text-white/50">{footer}</div>
        </div>
      </div>

      {/* Right: branded panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#0d0b06] via-[#070709] to-black">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-500/10 blur-[180px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-700/10 blur-[180px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 max-w-xl">
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-5">
            <span className={GOLD}>{t('panel.title')}</span>
          </h2>
          <p className="text-white/55 text-lg leading-relaxed mb-10">{t('panel.subtitle')}</p>
          <ul className="space-y-4">
            {['point1', 'point2', 'point3'].map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <span className="text-white/75">{t(`panel.${p}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ── Shared dark form primitives ── */

export const authInputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/15'

export function AuthSubmit({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-xl bg-amber-400 py-3 text-base font-bold text-black transition-all hover:bg-amber-300 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.99]"
    >
      {children}
    </button>
  )
}

export function GoogleButton({
  label,
  loading,
  onClick,
}: {
  label: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60 disabled:pointer-events-none"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-amber-300" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#070709] px-4 text-xs uppercase tracking-wider text-white/40">{label}</span>
      </div>
    </div>
  )
}

export function AuthError({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {children}
    </div>
  )
}

export const GOLD_TEXT = GOLD
