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
  const { data: profileData } = await supabase
    .from('profiles')
    .select('code_template, settings')
    .eq('id', user.id)
    .single()

  const profile = profileData as { 
    code_template: string | null;
    settings: { sound_enabled: boolean } | null;
  } | null
  const codeTemplate = profile?.code_template || ''
  const settings = profile?.settings || { sound_enabled: true }

  return (
    <div className="min-h-full p-4 md:p-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
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
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <CodeTemplateEditor initialTemplate={codeTemplate} />
          </div>
        </div>

        {/* Settings Editor */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground pt-4 font-mono uppercase tracking-widest text-muted-foreground">
            Preferences
          </h3>
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <SettingsEditor initialSettings={settings} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
