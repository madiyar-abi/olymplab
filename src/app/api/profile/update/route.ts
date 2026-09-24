import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    let cleanAvatar = avatar_url && typeof avatar_url === 'string' ? avatar_url.trim() : null
    if (cleanAvatar && cleanAvatar.startsWith('//')) {
      cleanAvatar = `https:${cleanAvatar}`
    }
    const cleanCfHandle = cf_handle && typeof cf_handle === 'string' ? cf_handle.trim() : null

    // Update public.profiles
    const updatePayload: Record<string, unknown> = {
      username: cleanUsername,
      avatar_url: cleanAvatar,
    }
    if (cleanCfHandle !== undefined) {
      updatePayload.cf_handle = cleanCfHandle
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id)

    if (dbError) {
      console.error('Failed to update profile DB:', dbError)
      return NextResponse.json({ error: dbError.message || 'Ошибка обновления профиля' }, { status: 500 })
    }

    // Sync auth metadata
    try {
      await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          name: cleanUsername,
          avatar_url: cleanAvatar,
        }
      })
    } catch (authErr) {
      console.warn('Could not update user_metadata:', authErr)
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      avatar_url: cleanAvatar,
      cf_handle: cleanCfHandle,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
    console.error('Profile update route error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
