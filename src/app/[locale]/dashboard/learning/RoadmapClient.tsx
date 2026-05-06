"use client"

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Code2, Terminal, Trophy, Sprout, Zap, Flame, Rocket, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoadmapTopic {
  id: string
  title: string
  stage: string
  level: string
  order_index: number
  prerequisites: string[]
  article_url: string | null
}

const STAGE_MAP: Record<string, string> = {
  'Начальный': 'beginner',
  'Базовый': 'basic',
  'Средний': 'intermediate',
  'Продвинутый': 'advanced',
  'Мастер': 'master'
};

const STAGE_CONFIG: Record<string, { badge: string; icon: React.ReactNode; lineColor: string; dotColor: string }> = {
  'beginner': {
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: <Sprout className="w-4 h-4" />,
    lineColor: 'bg-emerald-500/20',
    dotColor: 'bg-emerald-500',
  },
  'basic': {
    badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    icon: <Zap className="w-4 h-4" />,
    lineColor: 'bg-sky-500/20',
    dotColor: 'bg-sky-500',
  },
  'intermediate': {
    badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    icon: <Flame className="w-4 h-4" />,
    lineColor: 'bg-violet-500/20',
    dotColor: 'bg-violet-500',
  },
  'advanced': {
    badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: <Rocket className="w-4 h-4" />,
    lineColor: 'bg-orange-500/20',
    dotColor: 'bg-orange-500',
  },
  'master': {
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: <Crown className="w-4 h-4" />,
    lineColor: 'bg-red-500/20',
    dotColor: 'bg-red-500',
  },
}

const STAGE_ORDER = ['beginner', 'basic', 'intermediate', 'advanced', 'master']

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
  const t = useTranslations('Syllabi')
  const [activeLevel, setActiveLevel] = useState(STAGE_ORDER[0])

  const stageTopics = topics.filter(top => STAGE_MAP[top.stage] === activeLevel)
  
  // Calculate global number prefix for current stage
  let previousTopicsCount = 0
  for (let i = 0; i < STAGE_ORDER.indexOf(activeLevel); i++) {
    previousTopicsCount += topics.filter(top => STAGE_MAP[top.stage] === STAGE_ORDER[i]).length
  }

  return (
    <div className="px-8 pb-24 w-full">
      {/* Tabs Header */}
      <div className="flex items-center gap-8 border-b border-white/5 mb-10 overflow-x-auto hide-scrollbar">
        {STAGE_ORDER.map((stageKey) => {
          const isActive = activeLevel === stageKey
          const count = topics.filter(top => STAGE_MAP[top.stage] === stageKey).length
          if (count === 0) return null

          return (
            <button
              key={stageKey}
              onClick={() => setActiveLevel(stageKey)}
              className={cn(
                "pb-4 px-1 text-sm font-bold transition-all relative whitespace-nowrap group",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-sans uppercase tracking-widest text-xs">{t(stageKey)}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full border transition-colors font-mono",
                  isActive ? "bg-primary/10 border-primary/20" : "bg-secondary border-border"
                )}>
                  {count}
                </span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {stageTopics.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {stageTopics.map((topic, idx) => {
                const num = previousTopicsCount + idx + 1
                const progress = mastery[topic.id] || { total: 0, solved: 0 }
                const percentage = progress.total > 0 ? Math.round((progress.solved / progress.total) * 100) : 0

                return (
                  <motion.div 
                    key={topic.id} 
                    variants={itemVariants}
                    className="relative"
                  >
                    <div className="group h-full rounded-2xl bg-card border border-white/5 p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.02] shadow-sm hover:shadow-xl flex flex-col items-center text-center">
                      <div className="flex-shrink-0 mb-6 bg-secondary text-muted-foreground p-3.5 rounded-2xl border border-border shadow-sm group-hover:text-primary group-hover:border-primary/30 transition-colors">
                        <Terminal className="w-6 h-6" />
                      </div>

                      <div className="flex flex-col items-center gap-2 mb-6 flex-1">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="flex-shrink-0 w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {num}
                          </span>
                          <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug font-sans">
                            {topic.title}
                          </h3>
                        </div>
                        
                        {topic.prerequisites && topic.prerequisites.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                            {topic.prerequisites.map((prereq) => (
                              <span
                                key={prereq}
                                className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground"
                              >
                                ↳ {prereq.split(' (')[0].split(' /')[0].substring(0, 30)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1">{t('fundamentalTopic')}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3 flex-wrap mb-8 w-full">
                        <Link
                          href={`/dashboard/learning/${topic.id}`}
                          className="px-4 py-2 rounded-md text-[11px] font-bold font-sans uppercase tracking-[0.1em] border border-white/10 bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all flex items-center gap-2"
                        >
                          <BookOpen className="w-3 h-3" />
                          {t('read')}
                        </Link>
                        <Link
                          href={`/dashboard/learning/${topic.id}/practice`}
                          className="px-4 py-2 rounded-md text-[11px] font-bold font-sans uppercase tracking-[0.1em] border border-white/10 bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all flex items-center gap-2"
                        >
                          <Code2 className="w-3 h-3" />
                          {t('practice')}
                        </Link>
                      </div>

                      {progress.total > 0 && (
                        <div className="pt-6 border-t border-border w-full">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('mastery')}</span>
                            <span className={cn(
                              "text-[9px] font-bold font-mono tracking-wider",
                              percentage === 100 ? "text-emerald-500" : percentage > 50 ? "text-sky-500" : "text-muted-foreground"
                            )}>
                              {progress.solved}/{progress.total} {t('solved')} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full transition-all",
                                percentage === 100 ? "bg-emerald-500" : 
                                percentage > 0 ? "bg-sky-500" : "bg-muted"
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
          )}

          {activeLevel === STAGE_ORDER[STAGE_ORDER.length - 1] && stageTopics.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg transform rotate-12">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-sm text-foreground font-bold font-mono uppercase tracking-[0.3em]">{t('courseComplete')}</span>
                <p className="text-xs text-muted-foreground mt-1">{t('courseCompleteDesc')}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
