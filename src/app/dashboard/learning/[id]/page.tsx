import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleMarkdown from './ArticleMarkdown'

const STAGE_CONFIG: Record<string, { badge: string; icon: string }> = {
  'Начальный': { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: '🌱' },
  'Базовый':   { badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',             icon: '⚡' },
  'Средний':   { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',    icon: '🔥' },
  'Продвинутый': { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',  icon: '🚀' },
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: topic, error } = await supabase
    .from('roadmap_topics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !topic) {
    notFound()
  }

  const cfg = STAGE_CONFIG[topic.stage] ?? { badge: 'bg-white/10 text-white/60 border-white/10', icon: '📌' }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Breadcrumb bar — inline (no sticky inside nested scroll container) */}
      <div className="border-b border-white/5 px-8 py-4" style={{ background: '#09090b' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard/learning"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Roadmap
          </Link>
          <span className="text-white/10">/</span>
          <span className="text-sm text-white/30 truncate max-w-xs">{topic.title}</span>
        </div>
      </div>

      {/* Article content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Stage badge */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-widest ${cfg.badge}`}>
            <span>{cfg.icon}</span>
            <span>{topic.stage}</span>
          </span>
          <span className="text-xs text-white/20 font-mono">Тема #{topic.order_index}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white leading-tight mb-2">
          {topic.title}
        </h1>

        {/* Prerequisites */}
        {topic.prerequisites && topic.prerequisites.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 mt-4">
            <span className="text-xs text-white/30 font-mono">Необходимые знания:</span>
            {topic.prerequisites.map((prereq: string) => (
              <span
                key={prereq}
                className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/40"
              >
                {prereq.split(' (')[0]}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-white/5 mt-6" />

        {/* Article body */}
        {topic.article_markdown ? (
          <ArticleMarkdown content={topic.article_markdown} />
        ) : (
          <div className="mt-12 flex flex-col items-center text-center py-20 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="text-4xl mb-4">✍️</div>
            <p className="text-white/40 text-sm font-medium">Статья в разработке</p>
            <p className="text-white/20 text-xs mt-2 font-mono max-w-xs">
              Article content is being prepared. Check back soon or contribute via GitHub.
            </p>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
          <Link
            href="/dashboard/learning"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 transition-colors font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Назад к Roadmap
          </Link>
          <Link
            href="/dashboard/problems"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
          >
            ⚡ Практика по теме
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
