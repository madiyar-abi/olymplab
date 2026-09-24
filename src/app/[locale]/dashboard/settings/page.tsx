import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CodeTemplateEditor } from '../profile/CodeTemplateEditor'
import { SettingsEditor } from '../profile/SettingsEditor'

export const dynamic = 'force-dynamic'

type SettingsProfile = {
  settings: { sound_enabled: boolean } | null
  code_template: string | null
  preferred_language: string | null
  hide_unsolved_tags: boolean | null
  cf_handle: string | null
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('Settings')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('settings, code_template, preferred_language, hide_unsolved_tags, cf_handle')
    .eq('id', user.id)
    .single()

  let profile: SettingsProfile | null = profileData as SettingsProfile | null

  if (!profile) {
    const metaUsername = (user.user_metadata?.username as string) || (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'User'
    const { data: newRow } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: metaUsername,
        settings: { sound_enabled: true },
        preferred_language: 'cpp',
        hide_unsolved_tags: true,
        primary_subject: 'C++ Programming',
        experience_level: 'Intermediate',
      } as never)
      .select('settings, code_template, preferred_language, hide_unsolved_tags, cf_handle')
      .single()
    if (newRow) {
      profile = newRow as unknown as SettingsProfile
    }
  }

  const codeTemplate = profile?.code_template || ''
  const settings = profile?.settings || { sound_enabled: true }
  const preferredLanguage = profile?.preferred_language || 'cpp'
  const hideSpoilers = profile?.hide_unsolved_tags ?? true
  const cfHandle = profile?.cf_handle || ''

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {t('subtitle')}
          </p>
        </header>

        {/* Code Template Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
            {t('codeTemplate')}
          </h3>
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]">
            <CodeTemplateEditor 
              key={`template-${user.id}-${preferredLanguage}-${codeTemplate.length}`}
              initialTemplate={codeTemplate} 
              initialLanguage={preferredLanguage}
            />
          </div>
        </div>

        {/* Settings Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
            {t('preferences')}
          </h3>
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]">
            <SettingsEditor 
              key={`settings-${user.id}-${settings.sound_enabled}-${hideSpoilers}-${preferredLanguage}-${cfHandle}`}
              initialSettings={settings} 
              initialHideSpoilers={hideSpoilers}
              initialPreferredLanguage={preferredLanguage}
              initialCfHandle={cfHandle}
              userId={user.id} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
