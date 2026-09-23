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
    const avatar = cfUser.titlePhoto || cfUser.avatar || null

    // 2. Fetch submissions to compute solved count
    let solvedCount = 0
    try {
      const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=10000`, {
        headers: { 'User-Agent': 'OlympLab/1.0' },
        cache: 'no-store',
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.status === 'OK' && Array.isArray(statusData.result)) {
          const solvedSet = new Set<string>()
          for (const sub of statusData.result) {
            if (sub.verdict === 'OK' && sub.problem && sub.problem.contestId && sub.problem.index) {
              solvedSet.add(`${sub.problem.contestId}-${sub.problem.index}`)
            }
          }
          solvedCount = solvedSet.size
        }
      }
    } catch (e) {
      console.warn('Could not fetch CF solved count:', e)
    }

    // 3. Save to Supabase profiles
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        cf_handle: cleanHandle,
        cf_rating: rating,
        cf_max_rating: maxRating,
        cf_rank: rank,
        cf_avatar: avatar,
        cf_last_synced_at: now,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update profile with CF data:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      handle: cleanHandle,
      rating,
      maxRating,
      rank,
      avatar,
      solvedCount,
      lastSyncedAt: now,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during CF sync'
    console.error('Codeforces sync route exception:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
