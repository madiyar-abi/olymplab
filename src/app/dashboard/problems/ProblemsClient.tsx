"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, FilterX, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagSelector } from './TagSelector'

type Requirements = Record<string, { level: number; weight: number }>

const DIFFICULTY_CONFIG: Record<string, { badge: string; shadow: string }> = {
  Easy:    { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.25)]' },
  Medium:  { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30', shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.25)]' },
  Hard:    { badge: 'text-red-400 bg-red-500/10 border-red-500/30', shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.25)]' },
  Mastery: { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30', shadow: 'shadow-[0_0_15px_rgba(192,132,252,0.25)]' },
  Unrated: { badge: 'text-zinc-400 bg-white/5 border-white/10', shadow: '' },
}

// Get dominant skill by highest weight
function getDominantSkill(req: Requirements | null | undefined): string {
  if (!req) return 'Uncategorized'
  let best = ''
  let max = 0
  for (const [skill, { weight }] of Object.entries(req)) {
    if (weight > max) { max = weight; best = skill }
  }
  return max > 0 ? best : 'Uncategorized'
}

// Fallback tags from requirements if real tags are missing
function getFallbackTags(req: Requirements | null | undefined, n = 3): string[] {
  if (!req) return []
  return Object.entries(req)
    .filter(([, { weight }]) => weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, n)
    .map(([skill]) => skill.replace('_', ' '))
}

function sectionLabel(skill: string) {
  return skill === 'Uncategorized'
    ? 'All Problems'
    : skill.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export interface Problem {
  id: string
  title: string
  difficulty: string
  requirements: Requirements
  tags?: string[]
}

interface TagGroupProps {
  tags: string[]
  isSolved: boolean
  hideTagsSetting: boolean
}

function TagGroup({ tags, isSolved, hideTagsSetting }: TagGroupProps) {
  const [revealed, setRevealed] = useState(false)
  const shouldHide = hideTagsSetting && !isSolved && !revealed

  if (tags.length === 0) {
    return <span className="text-muted-foreground/60 text-[10px] font-mono">Unrated problem</span>
  }

  return (
    <div 
      className="flex flex-wrap gap-1.5 relative group/tags"
      onClick={(e) => {
        if (shouldHide) {
          e.preventDefault()
          e.stopPropagation()
          setRevealed(true)
        }
      }}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className={cn(
            "bg-secondary text-muted-foreground px-2.5 py-1 rounded-md text-[9px] font-semibold border border-border uppercase tracking-wider transition-all duration-500",
            shouldHide && "blur-[4px] select-none opacity-40 group-hover/tags:opacity-60"
          )}
        >
          {tag}
        </span>
      ))}
      {shouldHide && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm group-hover/tags:bg-background transition-colors">
            <Eye className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Show Tags</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProblemsClient({ 
  problems, 
  hideHeader = false,
  solvedProblemIds = new Set(),
  settings = { sound_enabled: true, hide_unsolved_tags: false }
}: { 
  problems: Problem[]
  hideHeader?: boolean
  solvedProblemIds?: Set<string>
  settings?: { sound_enabled: boolean, hide_unsolved_tags?: boolean }
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    problems.forEach(p => {
      if (p.tags) p.tags.forEach(t => tags.add(t))
      // Also add fallback tags to the selector so users can still filter by them
      getFallbackTags(p.requirements, 5).forEach(t => tags.add(t))
    })
    return Array.from(tags).sort()
  }, [problems])

  // Filter problems by tags
  const filteredProblems = useMemo(() => {
    if (selectedTags.length === 0) return problems
    return problems.filter(p => {
      const pTags = [...(p.tags || []), ...getFallbackTags(p.requirements, 5)]
      return selectedTags.every(st => pTags.includes(st))
    })
  }, [problems, selectedTags])

  // Group by dominant skill
  const grouped = useMemo(() => {
    const g: Record<string, Problem[]> = {}
    for (const p of filteredProblems) {
      const key = getDominantSkill(p.requirements)
      if (!g[key]) g[key] = []
      g[key].push(p)
    }
    return g
  }, [filteredProblems])

  // Always show Uncategorized last
  const sortedGroups = useMemo(() => {
    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1
      if (b === 'Uncategorized') return -1
      return a.localeCompare(b)
    })
  }, [grouped])

  return (
    <div className="h-full">
      <div className="min-h-full p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Page Header */}
      {!hideHeader && (
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1 font-mono tracking-tight">Problem Catalog</h1>
            <p className="text-muted-foreground font-medium">
              {filteredProblems.length} {filteredProblems.length === 1 ? 'problem' : 'problems'} available · Select one to open the IDE
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground font-mono bg-secondary/50 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg shadow-sm">
                {Object.keys(grouped).length} categories
              </span>
            </div>
          </div>
        </motion.header>
      )}

      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-4">
          <TagSelector 
            allTags={allTags} 
            selectedTags={selectedTags} 
            onChange={setSelectedTags} 
          />
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredProblems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
            <FilterX className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2 font-mono">No problems match your filters</h3>
          <p className="text-muted-foreground font-mono text-sm max-w-xs mx-auto">
            Try removing some tags or clearing all filters to see more problems.
          </p>
          <button 
            onClick={() => setSelectedTags([])}
            className="mt-6 text-sm font-bold text-blue-500 hover:text-blue-600 font-mono underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Sections */}
      {sortedGroups.map(([skill, groupProblems]) => (
        <section key={skill} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <h2 className="text-lg font-semibold text-foreground capitalize font-mono tracking-wide">
                {sectionLabel(skill)}
              </h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground font-mono">
              {groupProblems.length} {groupProblems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {groupProblems.map((problem) => {
              const displayTags = problem.tags && problem.tags.length > 0 
                ? problem.tags.slice(0, 3) 
                : getFallbackTags(problem.requirements)
              const diff = problem.difficulty || 'Unrated'
              const cfg = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG.Unrated
              const isSolved = solvedProblemIds.has(problem.id)

              return (
                <motion.div 
                  key={problem.id} 
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "50px" }}
                >
                  <Link
                    href={`/dashboard/problems/${problem.id}`}
                    className="group flex flex-col justify-between h-[180px] bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-secondary/20 hover:-translate-y-[2px] transition-all duration-300 cursor-pointer overflow-hidden relative shadow-sm hover:shadow-md"
                  >
                    {/* Top row: Title and Badge */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[15px] font-semibold text-foreground line-clamp-2 font-mono leading-relaxed group-hover:text-blue-500 transition-colors">
                          {problem.title}
                        </h3>
                        {isSolved && (
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Solved</span>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 uppercase tracking-widest",
                        cfg.badge,
                        cfg.shadow
                      )}>
                        {diff}
                      </span>
                    </div>

                    {/* Bottom row: Tags and Solve button */}
                    <div className="flex items-end justify-between mt-auto gap-2">
                      <TagGroup 
                        tags={displayTags} 
                        isSolved={isSolved} 
                        hideTagsSetting={!!settings.hide_unsolved_tags} 
                      />
                      
                      {/* Premium Solve CTA */}
                      <span className="px-3.5 py-2 rounded-xl text-[11px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center uppercase tracking-widest shrink-0">
                        {isSolved ? 'Review' : 'Solve'}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </section>
      ))}
      </div>
    </div>
  )
}
