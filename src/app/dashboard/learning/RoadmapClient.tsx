"use client"

import { motion } from 'framer-motion'
import { BookOpen, Code2, ArrowRight, Terminal, Sprout, Zap, Flame, Rocket, Crown, Library, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface RoadmapTopic {
  id: string
  title: string
  stage: string
  level: string
  order_index: number
  prerequisites: string[]
  article_url: string | null
}

const STAGE_CONFIG: Record<string, { badge: string; icon: React.ReactNode; lineColor: string; dotColor: string }> = {
  'Начальный': {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <Sprout className="w-4 h-4" />,
    lineColor: 'bg-emerald-500/30',
    dotColor: 'bg-emerald-400 shadow-emerald-400/60',
  },
  'Базовый': {
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: <Zap className="w-4 h-4" />,
    lineColor: 'bg-sky-500/30',
    dotColor: 'bg-sky-400 shadow-sky-400/60',
  },
  'Средний': {
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    icon: <Flame className="w-4 h-4" />,
    lineColor: 'bg-violet-500/30',
    dotColor: 'bg-violet-400 shadow-violet-400/60',
  },
  'Продвинутый': {
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    icon: <Rocket className="w-4 h-4" />,
    lineColor: 'bg-orange-500/30',
    dotColor: 'bg-orange-400 shadow-orange-400/60',
  },
  'Мастер': {
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: <Crown className="w-4 h-4" />,
    lineColor: 'bg-red-500/30',
    dotColor: 'bg-red-400 shadow-red-400/60',
  },
}

const STAGE_ORDER = ['Начальный', 'Базовый', 'Средний', 'Продвинутый', 'Мастер']

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
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const,
      stiffness: 120,
      damping: 20
    }
  }
}

export function RoadmapClient({ 
  topics, 
  mastery = {} 
}: { 
  topics: RoadmapTopic[], 
  mastery?: Record<string, { total: number; solved: number }> 
}) {
  const grouped: Record<string, RoadmapTopic[]> = {}
  STAGE_ORDER.forEach(s => { grouped[s] = [] })

  topics.forEach((t) => {
    if (grouped[t.stage]) grouped[t.stage].push(t)
  })

  let globalNum = 0

  return (
    <div className="max-w-3xl mx-auto px-8 py-8 pb-24">
      {/* Empty state */}
      {topics.length === 0 && (
        <div className="text-center py-24 flex flex-col items-center">
          <Library className="w-12 h-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-sm">Темы ещё не загружены.</p>
          <p className="text-zinc-500 text-xs mt-1 font-mono">Запустите: npx ts-node scripts/seed_roadmap.ts</p>
        </div>
      )}

      {/* Roadmap timeline */}
      <div className="space-y-12">
        {STAGE_ORDER.map((stage, stageIdx) => {
          const stageTopics = grouped[stage]
          if (!stageTopics || stageTopics.length === 0) return null
          const cfg = STAGE_CONFIG[stage]

          return (
            <motion.div 
              key={stage}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
            >
              {/* Stage header */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest", cfg.badge)}>
                  <span>{cfg.icon}</span>
                  <span>{stage}</span>
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20 font-mono">{stageTopics.length} тем</span>
              </motion.div>

              {/* Topics timeline */}
              <div className="relative pl-7 space-y-4">
                {/* Vertical line */}
                <div className={cn("absolute left-[5px] top-2 w-0.5", cfg.lineColor)} style={{ height: 'calc(100% - 10px)' }} />

                {stageTopics.map((topic, topicIdx) => {
                  globalNum++
                  const num = globalNum
                  
                  const progress = mastery[topic.id] || { total: 0, solved: 0 }
                  const percentage = progress.total > 0 ? Math.round((progress.solved / progress.total) * 100) : 0

                  return (
                    <motion.div 
                      key={topic.id} 
                      variants={itemVariants}
                      className="relative"
                    >
                      {/* Dot */}
                      <div className={cn("absolute -left-[22px] top-[24px] w-3 h-3 rounded-full shadow-lg border-2 border-background", cfg.dotColor)} />

                      {/* Card - Pro Max Aceternity/Shadcn Look */}
                      <div className="group rounded-xl bg-card border border-border p-5 transition-all duration-300 hover:border-primary/40 hover:bg-secondary/10 shadow-sm hover:shadow-primary/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Top Left Icon */}
                            <div className="flex-shrink-0 mt-0.5 bg-primary/10 text-primary p-2.5 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                              <Terminal className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-secondary border border-border flex items-center justify-center text-[10px] font-bold font-mono text-muted-foreground">
                                  {num}
                                </span>
                                <h3 className="text-base font-medium text-white leading-snug truncate">
                                  {topic.title}
                                </h3>
                              </div>
                              
                              {topic.prerequisites && topic.prerequisites.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {topic.prerequisites.map((prereq) => (
                                    <span
                                      key={prereq}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground"
                                    >
                                      ↳ {prereq.split(' (')[0].split(' /')[0].substring(0, 30)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground font-mono mt-1">Основы темы</p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0 mt-3 md:mt-0">
                            <Link
                              href={`/dashboard/learning/${topic.id}`}
                              className="px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all duration-200 flex items-center gap-2"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Статья
                            </Link>
                            <Link
                              href={`/dashboard/learning/${topic.id}/practice`}
                              className="px-3 py-2 rounded-lg text-xs font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 flex items-center group/btn"
                            >
                              <Code2 className="w-3.5 h-3.5 mr-1.5" />
                              Практика
                              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>

                        {/* Progress Bar (Mastery) */}
                        {progress.total > 0 && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Уровень освоения</span>
                              <span className={cn(
                                "text-[10px] font-bold font-mono",
                                percentage === 100 ? "text-emerald-500" : percentage > 50 ? "text-sky-500" : "text-muted-foreground"
                              )}>
                                {progress.solved} / {progress.total} задач ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                  "h-full rounded-full transition-all shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                                  percentage === 100 ? "bg-emerald-500 shadow-emerald-500/20" : 
                                  percentage > 0 ? "bg-sky-500 shadow-sky-500/20" : "bg-muted"
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Connector arrow */}
              {stageIdx < STAGE_ORDER.length - 1 && grouped[STAGE_ORDER[stageIdx + 1]]?.length > 0 && (
                <div className="flex flex-col items-start gap-0 ml-[4px] mt-8 mb-4 opacity-20">
                  <div className="w-0.5 h-8 bg-white/40" />
                  <span className="text-white text-[10px] -ml-[3px]">▼</span>
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Trophy finish */}
        {topics && topics.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 ml-[4px] mt-6"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">Финиш — вы прошли весь курс!</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
