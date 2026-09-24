"use client"

import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle2, Circle, ExternalLink, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Problem } from '@/app/[locale]/dashboard/problems/ProblemsClient'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProblemTableProps {
  problems: Problem[]
  solvedProblemIds: Set<string>
  revealedProblemIds: Set<string>
  bookmarkedProblemIds?: Set<string>
  onToggleBookmark?: (e: React.MouseEvent, problemId: string) => void
  hideTagsSetting: boolean
  userId?: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:    'text-emerald-500',
  Medium:  'text-amber-500',
  Hard:    'text-red-500',
  Mastery: 'text-purple-500',
  Unrated: 'text-zinc-500',
}

export function ProblemTable({ 
  problems, 
  solvedProblemIds, 
  revealedProblemIds, 
  bookmarkedProblemIds = new Set(),
  onToggleBookmark,
  hideTagsSetting, 
  userId 
}: ProblemTableProps) {
  const t = useTranslations('Problems')
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm font-mono">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-12 text-center">{t('table.status')}</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-12 text-center">★</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-20">{t('table.id')}</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">{t('table.titleTags')}</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-36">{t('table.difficulty')}</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-24 text-right">{t('table.action')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {problems.map((problem) => (
            <ProblemRow 
              key={problem.id} 
              problem={problem} 
              isSolved={solvedProblemIds.has(problem.id)}
              isBookmarked={bookmarkedProblemIds.has(problem.id)}
              onToggleBookmark={onToggleBookmark}
              hideTagsSetting={hideTagsSetting}
              isInitiallyRevealed={revealedProblemIds.has(problem.id)}
              userId={userId}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProblemRow({ 
  problem, 
  isSolved, 
  isBookmarked,
  onToggleBookmark,
  hideTagsSetting, 
  isInitiallyRevealed, 
  userId 
}: { 
  problem: Problem
  isSolved: boolean
  isBookmarked: boolean
  onToggleBookmark?: (e: React.MouseEvent, problemId: string) => void
  hideTagsSetting: boolean
  isInitiallyRevealed: boolean
  userId?: string 
}) {
  const t = useTranslations('Problems')
  const locale = useLocale()
  const [revealed, setRevealed] = useState(isInitiallyRevealed)
  const supabase = createClient()
  const shouldHide = hideTagsSetting && !isSolved && !revealed
  const tags = problem.tags || []

  const handleReveal = async () => {
    if (shouldHide) {
      setRevealed(true)
      if (userId) {
        await supabase.from('revealed_problems').insert({ user_id: userId, problem_id: problem.id })
      }
    }
  }

  return (
    <tr className="group hover:bg-white/5 transition-colors duration-150">
      <td className="px-4 py-2 text-center">
        {isSolved ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
        )}
      </td>
      <td className="px-4 py-2 text-center">
        {onToggleBookmark && (
          <button
            onClick={(e) => onToggleBookmark(e, problem.id)}
            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-amber-400 transition-colors"
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Flag className={cn("w-3.5 h-3.5", isBookmarked && "fill-amber-400 text-amber-400")} />
          </button>
        )}
      </td>
      <td className="px-4 py-2 text-muted-foreground font-mono text-[11px]">
        {problem.id.slice(0, 8)}
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link 
              href={`/dashboard/problems/${problem.id}`}
              className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {(locale === 'ru' && problem.title_ru) ? problem.title_ru : problem.title}
            </Link>
            {problem.rating && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300">
                {problem.rating}
              </span>
            )}
          </div>
          
          <div 
            className="flex flex-wrap gap-1 items-center"
            onClick={handleReveal}
          >
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border border-border/50 bg-secondary/50 text-muted-foreground font-mono transition-all duration-300",
                    shouldHide && "blur-[3px] select-none opacity-40 hover:opacity-60 cursor-pointer"
                  )}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground/50">{t('table.noTags')}</span>
            )}
            {shouldHide && (
              <button 
                onClick={handleReveal}
                className="text-[9px] font-bold text-primary hover:underline ml-1 uppercase"
              >
                {t('table.reveal')}
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <span className={cn(
          "font-bold text-xs uppercase tracking-wider",
          DIFFICULTY_COLORS[problem.difficulty] || 'text-zinc-500'
        )}>
          {problem.difficulty}
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <Link
          href={`/dashboard/problems/${problem.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
        >
          <span>{isSolved ? t('review') : t('solveNow')}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  )
}
