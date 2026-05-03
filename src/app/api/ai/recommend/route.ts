import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendedProblems } from '@/lib/adaptive/matching'
import { UserSkills, ProblemCandidate } from '@/lib/adaptive/matching'

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Получаем пользователя
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Получаем профиль пользователя (скиллы)
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', user.id)
      .single()

    const userSkills = ((profile as { skills: UserSkills } | null)?.skills) || {
      algorithms: 10,
      data_structures: 10,
      complexity: 10,
      coding: 10,
      debugging: 10,
      speed: 10,
      logic: 10,
      math: 10,
      graphs: 10,
    }

    // 3. Получаем список решенных задач, чтобы не предлагать их снова
    const { data: solvedSubmissions } = await supabase
      .from('submissions')
      .select('problem_id')
      .eq('user_id', user.id)
      .eq('verdict', 'Accepted')

    const solvedProblemIds = new Set((solvedSubmissions as { problem_id: string }[])?.map(s => s.problem_id) || [])

    // 4. Получаем все доступные задачи из таблицы problems
    const { data: allProblems } = await supabase
      .from('problems')
      .select('id, title, description, difficulty, requirements')

    if (!allProblems || allProblems.length === 0) {
      return NextResponse.json({ error: 'No problems found in database' }, { status: 404 })
    }

    // 5. Фильтруем те, что уже решены
    const candidates = (allProblems as unknown as ProblemCandidate[]).filter(p => !solvedProblemIds.has(p.id))

    // 6. Используем алгоритм подбора (Matching Engine)
    const recommended = getRecommendedProblems(userSkills, candidates)

    if (recommended.length === 0) {
      // Если идеальных совпадений нет, берем просто случайную нерешенную задачу
      const randomIndex = Math.floor(Math.random() * candidates.length)
      return NextResponse.json({ 
        problem: candidates[randomIndex],
        isFallback: true 
      })
    }

    // Возвращаем лучшую рекомендацию
    return NextResponse.json({ 
      problem: recommended[0],
      isFallback: false
    })

  } catch (error) {
    console.error('[AI Recommend Error]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
