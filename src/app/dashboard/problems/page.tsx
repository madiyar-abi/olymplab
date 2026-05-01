import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Requirements = Record<string, { level: number; weight: number }>

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Medium:  'text-amber-400  bg-amber-400/10  border-amber-400/30',
  Hard:    'text-red-400    bg-red-400/10    border-red-400/30',
  Mastery: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  Unrated: 'text-zinc-400   bg-zinc-800      border-zinc-700',
}

// Get dominant skill by highest weight (skips zero-weight placeholders)
function getDominantSkill(req: Requirements | null | undefined): string {
  if (!req) return 'Uncategorized'
  let best = ''
  let max = 0
  for (const [skill, { weight }] of Object.entries(req)) {
    if (weight > max) { max = weight; best = skill }
  }
  // All zeroes → uncategorized
  return max > 0 ? best : 'Uncategorized'
}

// Top tags to show on a card (non-zero weight, sorted descending)
function topTags(req: Requirements | null | undefined, n = 3): string[] {
  if (!req) return []
  return Object.entries(req)
    .filter(([, { weight }]) => weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, n)
    .map(([skill]) => skill.replace('_', ' '))
}

// Pretty section title
function sectionLabel(skill: string) {
  return skill === 'Uncategorized'
    ? 'All Problems'
    : skill.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function DashboardProblemsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: problemsData } = await supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: false })

  const problemList = (problemsData as any[]) || []

  if (problemList.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-500">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-mono">No Problems Found</h2>
        <p className="text-zinc-400 max-w-md font-mono text-sm">
          Run the ingestion script to populate the database.
        </p>
      </div>
    )
  }

  // Group by dominant skill
  const grouped: Record<string, typeof problemList> = {}
  for (const p of problemList) {
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
    <div className="p-8 flex flex-col gap-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 font-mono">Problem Catalog</h1>
          <p className="text-zinc-400 font-medium">
            {problemList.length} problems available · Select one to open the IDE
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            {Object.keys(grouped).length} categories
          </span>
        </div>
      </header>

      {/* Sections */}
      {sortedGroups.map(([skill, problems]) => (
        <section key={skill}>
          {/* Section Header */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-cyan-500 rounded-full" />
              <h2 className="text-lg font-semibold text-white capitalize font-mono">
                {sectionLabel(skill)}
              </h2>
            </div>
            <span className="text-xs font-medium text-zinc-500 font-mono">
              {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {problems.map((problem: any) => {
              const tags = topTags(problem.requirements)
              const diff = problem.difficulty || 'Unrated'
              const diffColor = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.Unrated

              return (
                <Link
                  key={problem.id}
                  href={`/dashboard/problems/${problem.id}`}
                  className="group bg-[#18181b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between h-[148px] hover:border-zinc-600 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer"
                >
                  {/* Title row */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 font-mono leading-snug group-hover:text-cyan-300 transition-colors">
                      {problem.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${diffColor}`}>
                      {diff}
                    </span>
                  </div>

                  {/* Tags / Solve button row */}
                  <div className="flex items-center justify-between mt-auto gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {tags.length > 0 ? tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-md text-[10px] font-medium border border-zinc-700/50 uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      )) : (
                        <span className="text-zinc-600 text-[10px] font-mono">Unrated problem</span>
                      )}
                    </div>
                    <span className="text-cyan-500 text-xs font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Solve →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
