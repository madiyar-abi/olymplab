import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface RoadmapTopic {
  id: string
  title: string
  stage: string
  order_index: number
  prerequisites: string[]
  article_url: string | null
}

const STAGE_CONFIG: Record<string, { color: string; badge: string; icon: string; lineColor: string; dotColor: string }> = {
  'Начальный': {
    color: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/25',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: '🌱',
    lineColor: 'bg-emerald-500/30',
    dotColor: 'bg-emerald-400 shadow-emerald-400/60',
  },
  'Базовый': {
    color: 'from-sky-500/15 to-sky-600/5 border-sky-500/25',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: '⚡',
    lineColor: 'bg-sky-500/30',
    dotColor: 'bg-sky-400 shadow-sky-400/60',
  },
  'Средний': {
    color: 'from-violet-500/15 to-violet-600/5 border-violet-500/25',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    icon: '🔥',
    lineColor: 'bg-violet-500/30',
    dotColor: 'bg-violet-400 shadow-violet-400/60',
  },
  'Продвинутый': {
    color: 'from-orange-500/15 to-orange-600/5 border-orange-500/25',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    icon: '🚀',
    lineColor: 'bg-orange-500/30',
    dotColor: 'bg-orange-400 shadow-orange-400/60',
  },
}

const STAGE_ORDER = ['Начальный', 'Базовый', 'Средний', 'Продвинутый']

export default async function LearningPage() {
  const supabase = await createClient()
  const { data: topics, error } = await supabase
    .from('roadmap_topics')
    .select('*')
    .order('order_index', { ascending: true })

  const grouped: Record<string, RoadmapTopic[]> = {}
  STAGE_ORDER.forEach(s => { grouped[s] = [] })

  if (topics) {
    topics.forEach((t: RoadmapTopic) => {
      if (grouped[t.stage]) grouped[t.stage].push(t)
    })
  }

  let globalNum = 0

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-sm">
              📚
            </div>
            <h1 className="text-xl font-bold tracking-tight">Structured Syllabi</h1>
          </div>
          <p className="text-xs text-white/30 font-mono mt-1">
            Competitive programming roadmap — от основ до продвинутых техник
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 pb-24">

        {/* Migration warning */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-8 font-mono">
            ⚠️ Таблица roadmap_topics не найдена. Создайте её в Supabase SQL Editor.
          </div>
        )}

        {/* Empty state */}
        {!error && (!topics || topics.length === 0) && (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-white/40 text-sm">Темы ещё не загружены.</p>
            <p className="text-white/20 text-xs mt-1 font-mono">Запустите: npx ts-node scripts/seed_roadmap.ts</p>
          </div>
        )}

        {/* Roadmap timeline */}
        {STAGE_ORDER.map((stage, stageIdx) => {
          const stageTopics = grouped[stage]
          if (!stageTopics || stageTopics.length === 0) return null
          const cfg = STAGE_CONFIG[stage]

          return (
            <div key={stage}>
              {/* Stage header */}
              <div className="flex items-center gap-4 mt-10 mb-6 first:mt-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest ${cfg.badge}`}>
                  <span>{cfg.icon}</span>
                  <span>{stage}</span>
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20 font-mono">{stageTopics.length} тем</span>
              </div>

              {/* Topics timeline */}
              <div className="relative pl-7">
                {/* Vertical line */}
                <div className={`absolute left-[5px] top-2 w-0.5 ${cfg.lineColor}`} style={{ height: 'calc(100% - 20px)' }} />

                {stageTopics.map((topic, topicIdx) => {
                  globalNum++
                  const num = globalNum
                  const isLastInStage = topicIdx === stageTopics.length - 1

                  return (
                    <div key={topic.id} className={`relative ${isLastInStage ? 'mb-0' : 'mb-3'}`}>
                      {/* Dot */}
                      <div
                        className={`absolute -left-[22px] top-[18px] w-3 h-3 rounded-full shadow-lg border-2 border-[#09090b] ${cfg.dotColor}`}
                      />

                      {/* Card */}
                      <div className={`rounded-xl border bg-gradient-to-br ${cfg.color} p-4 transition-all duration-200 hover:scale-[1.005] hover:brightness-110`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Index */}
                            <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded bg-white/5 border border-white/8 flex items-center justify-center text-[11px] font-bold font-mono text-white/40">
                              {num}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-white/90 leading-snug">
                                {topic.title}
                              </h3>
                              {topic.prerequisites && topic.prerequisites.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {topic.prerequisites.map((prereq) => (
                                    <span
                                      key={prereq}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/25"
                                    >
                                      ↳ {prereq.split(' (')[0].split(' /')[0].substring(0, 30)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <Link
                              href={`/dashboard/learning/${topic.id}`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-white/8 border-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-all duration-150"
                            >
                              📖 Статья
                            </Link>
                            <Link
                              href={`/dashboard/problems`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all duration-150"
                            >
                              ⚡ Задачи
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Connector arrow between stages */}
              {stageIdx < STAGE_ORDER.length - 1 && grouped[STAGE_ORDER[stageIdx + 1]]?.length > 0 && (
                <div className="flex flex-col items-start gap-0 ml-[4px] mt-4">
                  <div className="w-0.5 h-5 bg-white/8" />
                  <span className="text-white/15 text-xs">▼</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Trophy finish */}
        {topics && topics.length > 0 && (
          <div className="flex items-center gap-3 ml-[4px] mt-6">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] shadow-lg shadow-yellow-500/30">
              🏆
            </div>
            <span className="text-xs text-white/25 font-mono">Финиш — вы прошли весь курс!</span>
          </div>
        )}
      </div>
    </div>
  )
}
