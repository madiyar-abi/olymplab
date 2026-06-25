'use client'

import { useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  AuthShell,
  AuthSubmit,
  GoogleButton,
  AuthDivider,
  AuthError,
  authInputClass,
} from '@/components/shared/AuthShell'

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Auth')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
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
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link href="/signup" className="font-semibold text-amber-300 hover:text-amber-200 transition-colors">
            {t('login.signupLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin}>
        <AuthError>{error}</AuthError>

        <GoogleButton label={t('login.google')} loading={oauthLoading} onClick={handleGoogleLogin} />

        <AuthDivider label={t('login.or')} />

        <div className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
          <AuthSubmit type="submit" disabled={loading}>
            {loading ? t('login.submitting') : t('login.submit')}
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
