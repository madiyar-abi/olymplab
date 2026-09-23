'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Code2, Sigma, ArrowLeft, ArrowRight, Loader2, Sparkles, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillAxes } from '@/types/database'

const GOLD = 'bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent'

const LEVEL_BASE: Record<string, number> = { Beginner: 10, Intermediate: 30, Pro: 55 }

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

const PROGRAMMING_LANGUAGES = [
  { value: 'cpp', label: 'C++20', desc: 'Standard for ICPC & IOI, ultra-fast STL' },
  { value: 'python', label: 'Python 3', desc: 'Fast prototyping, clean logic syntax' },
  { value: 'rust', label: 'Rust', desc: 'Modern memory safety & zero-cost abstractions' },
  { value: 'java', label: 'Java 21', desc: 'Standard OOP & robust BigInteger' },
  { value: 'go', label: 'Go', desc: 'Simplicity, concurrency, fast compile times' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('Onboarding')
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [language, setLanguage] = useState('cpp')
  const [cfHandle, setCfHandle] = useState('')
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
      .update({
        primary_subject: subject,
        experience_level: level,
        preferred_language: language,
        cf_handle: cfHandle.trim() || null,
        skills: buildSkills(subject, level),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error saving onboarding data:', error)
      setLoading(false)
      return
    }
    router.push('/dashboard/problems')
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

      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-white/5">
          <div
            className="h-full bg-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-white/40">
            {t('step')} {step} {t('of')} 3
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile Calibration</span>
          </div>
        </div>

        {/* Step 1: Discipline */}
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
                    className={cn(
                      'group flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all duration-300',
                      subject === d.value
                        ? 'border-amber-400/50 bg-amber-400/[0.08]'
                        : 'border-white/10 bg-white/[0.02] hover:border-amber-400/40 hover:bg-amber-400/[0.04]'
                    )}
                  >
                    <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                      {d.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{t('levelTitle')}</h1>
            <p className="text-white/50 mb-8">{t('levelSubtitle')}</p>
            <div className="flex flex-col gap-3">
              {levels.map((l) => (
                <button
                  key={l.value}
                  onClick={() => {
                    setLevel(l.value)
                    setStep(3)
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300',
                    level === l.value
                      ? 'border-amber-400/50 bg-amber-400/[0.07]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                  )}
                >
                  <div>
                    <div className="text-base font-bold text-white">{l.label}</div>
                    <div className="text-sm text-white/50">{l.desc}</div>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition-colors',
                      level === l.value ? 'border-amber-400 bg-amber-400' : 'border-white/20'
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
            </div>
          </div>
        )}

        {/* Step 3: Programming Language & Handle */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{t('langTitle')}</h1>
            <p className="text-white/50 mb-6">{t('langSubtitle')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {PROGRAMMING_LANGUAGES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setLanguage(item.value)}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition-all',
                    language === item.value
                      ? 'border-amber-400/50 bg-amber-400/[0.1] text-amber-200'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-1 line-clamp-1">{item.desc}</div>
                </button>
              ))}
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-sm font-semibold text-white/80 block">{t('handleTitle')}</label>
              <p className="text-xs text-white/40 mb-2">{t('handleSubtitle')}</p>
              <input
                type="text"
                value={cfHandle}
                onChange={(e) => setCfHandle(e.target.value)}
                placeholder={t('handlePlaceholder')}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </button>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-black transition-all hover:bg-amber-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95 shadow-[0_0_30px_-5px_rgba(251,191,36,0.4)]"
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
