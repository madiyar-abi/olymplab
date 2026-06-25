import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Activity, ArrowRight } from 'lucide-react'
import { VERDICT_METADATA, mapRawVerdict } from '@/types/verdict'
import type { SkillAxes } from '@/types/database'

const SKILL_AXES: { key: SkillAxes; color: string }[] = [
  { key: 'algorithms', color: 'bg-blue-500' },
  { key: 'data_structures', color: 'bg-indigo-500' },
  { key: 'complexity', color: 'bg-violet-500' },
  { key: 'coding', color: 'bg-fuchsia-500' },
  { key: 'debugging', color: 'bg-rose-500' },
  { key: 'speed', color: 'bg-amber-500' },
  { key: 'logic', color: 'bg-emerald-500' },
  { key: 'math', color: 'bg-cyan-500' },
  { key: 'graphs', color: 'bg-sky-500' },
]

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('Progress')
  const tSkills = await getTranslations('Problems')
  const format = await getFormatter()

  // Real skills from the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('id', user.id)
    .single()
  const skills = ((profile as { skills: Record<string, number> | null } | null)?.skills) || {}

  // Real recent activity from submissions (titles fetched separately to avoid join typing)
  const { data: subs } = await supabase
    .from('submissions')
    .select('id, verdict, created_at, problem_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const submissions = (subs || []) as { id: string; verdict: string | null; created_at: string; problem_id: string }[]
  const problemIds = [...new Set(submissions.map((s) => s.problem_id))]
  const titleMap = new Map<string, string>()
  if (problemIds.length) {
    const { data: probs } = await supabase.from('problems').select('id, title').in('id', problemIds)
    for (const p of (probs || []) as { id: string; title: string }[]) {
      titleMap.set(p.id, p.title)
    }
  }

  return (
    <div className="min-h-full p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">{t('subtitle')}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skill mastery — real values from the profile */}
          <section className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center font-mono uppercase tracking-widest">
              <span className="text-primary mr-3 text-lg">■</span>
              {t('skillMastery')}
            </h2>

            <div className="space-y-5">
              {SKILL_AXES.map(({ key, color }) => {
                const value = Math.max(0, Math.min(100, Math.round(skills[key] ?? 0)))
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold font-mono">
                      <span className="text-foreground">{tSkills(`skills.${key}`)}</span>
                      <span className="text-muted-foreground tabular-nums">{value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full border border-border/50">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Recent activity — real submissions */}
          <section className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center font-mono uppercase tracking-widest">
              <span className="text-primary mr-3 text-lg">▶</span>
              {t('recentActivity')}
            </h2>

            {submissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-4">{t('noActivity')}</p>
                <Link
                  href="/dashboard/problems"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {t('browseProblems')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {submissions.map((s) => {
                  const verdict = VERDICT_METADATA[mapRawVerdict(s.verdict)]
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${verdict.bg} ${verdict.color}`} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <Link
                          href={`/dashboard/problems/${s.problem_id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors font-mono truncate"
                        >
                          {titleMap.get(s.problem_id) ?? s.problem_id.slice(0, 8)}
                        </Link>
                        <span className={`text-xs font-medium ${verdict.color}`}>{verdict.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {format.relativeTime(new Date(s.created_at))}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
