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
    const updatePayload: Record<string, unknown> = {
      id: user.id,
    }

    // Fetch existing settings to merge safely
    const admin = getAdminClient()
    const dbClient = admin || supabase

    const { data: currentProfile } = await dbClient
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single()

    const currentSettings = ((currentProfile?.settings as Record<string, unknown>) || { sound_enabled: true })

    if (typeof body.hide_unsolved_tags === 'boolean') {
      updatePayload.hide_unsolved_tags = body.hide_unsolved_tags
      currentSettings.hide_unsolved_tags = body.hide_unsolved_tags
    }

    if (typeof body.sound_enabled === 'boolean') {
      currentSettings.sound_enabled = body.sound_enabled
    }

    if (body.settings && typeof body.settings === 'object') {
      Object.assign(currentSettings, body.settings)
      if (typeof body.settings.hide_unsolved_tags === 'boolean') {
        updatePayload.hide_unsolved_tags = body.settings.hide_unsolved_tags
      }
    }

    updatePayload.settings = currentSettings

    if (typeof body.problems_view === 'string' && (body.problems_view === 'table' || body.problems_view === 'grid')) {
      updatePayload.problems_view = body.problems_view
    }

    if (typeof body.preferred_language === 'string') {
      updatePayload.preferred_language = body.preferred_language
    }

    if (typeof body.code_template === 'string') {
      updatePayload.code_template = body.code_template
    }

    if (body.cf_handle !== undefined) {
      updatePayload.cf_handle = typeof body.cf_handle === 'string' && body.cf_handle.trim().length > 0
        ? body.cf_handle.trim()
        : null
    }

    const { data: savedProfile, error } = await dbClient
      .from('profiles')
      .upsert(updatePayload as never)
      .select()
      .single()

    if (error) {
      console.error('Failed to update user preferences:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const res = NextResponse.json({ success: true, updated: savedProfile || updatePayload })

    if (typeof body.hide_unsolved_tags === 'boolean') {
      res.cookies.set('hide-unsolved-tags', String(body.hide_unsolved_tags), { path: '/', maxAge: 31536000, sameSite: 'lax' })
    }
    if (typeof body.problems_view === 'string') {
      res.cookies.set('problems-view', body.problems_view, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    }

    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Preferences update failed'
    console.error('Preferences route error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
