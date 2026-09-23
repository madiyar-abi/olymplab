'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Volume2, VolumeX, Save, Check, EyeOff, Eye, Code2, Trophy, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface SettingsEditorProps {
  initialSettings: { sound_enabled: boolean }
  initialHideSpoilers?: boolean
  initialPreferredLanguage?: string
  initialCfHandle?: string
  userId: string
}

const SUPPORTED_LANGUAGES = [
  { value: 'cpp', label: 'C++ 20 (GCC)' },
  { value: 'python', label: 'Python 3.11' },
  { value: 'java', label: 'Java 21 (OpenJDK)' },
  { value: 'rust', label: 'Rust 1.75' },
  { value: 'go', label: 'Go 1.22' },
]

export function SettingsEditor({
  initialSettings,
  initialHideSpoilers = true,
  initialPreferredLanguage = 'cpp',
  initialCfHandle = '',
  userId
}: SettingsEditorProps) {
  const t = useTranslations('Settings')
  const [soundEnabled, setSoundEnabled] = useState(initialSettings?.sound_enabled ?? true)
  const [hideSpoilers, setHideSpoilers] = useState(initialHideSpoilers)
  const [preferredLang, setPreferredLang] = useState(initialPreferredLanguage)
  const [cfHandle, setCfHandle] = useState(initialCfHandle)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const supabase = createClient()

  const saveSettings = async () => {
    setIsSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        settings: { sound_enabled: soundEnabled },
        hide_unsolved_tags: hideSpoilers,
        preferred_language: preferredLang,
        cf_handle: cfHandle.trim() || null,
      } as never)
      .eq('id', userId)

    if (!error) {
      setHasSaved(true)
      setTimeout(() => setHasSaved(false), 3000)
    }
    setIsSaving(false)
  }

  const [isSyncingCf, setIsSyncingCf] = useState(false)
  const [cfSyncResult, setCfSyncResult] = useState<{
    rank?: string;
    rating?: number | null;
    solvedCount?: number;
  } | null>(null)

  const handleSyncCf = async () => {
    if (!cfHandle.trim()) {
      toast.error('Enter Codeforces handle')
      return
    }
    setIsSyncingCf(true)
    try {
      const res = await fetch('/api/codeforces/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: cfHandle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to sync with Codeforces')
      } else {
        setCfSyncResult({
          rank: data.rank,
          rating: data.rating,
          solvedCount: data.solvedCount,
        })
        toast.success(`Codeforces synced: ${data.rank} (${data.rating ?? 'unrated'})`)
      }
    } catch {
      toast.error('Network error during Codeforces sync')
    } finally {
      setIsSyncingCf(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground font-mono uppercase tracking-widest">{t('interfaceSettings')}</h3>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {t('interfaceSettingsDesc')}
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className={cn(
            "gap-2 px-6",
            hasSaved && 'bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20 shadow-none scale-100'
          )}
          variant={hasSaved ? "outline" : "primary"}
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : hasSaved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {hasSaved ? t('savedShort') : t('save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-cyan-500/10 text-cyan-500' : 'bg-muted text-muted-foreground'}`}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-foreground font-mono text-sm">{t('audioTitle')}</p>
              <p className="text-xs text-muted-foreground font-mono">{t('audioDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => { setSoundEnabled(!soundEnabled); setHasSaved(false); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              soundEnabled ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Spoiler Prevention Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg transition-colors ${hideSpoilers ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
              {hideSpoilers ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-foreground font-mono text-sm">{t('spoilersTitle')}</p>
              <p className="text-xs text-muted-foreground font-mono">{t('spoilersDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => { setHideSpoilers(!hideSpoilers); setHasSaved(false); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              hideSpoilers ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hideSpoilers ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Default Programming Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors gap-3">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground font-mono text-sm">{t('preferredLanguageTitle')}</p>
              <p className="text-xs text-muted-foreground font-mono">{t('preferredLanguageDesc')}</p>
            </div>
          </div>
          <select
            value={preferredLang}
            onChange={(e) => { setPreferredLang(e.target.value); setHasSaved(false); }}
            className="bg-secondary border border-border text-foreground text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-primary shrink-0 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        {/* Codeforces Handle */}
        <div className="flex flex-col p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground font-mono text-sm">{t('cfHandleTitle')}</p>
                <p className="text-xs text-muted-foreground font-mono">{t('cfHandleDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={cfHandle}
                onChange={(e) => { setCfHandle(e.target.value); setHasSaved(false); }}
                placeholder={t('cfHandlePlaceholder')}
                className="bg-secondary border border-border text-foreground text-xs font-mono rounded-lg px-3 py-2 w-44 focus:outline-none focus:border-primary placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={handleSyncCf}
                disabled={isSyncingCf || !cfHandle.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 text-xs font-mono font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSyncingCf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync</span>
              </button>
            </div>
          </div>
          {cfSyncResult && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 text-xs font-mono">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Sync:</span>
              <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold uppercase tracking-wider text-[10px] border border-orange-500/20">
                {cfSyncResult.rank}
              </span>
              {cfSyncResult.rating !== null && (
                <span className="text-foreground font-bold">★ {cfSyncResult.rating}</span>
              )}
              {cfSyncResult.solvedCount !== undefined && (
                <span className="text-muted-foreground">CF Solved: <b className="text-emerald-400">{cfSyncResult.solvedCount}</b></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
