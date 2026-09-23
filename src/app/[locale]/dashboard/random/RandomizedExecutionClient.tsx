'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Flame, Sparkles, AlertCircle, ArrowRight, Zap, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface LastProblem {
  id: string
  title: string
  difficulty: string
  rating?: number
  timestamp: string
}

const ROULETTE_TITLES = [
  '[CF] Tree Diameter & Centers',
  '[CF] Segment Tree Range Updates',
  '[CF] Dynamic Programming on Subsets',
  '[CF] Convex Hull & Upper Envelope',
  '[CF] Two Pointers with Monotonic Queue',
  '[CF] Dijkstra with Bitmask States',
  '[CF] Edmonds-Karp Network Flow',
  '[CF] Sieve of Eratosthenes & Mobius',
  '[CF] Binary Search over Monotonic Function',
  '[CF] String Matching with KMP Automaton',
]

const ROULETTE_RATINGS = [1200, 1400, 1600, 1800, 2000, 2200, 2400]

export default function RandomizedExecutionClient({ streakCount = 0 }: { streakCount?: number }) {
  const t = useTranslations('Random')
  const locale = useLocale()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minRatingStr, setMinRatingStr] = useState('800')
  const [maxRatingStr, setMaxRatingStr] = useState('3500')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [lastProblem, setLastProblem] = useState<LastProblem | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('last_random_problem')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse last problem', e)
      }
    }
    return null
  })

  // Roulette animation state
  const [rouletteIndex, setRouletteIndex] = useState(0)
  const [rouletteRating, setRouletteRating] = useState(1400)
  const [phaseText, setPhaseText] = useState('Scanning problem bank...')

  const allTags = [
    'dp', 'math', 'greedy', 'graphs', 'data structures', 
    'strings', 'geometry', 'number theory', 'brute force', 'binary search'
  ]

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Roulette loop effect while loading
  useEffect(() => {
    if (!isLoading) return

    const titleInterval = setInterval(() => {
      setRouletteIndex(prev => (prev + 1) % ROULETTE_TITLES.length)
      setRouletteRating(ROULETTE_RATINGS[Math.floor(Math.random() * ROULETTE_RATINGS.length)])
    }, 90)

    const timer1 = setTimeout(() => {
      setPhaseText(locale === 'ru' ? 'Синхронизация матрицы навыков...' : 'Projecting skill matrix...')
    }, 600)

    const timer2 = setTimeout(() => {
      setPhaseText(locale === 'ru' ? 'Оптимальная олимпиадная задача подобрана!' : 'Optimal challenge synthesized!')
    }, 1300)

    return () => {
      clearInterval(titleInterval)
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isLoading, locale])

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)
    setPhaseText(locale === 'ru' ? 'Поиск в базе из 1,170+ олимпиадных задач...' : 'Scanning 1,170+ competitive problems...')

    const minRating = parseInt(minRatingStr, 10) || 800
    const maxRating = parseInt(maxRatingStr, 10) || 3500

    try {
      const startTime = Date.now()
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minRating, maxRating, tags: selectedTags }),
      })
      
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('errorNotFound'))
        setIsLoading(false)
        return
      }

      if (data.problem) {
        const lastP: LastProblem = {
          ...data.problem,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('last_random_problem', JSON.stringify(lastP))
        setLastProblem(lastP)

        // Allow at least 1.6s of futuristic roulette excitement
        const elapsed = Date.now() - startTime
        const waitMore = Math.max(0, 1600 - elapsed)

        setTimeout(() => {
          router.push(`/dashboard/problems/${data.problem.id}`)
        }, waitMore)
      } else {
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Failed to get recommendation:', err)
      setError(t('errorUnexpected'))
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-full pb-20">
      <header className="border-b border-white/5 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {t('subtitle')}
          </p>
        </div>

        {streakCount > 0 && (
          <div className="flex flex-col items-end gap-1 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
              <span className="text-2xl font-black font-mono leading-none">{streakCount}</span>
            </div>
            <span className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest">{t('dayStreak')}</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-xl text-center relative overflow-hidden min-h-[520px]">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto space-y-8 w-full">
          {/* Main Visualizer or Roulette Spinner */}
          {isLoading ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-4 space-y-4"
            >
              {/* Radar Rings & Glowing Core */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-sky-500/30 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-amber-400/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '4s' }} />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Zap className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              {/* Shuffling Roulette Display */}
              <div className="rounded-xl border border-amber-500/40 bg-black/60 p-4 shadow-inner space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Roulette Match
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    ★ {rouletteRating}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-white truncate h-6 flex items-center justify-center">
                  {ROULETTE_TITLES[rouletteIndex]}
                </div>
              </div>

              {/* Status Phase */}
              <p className="text-xs font-mono text-amber-300/80 animate-pulse tracking-wide">
                {phaseText}
              </p>
            </motion.div>
          ) : (
            <div className="w-20 h-20 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-xl">
              <Sparkles className="w-10 h-10" />
            </div>
          )}
          
          {!isLoading && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 font-mono tracking-tight">
                {t('initiate')}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm font-mono opacity-80 mb-6">
                {t('initiateDesc')}
              </p>

              <div className="bg-secondary/30 p-5 rounded-xl border border-border/50 mb-8 space-y-6 text-left">
                {/* Clean Rating Range Inputs (Fixed No Zero Bugs) */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 font-mono">
                    {t('ratingRange')}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minRatingStr}
                      onChange={(e) => setMinRatingStr(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const val = parseInt(minRatingStr, 10)
                        if (isNaN(val) || val < 800) setMinRatingStr('800')
                      }}
                      className="w-1/2 bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="800"
                    />
                    <span className="text-muted-foreground font-mono font-bold">-</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxRatingStr}
                      onChange={(e) => setMaxRatingStr(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const val = parseInt(maxRatingStr, 10)
                        if (isNaN(val) || val > 3500) setMaxRatingStr('3500')
                      }}
                      className="w-1/2 bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="3500"
                    />
                  </div>
                </div>

                {/* Topics / Tags */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 font-mono">
                    {t('topicsTags')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-primary text-primary-foreground shadow-md scale-105'
                            : 'bg-background border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{error}</span>
                </div>
              )}

              <Button
                onClick={handleExecute}
                className="w-full py-4 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('button')}
              </Button>
            </div>
          )}

          {/* Last Problem Recall */}
          {lastProblem && !isLoading && (
            <div className="pt-6 border-t border-border/40 text-left">
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest block mb-2">
                {t('previousProblem')}
              </span>
              <button
                onClick={() => router.push(`/dashboard/problems/${lastProblem.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-mono font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {lastProblem.title}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ★ {lastProblem.rating || 1200} · {lastProblem.difficulty}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
