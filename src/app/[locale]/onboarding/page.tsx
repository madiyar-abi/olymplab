'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Code2, Sigma, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillAxes } from '@/types/database'

const GOLD = 'bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent'

const LEVEL_BASE: Record<string, number> = { Beginner: 10, Intermediate: 30, Pro: 55 }

/** Seed all nine skill axes from discipline + level so the matching engine has
 *  a sensible starting point. Values adapt as the user solves problems. */
function buildSkills(subject: string, level: string): Record<string, number> {
  const base = LEVEL_BASE[level] ?? 10
  const skills: Record<SkillAxes, number> = {
    algorithms: base,
    data_structures: base,
    complexity: base,
    coding: base,
    debugging: base,
    speed: base,
    logic: base,
    math: base,
    graphs: base,
  }
  const focus: SkillAxes[] =
    subject === 'Mathematics'
      ? ['math', 'logic', 'algorithms']
      : ['coding', 'debugging', 'data_structures', 'algorithms', 'complexity']
  focus.forEach((ax) => {
    skills[ax] = Math.min(95, skills[ax] + 12)
  })
  return skills
}

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('Onboarding')
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
      else router.push('/login')
    })
  }, [router, supabase])

  const handleFinish = async () => {
    if (!userId || !subject || !level) return
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      // Supabase's generated types infer `never` for update payloads here, so we
      // cast — the shape matches the `profiles` Update type above.
      .update({
        primary_subject: subject,
        experience_level: level,
        skills: buildSkills(subject, level),
      } as never)
      .eq('id', userId)

    if (error) {
      console.error('Error saving onboarding data:', error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const disciplines = [
    { value: 'C++ Programming', label: t('cpp'), icon: Code2 },
    { value: 'Mathematics', label: t('math'), icon: Sigma },
  ]
  const levels = [
    { value: 'Beginner', label: t('beginner'), desc: t('beginnerDesc') },
    { value: 'Intermediate', label: t('intermediate'), desc: t('intermediateDesc') },
    { value: 'Pro', label: t('pro'), desc: t('proDesc') },
  ]

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#070709] text-white p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/3 w-[40vw] h-[40vw] bg-amber-500/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] bg-blue-600/10 blur-[180px] rounded-full" />
      </div>

      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 overflow-hidden">
        {/* progress */}
        <div className="absolute top-0 left-0 h-1 w-full bg-white/5">
          <div
            className="h-full bg-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="text-xs font-mono uppercase tracking-wider text-white/40 mb-6">
          {t('step')} {step} {t('of')} 2
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{t('disciplineTitle')}</h1>
            <p className="text-white/50 mb-8">{t('disciplineSubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {disciplines.map((d) => {
                const Icon = d.icon
                return (
                  <button
                    key={d.value}
                    onClick={() => {
                      setSubject(d.value)
                      setStep(2)
                    }}
                    className="group flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all hover:border-amber-400/40 hover:bg-amber-400/[0.04]"
                  >
                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-bold">{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{t('levelTitle')}</h1>
            <p className="text-white/50 mb-8">{t('levelSubtitle')}</p>
            <div className="flex flex-col gap-3">
              {levels.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border p-5 text-left transition-all',
                    level === l.value
                      ? 'border-amber-400/50 bg-amber-400/[0.07]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25',
                  )}
                >
                  <div>
                    <div className="text-base font-bold">{l.label}</div>
                    <div className="text-sm text-white/50">{l.desc}</div>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-colors',
                      level === l.value ? 'border-amber-400 bg-amber-400' : 'border-white/20',
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </button>
              <button
                onClick={handleFinish}
                disabled={!level || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-black transition-all hover:bg-amber-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}
                  </>
                ) : (
                  <>
                    {t('finish')} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <span className={cn('text-sm font-black tracking-tight', GOLD)}>OlympLab</span>
        </div>
      </div>
    </div>
  )
}
