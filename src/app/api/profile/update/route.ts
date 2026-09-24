import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createAdminClient(url, serviceKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { username, avatar_url, cf_handle } = body

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Имя пользователя должно содержать минимум 2 символа' }, { status: 400 })
    }

    const cleanUsername = username.trim()
    let cleanAvatar = avatar_url && typeof avatar_url === 'string' && avatar_url.trim().length > 0
      ? avatar_url.trim()
      : null

    if (cleanAvatar && cleanAvatar.startsWith('//')) {
      cleanAvatar = `https:${cleanAvatar}`
    }

    const cleanCfHandle = cf_handle && typeof cf_handle === 'string' && cf_handle.trim().length > 0
      ? cf_handle.trim()
      : null

    // Prepare update payload
    const updatePayload: Record<string, unknown> = {
      id: user.id,
      username: cleanUsername,
      avatar_url: cleanAvatar,
    }

    if (cf_handle !== undefined) {
      updatePayload.cf_handle = cleanCfHandle
      if (!cleanCfHandle) {
        updatePayload.cf_rating = null
        updatePayload.cf_rank = null
        updatePayload.cf_avatar = null
      }
    }

    // If a Codeforces handle is provided, try to fetch info right away
    let cfInfo: { rating?: number | null; rank?: string | null; avatar?: string | null } = {}
    if (cleanCfHandle) {
      try {
        const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanCfHandle)}`, {
          headers: { 'User-Agent': 'OlympLab/1.0' },
          cache: 'no-store',
        })
        if (cfRes.ok) {
          const cfData = await cfRes.json()
          if (cfData.status === 'OK' && cfData.result?.[0]) {
            const u = cfData.result[0]
            let cfAv = u.titlePhoto || u.avatar || null
            if (cfAv && cfAv.startsWith('//')) cfAv = `https:${cfAv}`
            cfInfo = {
              rating: u.rating ?? null,
              rank: u.rank ?? 'unrated',
              avatar: cfAv,
            }
            updatePayload.cf_rating = cfInfo.rating
            updatePayload.cf_rank = cfInfo.rank
            updatePayload.cf_avatar = cfInfo.avatar
            updatePayload.cf_last_synced_at = new Date().toISOString()
            // If user hasn't set an explicit custom avatar, use CF avatar
            if (!cleanAvatar && cfAv) {
              cleanAvatar = cfAv
              updatePayload.avatar_url = cfAv
            }
          }
        }
      } catch (cfErr) {
        console.warn('CF info quick lookup failed:', cfErr)
      }
    }

    // Upsert into profiles using admin client (bypasses RLS to guarantee persistence) or user client
    const admin = getAdminClient()
    const dbClient = admin || supabase

    const { data: savedProfile, error: dbError } = await dbClient
      .from('profiles')
      .upsert(updatePayload as never)
      .select('username, avatar_url, cf_handle, cf_rating, cf_rank, cf_avatar')
      .single()

    if (dbError) {
      console.error('Failed to update profile DB:', dbError)
      return NextResponse.json({ error: dbError.message || 'Ошибка обновления профиля' }, { status: 500 })
    }

    // Sync auth user metadata
    try {
      const metaUpdate: Record<string, unknown> = {
        username: cleanUsername,
        name: cleanUsername,
        avatar_url: cleanAvatar,
      }
      if (cf_handle !== undefined) {
        metaUpdate.cf_handle = cleanCfHandle
      }

      if (admin) {
        await admin.auth.admin.updateUserById(user.id, { user_metadata: metaUpdate })
      } else {
        await supabase.auth.updateUser({ data: metaUpdate })
      }
    } catch (authErr) {
      console.warn('Could not update user_metadata:', authErr)
    }

    return NextResponse.json({
      success: true,
      username: savedProfile?.username ?? cleanUsername,
      avatar_url: savedProfile?.avatar_url ?? cleanAvatar,
      cf_handle: savedProfile?.cf_handle ?? cleanCfHandle,
      cf_rating: savedProfile?.cf_rating ?? cfInfo.rating ?? null,
      cf_rank: savedProfile?.cf_rank ?? cfInfo.rank ?? null,
      cf_avatar: savedProfile?.cf_avatar ?? cfInfo.avatar ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
    console.error('Profile update route error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
