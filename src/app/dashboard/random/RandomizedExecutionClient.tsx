'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Trophy, ExternalLink, Flame } from 'lucide-react'

interface LastProblem {
  id: string
  title: string
  difficulty: string
  timestamp: string
}

export default function RandomizedExecutionClient({ streakCount = 0 }: { streakCount?: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('auto')
  const [lastProblem, setLastProblem] = useState<LastProblem | null>(null)
  const router = useRouter()

  const difficulties = [
    'auto', '800', '900', '1000', '1100', '1200', '1300', '1400', '1500', 
    '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', 
    '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', 
    '3400', '3500'
  ]

  useEffect(() => {
    const saved = localStorage.getItem('last_random_problem')
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastProblem(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse last problem', e)
      }
    }
  }, [])

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty: selectedDifficulty }),
      })
      
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to find a suitable problem.')
        return
      }

      if (data.problem) {
        localStorage.setItem('last_random_problem', JSON.stringify({
          ...data.problem,
          timestamp: new Date().toISOString()
        }))
        router.push(`/dashboard/problems/${data.problem.id}`)
      }
    } catch (error) {
      console.error('Failed to get recommendation:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-full pb-20">
      <header className="border-b border-border pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Randomized Execution
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Trust the algorithm or set your target rating.
          </p>
        </div>

        {streakCount > 0 && (
          <div className="flex flex-col items-end gap-1 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
              <span className="text-2xl font-black font-mono leading-none">{streakCount}</span>
            </div>
            <span className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest">Day Streak</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl shadow-sm text-center relative overflow-hidden min-h-[500px]">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded bg-accent/5 blur-3xl animate-pulse" />
        
        <div className="relative z-10 max-w-md mx-auto space-y-8 w-full">
          <div className={`w-24 h-24 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-xl transition-all duration-500 ${isLoading ? 'animate-spin scale-110' : ''}`}>
            {isLoading ? (
              <Loader2 className="w-12 h-12" />
            ) : (
              <Sparkles className="w-12 h-12" />
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3 font-mono tracking-tight">
              {isLoading ? 'Analyzing Skill Matrix...' : 'Initiate Auto-Select?'}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm font-mono opacity-80 mb-6">
              {isLoading 
                ? 'Parsing solved problems and calculating your optimal flow state trajectory...' 
                : 'Configure your target difficulty below or let the AI provision a problem engineered for your level.'}
            </p>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 mb-8">
              <label htmlFor="difficulty" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 font-mono">
                Manual Difficulty Selection
              </label>
              <select
                id="difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === 'auto' ? 'AUTO (Personalized)' : `CF RATING: ${diff}`}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-mono animate-in fade-in zoom-in-95 duration-300">
                {error}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleExecute}
            disabled={isLoading}
            className="group relative w-full sm:w-auto px-12 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.05] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? 'CALCULATING...' : 'EXECUTE'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
          </button>
        </div>
      </div>

      {lastProblem && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-xs font-bold text-muted-foreground mb-4 font-mono uppercase tracking-[0.2em] opacity-60">Previous Execution</h3>
          <div 
            onClick={() => router.push(`/dashboard/problems/${lastProblem.id}`)}
            className="flex items-center p-5 bg-secondary/20 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-secondary/40 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-5 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground font-mono truncate">{lastProblem.title}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  lastProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  lastProblem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {lastProblem.difficulty.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  {new Date(lastProblem.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-4" />
          </div>
        </div>
      )}
    </div>
  )
}
