"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { 
  ArrowRight, 
  FilterX, 
  Eye, 
  Flag, 
  Search, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  GitBranch, 
  Database, 
  ArrowUpDown, 
  Zap, 
  Puzzle, 
  Binary, 
  Shapes, 
  Code2 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagSelector } from './TagSelector'
import { createClient } from '@/lib/supabase/client'
import { ViewToggle, ViewMode } from '@/components/ViewToggle'
import { ProblemTable } from '@/components/ProblemTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { getSpoilerPlaceholderTags } from '@/lib/spoilerTags'

type Requirements = Record<string, { level: number; weight: number }>

const DIFFICULTY_CONFIG: Record<string, { badge: string; shadow: string }> = {
  Easy:    { badge: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', shadow: '' },
  Medium:  { badge: 'text-amber-500 bg-amber-500/10 border-amber-500/20', shadow: '' },
  Hard:    { badge: 'text-red-500 bg-red-500/10 border-red-500/20', shadow: '' },
  Mastery: { badge: 'text-purple-500 bg-purple-500/10 border-purple-500/20', shadow: '' },
  Unrated: { badge: 'text-zinc-400 bg-white/5 border-border', shadow: '' },
}

export type CategoryKey = 
  | 'dynamic_programming'
  | 'graphs_trees'
  | 'data_structures'
  | 'searching_sorting'
  | 'greedy'
  | 'constructive_logic'
  | 'math_number_theory'
  | 'strings_geometry'
  | 'implementation'

export const CATEGORY_ORDER: CategoryKey[] = [
  'dynamic_programming',
  'graphs_trees',
  'data_structures',
  'searching_sorting',
  'greedy',
  'constructive_logic',
  'math_number_theory',
  'strings_geometry',
  'implementation',
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  all: Layers,
  dynamic_programming: Cpu,
  graphs_trees: GitBranch,
  data_structures: Database,
  searching_sorting: ArrowUpDown,
  greedy: Zap,
  constructive_logic: Puzzle,
  math_number_theory: Binary,
  strings_geometry: Shapes,
  implementation: Code2,
}

export function getProblemCategory(p: { tags?: string[]; title?: string; requirements?: Requirements }): CategoryKey {
  const tags = (p.tags || []).map(t => t.toLowerCase())
  const title = (p.title || '').toLowerCase()
  const req = p.requirements || {}

  // 1. Dynamic Programming
  if (
    tags.some(t => t === 'dp' || t.includes('dynamic')) ||
    title.includes('coin combination') || title.includes('dice combination') ||
    title.includes('grid paths') || title.includes('book shop') ||
    title.includes('array description') || title.includes('edit distance') ||
    title.includes('rectangle cutting') || title.includes('money sums') ||
    title.includes('removal game') || title.includes('two sets ii') ||
    title.includes('projects') || title.includes('elevator rides') ||
    title.includes('counting tilings')
  ) {
    return 'dynamic_programming'
  }

  // 2. Graphs & Trees
  if (
    tags.some(t => t.includes('graph') || t.includes('tree') || t.includes('dfs') || t.includes('bfs') || t.includes('shortest path') || t.includes('flow') || t.includes('dijkstra')) ||
    title.includes('counting rooms') || title.includes('labyrinth') ||
    title.includes('building roads') || title.includes('message route') ||
    title.includes('building teams') || title.includes('round trip') ||
    title.includes('monsters') || title.includes('shortest routes') ||
    title.includes('high score') || title.includes('flight discount') ||
    title.includes('cycle finding') || title.includes('course schedule') ||
    title.includes('road reparation') || title.includes('road construction') ||
    title.includes('subordinates') || title.includes('tree matching') ||
    title.includes('tree diameter') || title.includes('tree distances') ||
    title.includes('company queries') || title.includes('distance queries') ||
    (req.graphs && req.graphs.weight > 0)
  ) {
    return 'graphs_trees'
  }

  // 3. Data Structures
  if (
    tags.some(t => t.includes('data structure') || t.includes('dsu') || t.includes('segment tree') || t.includes('fenwick') || t.includes('heap') || t.includes('stack') || t.includes('queue') || t.includes('priority')) ||
    title.includes('static range') || title.includes('dynamic range') ||
    title.includes('range xor') || title.includes('range update') ||
    title.includes('forest queries') || title.includes('hotel queries') ||
    title.includes('list removals') || title.includes('salary queries') ||
    title.includes('prefix sum') || title.includes('polynomial queries') ||
    (req.data_structures && req.data_structures.weight > 0)
  ) {
    return 'data_structures'
  }

  // 4. Searching & Sorting
  if (
    tags.some(t => t.includes('sort') || t.includes('binary search') || t.includes('two pointer') || t.includes('divide and conquer') || t.includes('ternary search')) ||
    title.includes('distinct numbers') || title.includes('apartments') ||
    title.includes('concert tickets') || title.includes('sum of two values') ||
    title.includes('sum of three values') || title.includes('sum of four values') ||
    title.includes('nearest smaller') || title.includes('subarray sums') ||
    title.includes('subarray divisibility') || title.includes('subarray distinct') ||
    title.includes('array division') || title.includes('sliding median') ||
    title.includes('sliding cost') || title.includes('movie festival ii') ||
    title.includes('maximum subarray sum') || title.includes('missing coin sum') ||
    title.includes('collecting numbers') || title.includes('playlist') ||
    title.includes('binary search')
  ) {
    return 'searching_sorting'
  }

  // 5. Greedy Algorithms
  if (
    tags.some(t => t.includes('greedy')) ||
    title.includes('movie festival') || title.includes('ferris wheel') ||
    title.includes('restaurant customers') || title.includes('towers') ||
    title.includes('traffic lights') || title.includes('room allocation') ||
    title.includes('tasks and deadlines') || title.includes('reading books')
  ) {
    return 'greedy'
  }

  // 6. Mathematics & Number Theory
  if (
    tags.some(t => t.includes('math') || t.includes('number theory') || t.includes('matrices') || t.includes('prime') || t.includes('combinatorics') || t.includes('probabilities')) ||
    title.includes('josephus') || title.includes('exponentiation') ||
    title.includes('counting divisors') || title.includes('common divisors') ||
    title.includes('sum of divisors') || title.includes('prime multiples') ||
    title.includes('counting coprimes') || title.includes('binomial coefficients') ||
    title.includes('creating strings ii') || title.includes('distributing apples') ||
    title.includes('christmas party') || title.includes('bracket sequences') ||
    title.includes('t-primes') ||
    (req.math && req.math.weight > 0)
  ) {
    return 'math_number_theory'
  }

  // 7. Strings & Geometry
  if (
    tags.some(t => t.includes('string') || t.includes('geometry') || t.includes('hashing')) ||
    title.includes('point location') || title.includes('line segment') ||
    title.includes('polygon area') || title.includes('point in polygon') ||
    title.includes('word combinations') || title.includes('string matching') ||
    title.includes('finding borders') || title.includes('finding periods') ||
    title.includes('minimal rotation') || title.includes('longest palindrome') ||
    title.includes('required substring') || title.includes('palindrome queries')
  ) {
    return 'strings_geometry'
  }

  // 8. Constructive & Logic
  if (
    tags.some(t => t.includes('constructive') || t.includes('game') || t.includes('bitmask') || t.includes('bit') || t.includes('interactive')) ||
    title.includes('bit strings') || title.includes('gray code') ||
    title.includes('nim game') || title.includes('game of stones') ||
    title.includes('weird algorithm') || title.includes('two sets') ||
    title.includes('palindrome reorder') || title.includes('tower of hanoi') ||
    (req.logic && req.logic.weight > 0)
  ) {
    return 'constructive_logic'
  }

  // 9. Implementation & Basics
  return 'implementation'
}

function getCategoryLabel(t: ReturnType<typeof useTranslations<'Problems'>>, catKey: string): string {
  try {
    if (t.has(`categoryLabels.${catKey}`)) {
      return t(`categoryLabels.${catKey}`)
    }
  } catch {
    // fallback if key not found
  }
  return catKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getFallbackTags(req: Requirements | null | undefined, n = 3): string[] {
  if (!req) return []
  return Object.entries(req)
    .filter(([, { weight }]) => weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, n)
    .map(([skill]) => skill.replace('_', ' '))
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
  title_ru?: string | null
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

  const displayTags = shouldHide ? getSpoilerPlaceholderTags(problemId) : tags

  return (
    <div 
      className="flex flex-wrap gap-1.5 relative group/tags"
      onClick={handleReveal}
    >
      {displayTags.map((tag, idx) => (
        <span
          key={shouldHide ? `spoiler-${problemId}-${idx}` : tag}
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

function setCookie(name: string, value: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
  }
}

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
  const locale = useLocale()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(initialBookmarkedIds)
  const [hideUnsolved, setHideUnsolved] = useState(!!initialSettings.hide_unsolved_tags)
  const [view, setView] = useState<ViewMode>(initialView)

  const handleViewChange = async (newView: ViewMode) => {
    setView(newView)
    setCookie('problems-view', newView)
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problems_view: newView }),
      })
    } catch (e) {
      console.error('Failed to sync view preference:', e)
    }
  }

  const supabase = createClient()

  const handleToggleSpoiler = async () => {
    const newValue = !hideUnsolved
    setHideUnsolved(newValue)
    setCookie('hide-unsolved-tags', String(newValue))
    
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hide_unsolved_tags: newValue }),
      })
    } catch (e) {
      console.error('Failed to sync spoiler preference:', e)
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

  // Group problems by algorithmic category
  const grouped = useMemo(() => {
    const g: Record<string, Problem[]> = {}
    for (const p of filteredProblems) {
      const key = getProblemCategory(p)
      if (!g[key]) g[key] = []
      g[key].push(p)
    }
    return g
  }, [filteredProblems])

  // Count problems per category (based on current non-category filters: tags, search, status, rating)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filteredProblems.length }
    for (const key of CATEGORY_ORDER) {
      counts[key] = (grouped[key] || []).length
    }
    return counts
  }, [filteredProblems.length, grouped])

  // Canonically sorted groups
  const sortedGroups = useMemo(() => {
    return CATEGORY_ORDER
      .filter(key => grouped[key] && grouped[key].length > 0)
      .map(key => [key, grouped[key]] as [string, Problem[]])
  }, [grouped])

  // Displayed groups (either all, or just the selected category)
  const displayedGroups = useMemo(() => {
    if (selectedCategory === 'all') return sortedGroups
    return sortedGroups.filter(([key]) => key === selectedCategory)
  }, [sortedGroups, selectedCategory])

  const clearAllFilters = () => {
    setSelectedTags([])
    setSearchQuery('')
    setStatusFilter('all')
    setRatingFilter('all')
    setSelectedCategory('all')
  }

  const hasActiveFilters = selectedTags.length > 0 || searchQuery.trim() !== '' || statusFilter !== 'all' || ratingFilter !== 'all' || selectedCategory !== 'all'

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
                {t('categories', { count: CATEGORY_ORDER.length })}
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

      {/* Category Navigation Tabs Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              {t('allCategories')}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
              {CATEGORY_ORDER.length}
            </span>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] font-mono font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('showAll')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
          {/* "All" Category Pill */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 select-none",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25 font-bold"
                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
            )}
          >
            <Layers className={cn(
              "w-3.5 h-3.5 transition-transform group-hover:scale-110",
              selectedCategory === 'all' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span>{t('categoryLabels.all')}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors",
              selectedCategory === 'all'
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-background/80 text-muted-foreground border border-border/60 group-hover:text-foreground"
            )}>
              {filteredProblems.length}
            </span>
          </button>

          {/* Individual Category Pills */}
          {CATEGORY_ORDER.map((catKey) => {
            const IconComponent = CATEGORY_ICONS[catKey] || Layers
            const isSelected = selectedCategory === catKey
            const count = categoryCounts[catKey] || 0
            const label = getCategoryLabel(t, catKey)

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={cn(
                  "group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25 font-bold"
                    : count === 0
                      ? "bg-secondary/30 text-muted-foreground/40 border-border/40 hover:bg-secondary/50 hover:text-muted-foreground"
                      : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-border/80"
                )}
              >
                <IconComponent className={cn(
                  "w-3.5 h-3.5 transition-transform group-hover:scale-110",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span>{label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : count === 0
                      ? "bg-transparent text-muted-foreground/40"
                      : "bg-background/80 text-muted-foreground border border-border/60 group-hover:text-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Category Quick Focus Indicator */}
      {selectedCategory !== 'all' && displayedGroups.length > 0 && (
        <div className="flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl px-5 py-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-muted-foreground">{t('viewingCategory')}:</span>
            <span className="inline-flex items-center gap-2 font-bold text-foreground bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl text-primary">
              {(() => {
                const IconComponent = CATEGORY_ICONS[selectedCategory] || Layers
                return <IconComponent className="w-3.5 h-3.5" />
              })()}
              {getCategoryLabel(t, selectedCategory)}
            </span>
            <span className="text-muted-foreground font-semibold">
              ({displayedGroups[0]?.[1]?.length || 0})
            </span>
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-xs font-mono font-semibold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{t('showAll')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {displayedGroups.length === 0 && (
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
      {displayedGroups.map(([skill, groupProblems]) => {
        const SectionIcon = CATEGORY_ICONS[skill] || Layers
        return (
          <section key={skill} id={`category-${skill}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/80 border border-border text-foreground shadow-sm">
                  <SectionIcon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-foreground">
                  {getCategoryLabel(t, skill)}
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-semibold">
                  {groupProblems.length}
                </span>
              </div>

              {selectedCategory === 'all' && (
                <button
                  onClick={() => setSelectedCategory(skill)}
                  className="group text-xs font-mono text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border cursor-pointer"
                  title={t('focusCategory')}
                >
                  <span>{t('focusCategory')}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
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
                          {(locale === 'ru' && problem.title_ru) ? problem.title_ru : problem.title}
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
        )
      })}
      </div>
    </div>
  )
}
