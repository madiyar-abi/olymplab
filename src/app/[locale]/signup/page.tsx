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

export default function SignupPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Auth')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // When email confirmation is disabled, Supabase returns a session immediately.
    // Redirect straight to the dashboard in that case.
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      // Fallback: email confirmation is still enabled — redirect to login.
      router.push('/login?message=check-email')
    }
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
    </AuthShell>
  )
}
