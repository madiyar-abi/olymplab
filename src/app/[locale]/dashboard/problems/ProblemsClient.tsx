"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowRight, FilterX, Eye, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagSelector } from './TagSelector'
import { createClient } from '@/lib/supabase/client'
import { ViewToggle, ViewMode } from '@/components/ViewToggle'
import { ProblemTable } from '@/components/ProblemTable'
import { EmptyState } from '@/components/ui/EmptyState'

type Requirements = Record<string, { level: number; weight: number }>

const DIFFICULTY_CONFIG: Record<string, { badge: string; shadow: string }> = {
  Easy:    { badge: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', shadow: '' },
  Medium:  { badge: 'text-amber-500 bg-amber-500/10 border-amber-500/20', shadow: '' },
  Hard:    { badge: 'text-red-500 bg-red-500/10 border-red-500/20', shadow: '' },
  Mastery: { badge: 'text-purple-500 bg-purple-500/10 border-purple-500/20', shadow: '' },
  Unrated: { badge: 'text-zinc-400 bg-white/5 border-border', shadow: '' },
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
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
  problemId: string
  userId?: string
  isInitiallyRevealed: boolean
}

function TagGroup({ tags, isSolved, hideTagsSetting, problemId, userId, isInitiallyRevealed }: TagGroupProps) {
  const t = useTranslations('Problems')
  const [revealed, setRevealed] = useState(isInitiallyRevealed)
  const supabase = createClient()
  const shouldHide = hideTagsSetting && !isSolved && !revealed

  if (tags.length === 0) {
    return <span className="text-gray-500 dark:text-gray-400/60 text-[10px] font-mono">{t('unrated')}</span>
  }

  const handleReveal = async (e: React.MouseEvent) => {
    if (shouldHide) {
      e.preventDefault()
      e.stopPropagation()
      setRevealed(true)
      if (userId) {
        // @ts-expect-error - Supabase generated types don't have revealed_problems yet
        await supabase.from('revealed_problems').insert({ user_id: userId, problem_id: problemId })
      }
    }
  }

  return (
    <div 
      className="flex flex-wrap gap-1.5 relative group/tags"
      onClick={handleReveal}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className={cn(
            "bg-secondary text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-md text-[9px] font-semibold border border-border uppercase tracking-wider transition-all duration-500",
            shouldHide && "blur-[4px] select-none opacity-40 group-hover/tags:opacity-60"
          )}
        >
          {tag}
        </span>
      ))}
      {shouldHide && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm group-hover/tags:bg-background transition-colors">
            <Eye className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
            <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{t('showTags')}</span>
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
  revealedProblemIds = new Set(),
  settings: initialSettings = { sound_enabled: true, hide_unsolved_tags: false },
  userId,
  initialView = 'grid'
}: {
  problems: Problem[]
  hideHeader?: boolean
  solvedProblemIds?: Set<string>
  revealedProblemIds?: Set<string>
  settings?: { sound_enabled: boolean, hide_unsolved_tags?: boolean }
  userId?: string
  initialView?: ViewMode
}) {
  const t = useTranslations('Problems')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [hideUnsolved, setHideUnsolved] = useState(!!initialSettings.hide_unsolved_tags)
  const [view, setView] = useState<ViewMode>(initialView)

  // Re-sync local spoiler state when the server sends a new value (e.g. after
  // router.refresh()) using the render-time pattern instead of an effect.
  const [prevSetting, setPrevSetting] = useState(initialSettings.hide_unsolved_tags)
  if (initialSettings.hide_unsolved_tags !== prevSetting) {
    setPrevSetting(initialSettings.hide_unsolved_tags)
    setHideUnsolved(!!initialSettings.hide_unsolved_tags)
  }

  const handleViewChange = (newView: ViewMode) => {
    setView(newView)
    document.cookie = `problems-view=${newView}; path=/; max-age=31536000`
  }

  const supabase = createClient()

  const router = useRouter()
  const handleToggleSpoiler = async () => {
    const newValue = !hideUnsolved
    setHideUnsolved(newValue)
    
    // Persist to Supabase if userId is provided
    if (userId) {
      await supabase.from('profiles')
        // @ts-expect-error - Supabase generated types for JSON can be finicky
        .update({ 
          settings: { 
            ...initialSettings, 
            hide_unsolved_tags: newValue 
          } 
        })
        .eq('id', userId)
      
      router.refresh()
    }
  }

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
      <div className="min-h-full px-8 pt-14 pb-12 w-full flex flex-col gap-10">
      {/* Page Header */}
      {!hideHeader && (
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1 font-mono tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground font-medium">
              {t('available', { count: filteredProblems.length })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground font-mono bg-secondary/50 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg shadow-sm">
                {t('categories', { count: Object.keys(grouped).length })}
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
        <div className="flex flex-wrap items-center gap-4">
          <TagSelector 
            allTags={allTags} 
            selectedTags={selectedTags} 
            onChange={setSelectedTags} 
          />

          <ViewToggle view={view} onChange={handleViewChange} />

          <div 
            onClick={handleToggleSpoiler}
            className="flex items-center gap-3 px-4 py-2.5 bg-secondary/50 hover:bg-secondary/80 rounded-xl border border-border transition-all cursor-pointer group"
          >
            <Flag className={cn(
              "w-4 h-4 transition-all", 
              hideUnsolved ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
            )} />
            <span className="text-[11px] font-bold font-mono text-foreground uppercase tracking-tight">
              {t('spoilerProtection')}
            </span>
            <div
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                hideUnsolved ? "bg-amber-500" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-background transition-transform",
                  hideUnsolved ? "translate-x-5" : "translate-x-1"
                )}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredProblems.length === 0 && (
        <EmptyState
          title={t('noMatchTitle')}
          description={t('noMatchDesc')}
          icon={FilterX}
          ctaText={t('clearFilters')}
          onCtaClick={() => setSelectedTags([])}
          className="min-h-[40vh] py-12"
        />
      )}

      {/* Sections */}
      {sortedGroups.map(([skill, groupProblems]) => (
        <section key={skill} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-foreground capitalize font-mono tracking-wide">
                {skill === 'Uncategorized'
                  ? t('allProblems')
                  : t.has(`skills.${skill}`)
                    ? t(`skills.${skill}`)
                    : sectionLabel(skill)}
              </h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground font-mono">
              {t('count', { count: groupProblems.length })}
            </span>
          </div>

          {view === 'grid' ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "50px" }}
            >
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
                  >
                    <Link
                      href={`/dashboard/problems/${problem.id}`}
                      className="group flex flex-col items-center text-center justify-center h-[240px] bg-card border border-border rounded-2xl p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/50 shadow-sm hover:shadow-xl cursor-pointer overflow-hidden relative"
                    >
                      {/* Badge Centered at Top */}
                      <span className={cn(
                        "text-[9px] font-bold px-3 py-1 rounded-full border uppercase tracking-[0.2em] mb-4",
                        cfg.badge,
                        cfg.shadow
                      )}>
                        {t.has(`difficulty.${diff}`) ? t(`difficulty.${diff}`) : diff}
                      </span>

                      <div className="flex flex-col items-center gap-2 mb-4">
                        <h3 className="text-lg font-bold text-foreground line-clamp-2 font-mono tracking-tight group-hover:text-primary transition-colors">
                          {problem.title}
                        </h3>
                        {isSolved && (
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">{t('solved')}</span>
                        )}
                      </div>

                      <div className="mb-6">
                        <TagGroup 
                          tags={displayTags} 
                          isSolved={isSolved} 
                          hideTagsSetting={hideUnsolved} 
                          problemId={problem.id}
                          userId={userId}
                          isInitiallyRevealed={revealedProblemIds.has(problem.id)}
                        />
                      </div>
                      
                      {/* Solve Button Centered at Bottom */}
                      <div className="px-6 py-2.5 rounded-xl font-sans text-xs font-bold tracking-widest border border-border bg-foreground text-background hover:bg-primary hover:border-primary hover:text-white transition-all flex items-center gap-2 uppercase">
                        {isSolved ? t('review') : t('solveNow')}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProblemTable 
                problems={groupProblems} 
                solvedProblemIds={solvedProblemIds}
                revealedProblemIds={revealedProblemIds}
                hideTagsSetting={hideUnsolved}
                userId={userId}
              />
            </div>
          )}
        </section>
      ))}
      </div>
    </div>
  )
}
