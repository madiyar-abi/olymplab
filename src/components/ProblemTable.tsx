"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Eye, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Problem } from '@/app/[locale]/dashboard/problems/ProblemsClient'
import { useState } from 'react'

interface ProblemTableProps {
  problems: Problem[]
  solvedProblemIds: Set<string>
  hideTagsSetting: boolean
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:    'text-emerald-500',
  Medium:  'text-amber-500',
  Hard:    'text-red-500',
  Mastery: 'text-purple-500',
  Unrated: 'text-zinc-500',
}

export function ProblemTable({ problems, solvedProblemIds, hideTagsSetting }: ProblemTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left text-sm font-mono">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-12 text-center">Status</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-20">ID</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Title & Tags</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-32">Difficulty</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider w-24 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {problems.map((problem) => (
            <ProblemRow 
              key={problem.id} 
              problem={problem} 
              isSolved={solvedProblemIds.has(problem.id)}
              hideTagsSetting={hideTagsSetting}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProblemRow({ problem, isSolved, hideTagsSetting }: { problem: Problem, isSolved: boolean, hideTagsSetting: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const shouldHide = hideTagsSetting && !isSolved && !revealed
  const tags = problem.tags || []

  return (
    <tr className="group hover:bg-white/5 transition-colors duration-150">
      <td className="px-4 py-2 text-center">
        {isSolved ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
        )}
      </td>
      <td className="px-4 py-2 text-muted-foreground font-mono text-[11px]">
        {problem.id.slice(0, 8)}
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <Link 
            href={`/dashboard/problems/${problem.id}`}
            className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {problem.title}
          </Link>
          
          <div 
            className="flex flex-wrap gap-1 items-center"
            onClick={() => shouldHide && setRevealed(true)}
          >
            {tags.length > 0 ? (
              tags.map(tag => (
                <span 
                  key={tag}
                  className={cn(
                    "px-1.5 py-0.5 rounded bg-secondary text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70 border border-border/50 transition-all duration-300",
                    shouldHide && "blur-[3px] select-none opacity-40 hover:opacity-100 cursor-pointer"
                  )}
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-muted-foreground/40 italic">No tags</span>
            )}
            {shouldHide && (
              <span className="flex items-center gap-0.5 ml-1 text-[8px] font-bold text-primary/60 cursor-pointer hover:text-primary transition-colors">
                <Eye className="w-2.5 h-2.5" />
                REVEAL
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <span className={cn(
          "font-bold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary/50 border border-border",
          DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.Unrated
        )}>
          {problem.difficulty || 'Unrated'}
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <Link
          href={`/dashboard/problems/${problem.id}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group/link"
        >
          {isSolved ? 'Review' : 'Solve'}
          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </Link>
      </td>
    </tr>
  )
}
