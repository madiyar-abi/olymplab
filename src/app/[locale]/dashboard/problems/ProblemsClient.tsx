"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ArrowRight, FilterX, Eye, Flag, Search, CheckCircle2 } from 'lucide-react'
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

function getDominantSkill(req: Requirements | null | undefined): string {
  if (!req) return 'Uncategorized'
  let best = ''
  let max = 0
  for (const [skill, { weight }] of Object.entries(req)) {
    if (weight > max) { max = weight; best = skill }
  }
  return max > 0 ? best : 'Uncategorized'
}

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
      staggerChildren: 0.04
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } }
}

export interface Problem {
  id: string
  title: string
  difficulty: string
  requirements: Requirements
  tags?: string[]
  rating?: number | null
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
            "bg-secondary text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-md text-[9px] font-semibold border border-border uppercase tracking-wider transition-all duration-300",
            shouldHide && "blur-[4px] select-none opacity-40 group-hover/tags:opacity-60 cursor-pointer"
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

type StatusFilter = 'all' | 'unsolved' | 'solved' | 'bookmarked'
type RatingFilter = 'all' | '<1200' | '1200-1600' | '1600-2000' | '2000+'

export function ProblemsClient({ 
  problems, 
  hideHeader = false,
  solvedProblemIds = new Set(),
  revealedProblemIds = new Set(),
  initialBookmarkedIds = new Set(),
  settings: initialSettings = { sound_enabled: true, hide_unsolved_tags: false },
  userId,
  initialView = 'grid'
}: {
  problems: Problem[]
  hideHeader?: boolean
  solvedProblemIds?: Set<string>
  revealedProblemIds?: Set<string>
  initialBookmarkedIds?: Set<string>
  settings?: { sound_enabled: boolean, hide_unsolved_tags?: boolean }
  userId?: string
  initialView?: ViewMode
}) {
  const t = useTranslations('Problems')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(initialBookmarkedIds)
  const [hideUnsolved, setHideUnsolved] = useState(!!initialSettings.hide_unsolved_tags)
  const [view, setView] = useState<ViewMode>(initialView)

  const handleViewChange = (newView: ViewMode) => {
    setView(newView)
    document.cookie = `problems-view=${newView}; path=/; max-age=31536000`
  }

  const supabase = createClient()
  const router = useRouter()

  const handleToggleSpoiler = async () => {
    const newValue = !hideUnsolved
    setHideUnsolved(newValue)
    
    if (userId) {
      await supabase.from('profiles')
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

  const handleToggleBookmark = async (e: React.MouseEvent, problemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const isCurrentlyBookmarked = bookmarkedIds.has(problemId)
    const next = new Set(bookmarkedIds)
    if (isCurrentlyBookmarked) {
      next.delete(problemId)
    } else {
      next.add(problemId)
    }
    setBookmarkedIds(next)

    if (userId) {
      if (isCurrentlyBookmarked) {
        await supabase.from('user_bookmarks').delete().eq('user_id', userId).eq('problem_id', problemId)
      } else {
        await supabase.from('user_bookmarks').insert({ user_id: userId, problem_id: problemId })
      }
    }
  }

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    problems.forEach(p => {
      if (p.tags) p.tags.forEach(tag => tags.add(tag))
      getFallbackTags(p.requirements, 5).forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [problems])

  // Filter problems by tags, search query, status, and rating
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      // 1. Tag filter
      if (selectedTags.length > 0) {
        const pTags = [...(p.tags || []), ...getFallbackTags(p.requirements, 5)]
        const matchesTags = selectedTags.every(st => pTags.includes(st))
        if (!matchesTags) return false
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = p.title.toLowerCase().includes(q)
        const matchesTag = (p.tags || []).some(t => t.toLowerCase().includes(q))
        if (!matchesTitle && !matchesTag) return false
      }

      // 3. Status filter
      const isSolved = solvedProblemIds.has(p.id)
      const isBookmarked = bookmarkedIds.has(p.id)
      if (statusFilter === 'solved' && !isSolved) return false
      if (statusFilter === 'unsolved' && isSolved) return false
      if (statusFilter === 'bookmarked' && !isBookmarked) return false

      // 4. Rating filter
      if (ratingFilter !== 'all') {
        const r = p.rating ?? 0
        if (ratingFilter === '<1200' && (r === 0 || r >= 1200)) return false
        if (ratingFilter === '1200-1600' && (r < 1200 || r > 1600)) return false
        if (ratingFilter === '1600-2000' && (r < 1600 || r > 2000)) return false
        if (ratingFilter === '2000+' && r < 2000) return false
      }

      return true
    })
  }, [problems, selectedTags, searchQuery, statusFilter, ratingFilter, solvedProblemIds, bookmarkedIds])

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

  const clearAllFilters = () => {
    setSelectedTags([])
    setSearchQuery('')
    setStatusFilter('all')
    setRatingFilter('all')
  }

