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
    const updatePayload: Record<string, unknown> = {}

    if (typeof body.hide_unsolved_tags === 'boolean') {
      updatePayload.hide_unsolved_tags = body.hide_unsolved_tags
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()
      const currentSettings = (currentProfile?.settings as Record<string, unknown>) || {}
      updatePayload.settings = { ...currentSettings, hide_unsolved_tags: body.hide_unsolved_tags }
    }

    if (typeof body.problems_view === 'string' && (body.problems_view === 'table' || body.problems_view === 'grid')) {
      updatePayload.problems_view = body.problems_view
    }

    if (typeof body.preferred_language === 'string') {
      updatePayload.preferred_language = body.preferred_language
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id)

    if (error) {
      console.error('Failed to update user preferences:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const res = NextResponse.json({ success: true, updated: updatePayload })
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
