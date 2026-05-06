import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sprout, Zap, Flame, Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TopicProblem {
  id: string
  source: 'codeforces' | 'cses' | 'atcoder'
  source_id: string
  title: string
  url: string
  cf_rating: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  layer: 'intro' | 'core' | 'mixed'
  tags: string[]
  problem_id: string | null
}

// ─── Configs ─────────────────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  codeforces: { label: 'Codeforces', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  cses:       { label: 'CSES',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  atcoder:    { label: 'AtCoder',    color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Легкая',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  medium: { label: 'Средняя',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  hard:   { label: 'Сложная',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
}

const LAYER_CONFIG: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
  intro: { icon: <Sprout className="w-5 h-5 text-emerald-500" />, label: 'Введение и база', desc: 'Основные понятия и классические задачи на понимание темы' },
  core:  { icon: <Zap className="w-5 h-5 text-sky-500" />, label: 'Ядро темы',        desc: 'Стандартные алгоритмы и важные модификации' },
  mixed: { icon: <Flame className="w-5 h-5 text-violet-500" />, label: 'Продвинутые и Mix', desc: 'Сложные задачи и комбинации с другими темами' },
}

// ─── Problem Card ─────────────────────────────────────────────────────────────
function ProblemCard({ p, isSolved }: { p: TopicProblem, isSolved: boolean }) {
  const src  = SOURCE_CONFIG[p.source] || SOURCE_CONFIG.codeforces
  const diff = DIFFICULTY_CONFIG[p.difficulty] || DIFFICULTY_CONFIG.easy
  
  const isInternal = !!p.problem_id
  const href = isInternal ? `/dashboard/problems/${p.problem_id}` : p.url
  const Component = isInternal ? Link : 'a'
  const props = isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" }

  return (
    <Component
      href={href}
      {...(props as Record<string, string>)}
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200",
        isSolved 
          ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" 
          : "border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/30"
      )}
    >
      {/* Solved Status Icon */}
      <div className={cn(
        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border",
        isSolved ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 text-transparent"
      )}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Source badge */}
      <span className={`flex-shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${src.color}`}>
        {src.label}
      </span>

      {/* Title */}
      <span className={cn(
        "flex-1 text-sm transition-colors font-medium truncate",
        isSolved ? "text-emerald-700 dark:text-emerald-300" : "text-foreground/80 group-hover:text-foreground"
      )}>
        {p.title}
        {isInternal && (
          <span className="ml-2 text-[9px] text-cyan-600 dark:text-cyan-400 font-mono uppercase tracking-tighter bg-cyan-400/5 px-1 rounded border border-cyan-400/20">
            Internal
          </span>
        )}
      </span>

      {/* CF Rating */}
      {p.cf_rating && (
        <span className="flex-shrink-0 text-xs font-mono text-muted-foreground/60">
          {p.cf_rating}
        </span>
      )}

      {/* Difficulty */}
      <span className={`flex-shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${diff.color}`}>
        {diff.label}
      </span>

      {/* Arrow / Action Icon */}
      {isInternal ? (
        <svg className="w-4 h-4 text-cyan-500/40 group-hover:text-cyan-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ) : (
        <svg
          className="flex-shrink-0 w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </Component>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch topic info
  const { data: topicRaw } = await supabase
    .from('roadmap_topics')
    .select('id, title, order_index, stage')
    .eq('id', id)
    .single()

  if (!topicRaw) notFound()

  const topic = topicRaw as { id: string; title: string; order_index: number; stage: string }

  // Fetch problems for this topic
  const { data: problems } = await supabase
    .from('topic_problems')
    .select('*')
    .eq('topic_id', id)
    .order('layer')
    .order('cf_rating', { ascending: true, nullsFirst: false })

  const all = (problems ?? []) as TopicProblem[]

  // Fetch user solved problems
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userSubmissions } = user 
    ? await (supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', user.id)
        .in('verdict', ['Accepted', 'AC'])
        .in('problem_id', all.map(p => p.problem_id).filter(Boolean) as string[]) as unknown as Promise<{ data: { problem_id: string }[] | null }>)
    : { data: [] }

  const solvedProblemIds = new Set((userSubmissions ?? []).map((s: { problem_id: string }) => s.problem_id))

  // Group by layer
  const groups: Record<string, TopicProblem[]> = { intro: [], core: [], mixed: [] }
  all.forEach(p => { groups[p.layer]?.push(p) })

  const stats = {
    total: all.length,
    solved: solvedProblemIds.size,
    percentage: all.length > 0 ? Math.round((solvedProblemIds.size / all.length) * 100) : 0,
    easy:   all.filter(p => p.difficulty === 'easy').length,
    medium: all.filter(p => p.difficulty === 'medium').length,
    hard:   all.filter(p => p.difficulty === 'hard').length,
  }

  const sources = [...new Set(all.map(p => p.source))]

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground">
      <div className="border-b border-border px-8 py-4 bg-background">
        <div className="max-w-3xl mx-auto flex items-center gap-3 flex-wrap text-sm font-mono">
          <Link href="/dashboard/learning" className="text-muted-foreground hover:text-foreground/70 transition-colors">
            Roadmap
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <Link href={`/dashboard/learning/${id}`} className="text-muted-foreground hover:text-foreground/70 transition-colors truncate max-w-[180px]">
            {topic.title}
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-muted-foreground/80">Практика</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground/40">Тема #{topic.order_index}</span>
            </div>
            {stats.total > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ваш прогресс</span>
                <div className="flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                   <span className={cn("text-xs font-bold font-mono", stats.percentage === 100 ? "text-emerald-400" : "text-sky-400")}>{stats.percentage}%</span>
                   <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                     <div className={cn("h-full rounded-full transition-all duration-1000", stats.percentage === 100 ? "bg-emerald-500" : "bg-sky-500")} style={{ width: `${stats.percentage}%` }} />
                   </div>
                </div>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Практика — <span className="text-violet-500 dark:text-violet-400">{topic.title}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Задачи подобраны по теме и решаются прямо на платформе OlympLab во встроенной IDE.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
              <span className="text-foreground/60 text-sm font-mono">{stats.solved}/{stats.total}</span>
              <span className="text-muted-foreground text-xs">решено</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">{stats.easy}</span>
              <span className="text-emerald-600/50 dark:text-emerald-400/50 text-xs">лёгких</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-mono">{stats.medium}</span>
              <span className="text-yellow-600/50 dark:text-yellow-400/50 text-xs">средних</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-600 dark:text-rose-400 text-sm font-mono">{stats.hard}</span>
              <span className="text-rose-600/50 dark:text-rose-400/50 text-xs">сложных</span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {sources.map(s => (
                <span key={s} className={`text-[10px] font-bold font-mono px-2 py-1 rounded border ${SOURCE_CONFIG[s as keyof typeof SOURCE_CONFIG]?.color || 'border-border'}`}>
                  {SOURCE_CONFIG[s as keyof typeof SOURCE_CONFIG]?.label || s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mb-8" />

        {/* Problem groups */}
        {all.length === 0 ? (
          <EmptyState 
            title="No Problems Found"
            description="Challenges for this topic haven't been added to the database yet. Check back soon for new training material."
            icon={Inbox}
            className="min-h-[40vh] py-12"
          />
        ) : (
          <div className="space-y-10">
            {(Object.keys(LAYER_CONFIG) as Array<keyof typeof LAYER_CONFIG>).map(layer => {
              const probs = groups[layer]
              if (!probs || probs.length === 0) return null
              const cfg = LAYER_CONFIG[layer]

              return (
                <section key={layer as string}>
                  {/* Layer heading */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <h2 className="text-sm font-bold text-foreground/80 font-mono uppercase tracking-widest">
                        {cfg.label}
                      </h2>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">{cfg.desc}</p>
                    </div>
                    <span className="ml-auto text-xs font-mono text-muted-foreground/40">{probs.length} задач</span>
                  </div>

                  <div className="space-y-2">
                    {probs.map(p => (
                      <ProblemCard key={p.id} p={p} isSolved={p.problem_id ? solvedProblemIds.has(p.problem_id) : false} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <Link
            href={`/dashboard/learning/${id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Вернуться к статье
          </Link>
          <Link
            href="/dashboard/learning"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            Roadmap →
          </Link>
        </div>
      </div>
    </div>
  )
}
