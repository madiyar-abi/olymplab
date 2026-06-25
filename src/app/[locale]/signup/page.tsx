'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AuthShell,
  AuthSubmit,
  GoogleButton,
  AuthDivider,
  AuthError,
  authInputClass,
} from '@/components/shared/AuthShell'

export default function SignupPage() {
  const locale = useLocale()
  const t = useTranslations('Auth')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setOauthLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/${locale}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('signup.title')}
      subtitle={t('signup.subtitle')}
      footer={
        <>
          {t('signup.haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-amber-300 hover:text-amber-200 transition-colors">
            {t('signup.loginLink')}
          </Link>
        </>
      }
    >
      {success ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">{t('signup.successTitle')}</h3>
          <p className="text-sm text-white/60">
            {t.rich('signup.successBody', {
              email,
              b: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
            })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSignup}>
          <AuthError>{error}</AuthError>

          <GoogleButton label={t('signup.google')} loading={oauthLoading} onClick={handleGoogleSignup} />

          <AuthDivider label={t('signup.or')} />

          <div className="space-y-3">
            <input
              type="text"
              required
              autoComplete="username"
              placeholder={t('signup.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={authInputClass}
            />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t('signup.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t('signup.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
            <AuthSubmit type="submit" disabled={loading}>
              {loading ? t('signup.submitting') : t('signup.submit')}
            </AuthSubmit>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
