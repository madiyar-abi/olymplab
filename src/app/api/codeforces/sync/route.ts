import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let handle: string | undefined
    try {
      const body = await req.json()
      handle = body.handle
    } catch {
      // Empty body
    }

    // If handle not in body, lookup from profile
    if (!handle) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cf_handle')
        .eq('id', user.id)
        .single()
      handle = profile?.cf_handle || undefined
    }

    if (!handle || !handle.trim()) {
      return NextResponse.json({ error: 'No Codeforces handle specified' }, { status: 400 })
    }

    const cleanHandle = handle.trim()

    // 1. Fetch user info from Codeforces API
    const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanHandle)}`, {
      headers: { 'User-Agent': 'OlympLab/1.0' },
      cache: 'no-store',
    })

    if (!infoRes.ok) {
      return NextResponse.json({ error: `Codeforces API returned ${infoRes.status}` }, { status: infoRes.status })
    }

    const infoData = await infoRes.json()
    if (infoData.status !== 'OK' || !infoData.result || infoData.result.length === 0) {
      return NextResponse.json({ error: infoData.comment || 'Codeforces user not found' }, { status: 404 })
    }

    const cfUser = infoData.result[0]
    const rating = cfUser.rating || null
    const maxRating = cfUser.maxRating || null
    const rank = cfUser.rank || 'unrated'
    let avatar: string | null = cfUser.titlePhoto || cfUser.avatar || null
    if (avatar && avatar.startsWith('//')) {
      avatar = `https:${avatar}`
    }

    // 2. Fetch submissions to compute solved count and verdict analytics
    let solvedCount = 0
    let cfSubmissionsData: {
      total: number
      solvedCount: number
      verdicts: Record<string, number>
      activity: { date: string; count: number; problems?: string[] }[]
    } | null = null

    try {
      const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=10000`, {
        headers: { 'User-Agent': 'OlympLab/1.0' },
        cache: 'no-store',
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.status === 'OK' && Array.isArray(statusData.result)) {
          const solvedSet = new Set<string>()
          const dailySolvedProblems = new Map<string, Set<string>>()
          const verdictsCount: Record<string, number> = {
            AC: 0,
            WA: 0,
            TLE: 0,
            MLE: 0,
            RE: 0,
            CE: 0,
            OTHER: 0
          }

          for (const sub of statusData.result) {
            const isSolved = sub.verdict === 'OK'
            const problemKey = (sub.problem?.contestId && sub.problem?.index)
              ? `cf-${sub.problem.contestId}/${sub.problem.index}`.toLowerCase()
              : (sub.problem?.name ? `name-${sub.problem.name}`.toLowerCase() : null)

            // Track unique solved problems
            if (isSolved && problemKey) {
              solvedSet.add(problemKey)

              // Track unique solved problems for activity heatmap date
              if (sub.creationTimeSeconds) {
                const dateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0]
                if (!dailySolvedProblems.has(dateStr)) {
                  dailySolvedProblems.set(dateStr, new Set())
                }
                dailySolvedProblems.get(dateStr)!.add(problemKey)
              }
            }

            // Tally verdicts
            if (sub.verdict) {
              const v = sub.verdict.toUpperCase()
              if (v === 'OK') verdictsCount.AC++
              else if (v === 'WRONG_ANSWER') verdictsCount.WA++
              else if (v === 'TIME_LIMIT_EXCEEDED') verdictsCount.TLE++
              else if (v === 'MEMORY_LIMIT_EXCEEDED') verdictsCount.MLE++
              else if (v === 'RUNTIME_ERROR') verdictsCount.RE++
              else if (v === 'COMPILATION_ERROR') verdictsCount.CE++
              else verdictsCount.OTHER++
            }
          }

          solvedCount = solvedSet.size
          cfSubmissionsData = {
            total: statusData.result.length,
            solvedCount,
            verdicts: verdictsCount,
            activity: Array.from(dailySolvedProblems.entries()).map(([date, probSet]) => ({
              date,
              count: probSet.size,
              problems: Array.from(probSet)
            }))
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch CF solved count and verdicts:', e)
    }

    // 3. Save to Supabase profiles
    const now = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      cf_handle: cleanHandle,
      cf_rating: rating,
      cf_max_rating: maxRating,
      cf_rank: rank,
      cf_avatar: avatar,
      cf_last_synced_at: now,
    }

    // If user has no avatar set, or existing avatar is an old cf avatar, inherit CF avatar
    const { data: curProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (avatar && (!curProfile?.avatar_url || curProfile.avatar_url.includes('codeforces.org'))) {
      updatePayload.avatar_url = avatar
    }

    if (solvedCount > 0) {
      updatePayload.solved_count = solvedCount
    }
    if (cfSubmissionsData) {
      updatePayload.cf_submissions_data = cfSubmissionsData
    }

    updatePayload.id = user.id

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    let admin = null
    if (url && serviceKey) {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      admin = createAdminClient(url, serviceKey)
    }
    const dbClient = admin || supabase

    const { error: updateError } = await dbClient
      .from('profiles')
      .upsert(updatePayload as never)

    if (updateError) {
      console.error('Failed to update profile with CF data:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    // Sync auth user metadata
    try {
      const metaUpdate: Record<string, unknown> = {
        cf_handle: cleanHandle,
      }
      if (avatar && updatePayload.avatar_url) {
        metaUpdate.avatar_url = avatar
      }
      if (admin) {
        await admin.auth.admin.updateUserById(user.id, { user_metadata: metaUpdate })
      } else {
        await supabase.auth.updateUser({ data: metaUpdate })
      }
    } catch (authErr) {
      console.warn('Could not sync user_metadata during CF sync:', authErr)
    }

    return NextResponse.json({
      success: true,
      handle: cleanHandle,
      rating,
      maxRating,
      rank,
      avatar,
      avatar_url: updatePayload.avatar_url || curProfile?.avatar_url || avatar,
      solvedCount,
      verdicts: cfSubmissionsData?.verdicts,
      lastSyncedAt: now,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during CF sync'
    console.error('Codeforces sync route exception:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
