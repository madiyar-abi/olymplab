import { createClient } from '@/lib/supabase/server'
import { RoadmapClient } from './RoadmapClient'
import { BookOpen, AlertTriangle } from 'lucide-react'

interface Topic {
  id: string
  title: string
  stage: string
  level: string
  order_index: number
  prerequisites: string[]
  article_url: string | null
}

export default async function LearningPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: topics, error } = await supabase
    .from('roadmap_topics')
    .select('*')
    .order('order_index', { ascending: true }) as { data: Topic[] | null, error: { message: string } | null }

  // Fetch all topic problems to know which problems belong to which topic
  const { data: topicProblems } = await supabase
    .from('topic_problems')
    .select('topic_id, problem_id') as { data: { topic_id: string, problem_id: string }[] | null }

  // Fetch accepted submissions for the current user
  const { data: userSubmissions } = user 
    ? await supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', user.id)
        .eq('verdict', 'Accepted') as { data: { problem_id: string }[] | null }
    : { data: [] }

  // Calculate mastery per topic
  const solvedProblemIds = new Set((userSubmissions ?? []).map(s => s.problem_id))
  
  const mastery: Record<string, { total: number; solved: number }> = {}
  
  topics?.forEach(t => {
    mastery[t.id] = { total: 0, solved: 0 }
  })

  topicProblems?.forEach(tp => {
    if (mastery[tp.topic_id]) {
      mastery[tp.topic_id].total++
      if (tp.problem_id && solvedProblemIds.has(tp.problem_id)) {
        mastery[tp.topic_id].solved++
      }
    }
  })

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* ... (header same) */}
      <div className="border-b border-border/50 px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Structured Syllabi</h1>
          </div>
          <p className="text-xs text-white/30 font-mono mt-1">
            Competitive programming roadmap — от основ до продвинутых техник
          </p>
        </div>
      </div>

      {/* Migration warning */}
      {error && (
        <div className="max-w-3xl mx-auto px-8 mt-8">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Таблица roadmap_topics не найдена. Создайте её в Supabase SQL Editor.</span>
          </div>
        </div>
      )}

      {!error && <RoadmapClient topics={topics || []} mastery={mastery} />}
    </div>
  )
}