  const hasActiveFilters = selectedTags.length > 0 || searchQuery.trim() !== '' || statusFilter !== 'all' || ratingFilter !== 'all'

  return (
    <div className="h-full">
      <div className="min-h-full px-8 pt-14 pb-12 w-full flex flex-col gap-8">
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

      {/* Modern Filter Suite */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4 bg-card/60 backdrop-blur-sm p-4 rounded-2xl border border-border"
      >
        {/* Row 1: Search bar, tag selector, view toggle, spoiler button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by name or tag…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/60 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono transition-colors"
            />
          </div>

          <TagSelector 
            allTags={allTags} 
            selectedTags={selectedTags} 
            onChange={setSelectedTags} 
          />

          <ViewToggle view={view} onChange={handleViewChange} />

          <div 
            onClick={handleToggleSpoiler}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-secondary/50 hover:bg-secondary/80 rounded-xl border border-border transition-all cursor-pointer select-none"
            title="Blur tags and rating on unsolved problems"
          >
            <Flag className={cn(
              "w-3.5 h-3.5 transition-all", 
              hideUnsolved ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
            )} />
            <span className="text-[11px] font-bold font-mono text-foreground uppercase tracking-tight">
              {t('spoilerProtection')}
            </span>
            <div
              className={cn(
                "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                hideUnsolved ? "bg-amber-500" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-2.5 w-2.5 transform rounded-full bg-background transition-transform",
                  hideUnsolved ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Status Pills & Rating Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs font-mono">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase font-bold mr-1">Status:</span>
            {(['all', 'unsolved', 'solved', 'bookmarked'] as StatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all capitalize',
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Rating Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase font-bold mr-1">Rating:</span>
            {(['all', '<1200', '1200-1600', '1600-2000', '2000+'] as RatingFilter[]).map((rf) => (
              <button
                key={rf}
                onClick={() => setRatingFilter(rf)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all',
                  ratingFilter === rf
                    ? 'bg-amber-400 text-black border-amber-400'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                )}
              >
                {rf}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-primary hover:underline ml-2"
              >
                Reset
              </button>
            )}
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
          onCtaClick={clearAllFilters}
          className="min-h-[40vh] py-12"
        />
      )}

      {/* Sections */}
      {sortedGroups.map(([skill, groupProblems]) => (
        <section key={skill} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono tracking-tight text-foreground">
                {sectionLabel(skill)}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-semibold">
                {groupProblems.length}
              </span>
            </div>
          </div>

          {/* Cards Grid or Table */}
          {view === 'grid' ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                const isBookmarked = bookmarkedIds.has(problem.id)

                return (
                  <motion.div 
                    key={problem.id} 
                    variants={itemVariants}
                  >
                    <Link
                      href={`/dashboard/problems/${problem.id}`}
                      className="group flex flex-col items-center text-center justify-between h-[250px] bg-card border border-border rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/50 shadow-sm hover:shadow-xl cursor-pointer overflow-hidden relative"
                    >
                      {/* Top Badges & Bookmark */}
                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider",
                            cfg.badge,
                            cfg.shadow
                          )}>
                            {t.has(`difficulty.${diff}`) ? t(`difficulty.${diff}`) : diff}
                          </span>
                          {problem.rating && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300">
                              ★ {problem.rating}
                            </span>
                          )}
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleBookmark(e, problem.id)}
                          className={cn(
                            "p-1.5 rounded-lg border border-transparent hover:border-border transition-colors",
                            isBookmarked ? "text-amber-400" : "text-muted-foreground/40 hover:text-amber-400"
                          )}
                          title={isBookmarked ? "Remove bookmark" : "Bookmark problem"}
                        >
                          <Flag className={cn("w-3.5 h-3.5", isBookmarked && "fill-amber-400")} />
                        </button>
                      </div>

                      {/* Problem Title & Solved badge */}
                      <div className="flex flex-col items-center gap-1.5 my-auto px-2">
                        <h3 className="text-base font-bold text-foreground line-clamp-2 font-mono tracking-tight group-hover:text-primary transition-colors">
                          {problem.title}
                        </h3>
                        {isSolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('solved')}
                          </span>
                        )}
                      </div>

                      {/* Tags & Action Button */}
                      <div className="w-full flex flex-col items-center gap-3">
                        <TagGroup 
                          tags={displayTags} 
                          isSolved={isSolved} 
                          hideTagsSetting={hideUnsolved} 
                          problemId={problem.id}
                          userId={userId}
                          isInitiallyRevealed={revealedProblemIds.has(problem.id)}
                        />

                        <div className="w-full py-2 rounded-xl font-mono text-[11px] font-bold tracking-wider border border-border bg-secondary/80 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all flex items-center justify-center gap-2 uppercase">
                          <span>{isSolved ? t('review') : t('solveNow')}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
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
                bookmarkedProblemIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
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
