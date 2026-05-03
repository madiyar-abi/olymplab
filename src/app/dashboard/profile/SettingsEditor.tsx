'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Volume2, VolumeX, Save, Check } from 'lucide-react'

type ProfileSettings = {
  sound_enabled: boolean
}

interface SettingsEditorProps {
  initialSettings: ProfileSettings
  userId: string
}

export function SettingsEditor({ initialSettings, userId }: SettingsEditorProps) {
  const [settings, setSettings] = useState<ProfileSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const supabase = createClient()

  const handleToggleSound = async () => {
    const newSettings = { ...settings, sound_enabled: !settings.sound_enabled }
    setSettings(newSettings)
    setHasSaved(false)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('profiles')
      .update({ settings: settings })
      .eq('id', userId)

    if (!error) {
      setHasSaved(true)
      setTimeout(() => setHasSaved(false), 3000)
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground font-mono uppercase tracking-widest">Interface Settings</h3>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Customize your interaction experience.
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all border ${
            hasSaved 
              ? 'bg-green-500/10 border-green-500/50 text-green-500' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : hasSaved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {hasSaved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg transition-colors ${settings.sound_enabled ? 'bg-cyan-500/10 text-cyan-500' : 'bg-muted text-muted-foreground'}`}>
              {settings.sound_enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-foreground font-mono text-sm">Audio Micro-interactions</p>
              <p className="text-xs text-muted-foreground font-mono">Enable premium sound effects for successful submissions.</p>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.sound_enabled ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
