import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Code2, ExternalLink, Hash, Zap, Cpu } from 'lucide-react'
import { VerdictBadge } from '@/components/ui/VerdictBadge'

import { StaggerTableBody, StaggerTableRow } from '@/components/shared/Stagger'

interface Submission {
  id: string
  problem_id: string
  status: string
  verdict: string | null
  language: string | null
  created_at: string
  test_case: number | null
  time_ms: number | null
  memory_kb: number | null
  problems: { title: string } | null
}

export default async function SubmissionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch submissions with problem titles
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      id,
      problem_id,
      status,
      verdict,
      language,
      created_at,
      test_case,
      time_ms,
      memory_kb,
      problems!inner (
        title
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching submissions:', error)
  }

  const formatMemory = (kb: number | null) => {
    if (kb === null) return '---'
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const formatTime = (ms: number | null) => {
    if (ms === null) return '---'
    return `${ms} ms`
  }

  return (
    <div className="min-h-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono flex items-center gap-3">
            <Hash className="w-8 h-8 text-primary" />
            Submission History
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Complete trace of your algorithmic executions and verdicts.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">ID / Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Problem</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Verdict</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Stat</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Lang</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono text-right">Action</th>
                </tr>
              </thead>
              <StaggerTableBody>
                {!submissions || submissions.length === 0 ? (
                  <tr className="hover:bg-transparent">
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground">
                          <Code2 className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground font-mono">No submissions yet</h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            Solve your first problem to start building your algorithmic history.
                          </p>
                        </div>
                        <Link 
                          href="/dashboard/problems" 
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow hover:opacity-90 transition-opacity"
                        >
                          Browse Problems
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (submissions as unknown as Submission[]).map((sub) => (
                    <StaggerTableRow key={sub.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-mono mb-1">#{sub.id.slice(0, 8)}</span>
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {new Date(sub.created_at).toLocaleString('ru-RU', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/problems/${sub.problem_id}`}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors font-mono line-clamp-1"
                        >
                          {sub.problems?.title || 'Unknown Problem'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <VerdictBadge verdict={sub.verdict || sub.status} />
                          {sub.test_case != null && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              on test {sub.test_case}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px] font-mono text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500/70" />
                            {formatTime(sub.time_ms)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-blue-500/70" />
                            {formatMemory(sub.memory_kb)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                          {sub.language?.toUpperCase() || 'C++'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/problems/${sub.problem_id}?submissionId=${sub.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline font-mono"
                        >
                          <Code2 className="w-4 h-4" />
                          View Code
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </StaggerTableRow>
                  ))
                )}
              </StaggerTableBody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
