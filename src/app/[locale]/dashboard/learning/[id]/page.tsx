import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import ArticleMarkdown from './ArticleMarkdown'
import ScrollProgress from './ScrollProgress'
import { cn } from '@/lib/utils'
import { Sprout, Zap, Flame, Rocket, Crown, PenTool, MapPin } from 'lucide-react'

interface RoadmapTopic {
  id: string
  title: string
  stage: string
  level: string
  order_index: number
  prerequisites: string[]
  article_url: string | null
  article_markdown: string | null
  created_at: string
}

const STAGE_CONFIG: Record<string, { badge: string; icon: React.ReactNode }> = {
  'Начальный':   { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <Sprout className="w-4 h-4" /> },
  'Базовый':     { badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',             icon: <Zap className="w-4 h-4" /> },
  'Средний':     { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',    icon: <Flame className="w-4 h-4" /> },
  'Продвинутый': { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',    icon: <Rocket className="w-4 h-4" /> },
  'Мастер':      { badge: 'bg-red-500/15 text-red-400 border-red-500/30',             icon: <Crown className="w-4 h-4" /> },
}

function calculateReadingTime(text: string | null): number {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
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

  // Load all topics for internal link resolution in ArticleMarkdown
  const { data: allTopics } = await supabase
    .from('roadmap_topics')
    .select('id, title')
    .order('order_index')

  const topics = (allTopics ?? []) as { id: string; title: string }[]

  const t = topic as RoadmapTopic
  const cfg = STAGE_CONFIG[t.stage] ?? { badge: 'bg-muted text-muted-foreground border-border', icon: <MapPin className="w-4 h-4" /> }
  const readingTime = calculateReadingTime(t.article_markdown);

  // Fetch mastery for this topic
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: topicProblems } = await supabase
    .from('topic_problems')
    .select('problem_id')
    .eq('topic_id', id) as { data: { problem_id: string }[] | null }

  const { data: userSubmissions } = user 
    ? await (supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', user.id)
        .in('verdict', ['Accepted', 'AC'])
        .in('problem_id', (topicProblems ?? []).map(p => p.problem_id).filter(Boolean) as string[]) as unknown as Promise<{ data: { problem_id: string }[] | null }>)
    : { data: [] }

  const totalProblems = topicProblems?.length ?? 0
  const solvedCount = new Set((userSubmissions ?? []).map((s: { problem_id: string }) => s.problem_id)).size
  const percentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground relative">
      <ScrollProgress />
      
      <div className="sticky top-0 z-20 border-b border-border px-8 py-4 backdrop-blur-md bg-background/80">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/learning"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Roadmap
            </Link>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-sm text-muted-foreground truncate max-w-xs">{t.title}</span>
          </div>

          {readingTime > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Время чтения: {readingTime} мин
            </div>
          )}
        </div>
      </div>

      {/* Article content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Stage badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-widest ${cfg.badge}`}>
              <span>{cfg.icon}</span>
              <span>{t.stage}</span>
            </span>
            <span className="text-xs text-muted-foreground/50 font-mono">Тема #{t.order_index}</span>
          </div>

          {totalProblems > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
              <span>Освоение темы</span>
              <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                <span className={cn(percentage === 100 ? "text-emerald-400" : "text-sky-400")}>{percentage}%</span>
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", percentage === 100 ? "bg-emerald-500" : "bg-sky-500")} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-2">
          {t.title}
        </h1>

        {/* Prerequisites */}
        {t.prerequisites && t.prerequisites.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 mt-4">
            <span className="text-xs text-muted-foreground/60 font-mono">Необходимые знания:</span>
            {t.prerequisites.map((prereq: string) => (
              <span
                key={prereq}
                className="text-xs font-mono px-2 py-0.5 rounded bg-muted border border-border/80 text-muted-foreground"
              >
                {prereq.split(' (')[0]}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-border mt-6" />

        {/* Article body */}
        {t.article_markdown ? (
          <ArticleMarkdown content={t.article_markdown} topics={topics} />
        ) : (
          <div className="mt-12 flex flex-col items-center text-center py-20 rounded-2xl border border-border bg-muted/30">
            <PenTool className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm font-medium">Статья в разработке</p>
            <p className="text-muted-foreground/60 text-xs mt-2 font-mono max-w-xs">
              Article content is being prepared. Check back soon or contribute via GitHub.
            </p>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
          <Link
            href="/dashboard/learning"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Назад к Roadmap
          </Link>
          <Link
            href={`/dashboard/learning/${t.id}/practice`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
          >
            <Zap className="w-4 h-4" /> Практика по теме
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
