import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CodeTemplateEditor } from '../profile/CodeTemplateEditor'
import { SettingsEditor } from '../profile/SettingsEditor'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch username, code_template, and settings from profiles table
  // (code_template / preferred_language columns may not exist yet — handle gracefully)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single()

  const { data: extendedData } = await (supabase as any)
    .from('profiles')
    .select('code_template, preferred_language')
    .eq('id', user.id)
    .single()

  const profile = profileData as { settings: { sound_enabled: boolean } | null } | null
  const extended = extendedData as { code_template: string | null; preferred_language: string | null } | null

  const codeTemplate = extended?.code_template || ''
  const settings = profile?.settings || { sound_enabled: true }
  const preferredLanguage = extended?.preferred_language || 'cpp'

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono">
            Settings
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Configure your development environment and preferences.
          </p>
        </header>

        {/* Code Template Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
            Code Template
          </h3>
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]">
            <CodeTemplateEditor 
              initialTemplate={codeTemplate} 
              initialLanguage={preferredLanguage}
            />
          </div>
        </div>

        {/* Settings Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
            Preferences
          </h3>
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.2)]">
            <SettingsEditor initialSettings={settings} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
