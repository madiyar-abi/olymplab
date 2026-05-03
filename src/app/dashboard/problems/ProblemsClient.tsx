"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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

// Top tags to show on a card
function topTags(req: Requirements | null | undefined, n = 3): string[] {
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
    transition: { staggerChildren: 0.1 }
  }
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
}

export function ProblemsClient({ problems, hideHeader = false }: { problems: Problem[], hideHeader?: boolean }) {
  // Group by dominant skill
  const grouped: Record<string, Problem[]> = {}
  for (const p of problems) {
    const key = getDominantSkill(p.requirements)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  }

  // Always show Uncategorized last
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="h-full">
      <div className="min-h-full p-8 max-w-7xl mx-auto w-full flex flex-col gap-10">
      {/* Page Header */}
      {!hideHeader && (
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 font-mono tracking-tight">Problem Catalog</h1>
            <p className="text-muted-foreground font-medium">
              {problems.length} problems available · Select one to open the IDE
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground font-mono bg-secondary/50 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg shadow-sm">
              {Object.keys(grouped).length} categories
            </span>
          </div>
        </motion.header>
      )}

      {/* Sections */}
      {sortedGroups.map(([skill, groupProblems]) => (
        <section key={skill}>
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
              const tags = topTags(problem.requirements)
              const diff = problem.difficulty || 'Unrated'
              const cfg = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG.Unrated

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
                      <h3 className="text-[15px] font-semibold text-foreground line-clamp-2 font-mono leading-relaxed group-hover:text-blue-500 transition-colors">
                        {problem.title}
                      </h3>
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
                      <div className="flex flex-wrap gap-1.5">
                        {tags.length > 0 ? tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-secondary text-muted-foreground px-2.5 py-1 rounded-md text-[9px] font-semibold border border-border uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        )) : (
                          <span className="text-muted-foreground/60 text-[10px] font-mono">Unrated problem</span>
                        )}
                      </div>
                      
                      {/* Premium Solve CTA */}
                      <span className="px-3.5 py-2 rounded-xl text-[11px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 flex items-center uppercase tracking-widest shrink-0">
                        Solve
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
