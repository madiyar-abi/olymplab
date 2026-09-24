'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { toast } from '@/components/ui/Toast'
import {
  Trophy,
  Edit3,
  Check,
  X,
  Camera,
  Sparkles,
  User as UserIcon,
  RefreshCw,
  Loader2,
  ExternalLink,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileHeaderEditorProps {
  userId: string
  initialUsername: string
  initialAvatarUrl?: string | null
  cfHandle?: string | null
  cfRating?: number | null
  cfRank?: string | null
  cfAvatar?: string | null
  email: string
  level?: number
}

const PRESET_AVATARS = [
  { id: 'neo', name: 'Cyber Neo', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neo&backgroundColor=0b0f1e' },
  { id: 'turing', name: 'Alan Turing', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Turing&backgroundColor=111827' },
  { id: 'lovelace', name: 'Ada Lovelace', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lovelace&backgroundColor=1e1b4b' },
  { id: 'euler', name: 'Leonhard Euler', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Euler&backgroundColor=064e3b' },
  { id: 'grandmaster', name: 'Grandmaster', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Grandmaster&backgroundColor=701a75' },
  { id: 'cosmic', name: 'Cosmic Coder', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmic&backgroundColor=1e293b' },
]

export function ProfileHeaderEditor({
  userId: _userId,
  initialUsername,
  initialAvatarUrl,
  cfHandle: initialCfHandle,
  cfRating: initialCfRating,
  cfRank: initialCfRank,
  cfAvatar: initialCfAvatar,
  email,
  level = 1,
}: ProfileHeaderEditorProps) {
  const t = useTranslations('Profile')
  const router = useRouter()

  // Display State
  const [username, setUsername] = useState(initialUsername)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null)
  const [cfHandle, setCfHandle] = useState<string | null>(initialCfHandle || null)
  const [cfRating, setCfRating] = useState<number | null>(initialCfRating || null)
  const [cfRank, setCfRank] = useState<string | null>(initialCfRank || null)
  const [cfAvatar, setCfAvatar] = useState<string | null>(initialCfAvatar || null)

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(initialUsername)
  const [editAvatar, setEditAvatar] = useState<string | null>(initialAvatarUrl || null)
  const [editCfHandle, setEditCfHandle] = useState(initialCfHandle || '')
  const [customUrlInput, setCustomUrlInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingCf, setIsSyncingCf] = useState(false)

  const activeAvatar = isEditing
    ? (customUrlInput.trim() || editAvatar || null)
    : (avatarUrl || cfAvatar)

  const handleStartEdit = () => {
    setEditName(username)
    setEditAvatar(avatarUrl)
    setEditCfHandle(cfHandle || '')
    setCustomUrlInput(avatarUrl && !PRESET_AVATARS.some(p => p.url === avatarUrl) && avatarUrl !== cfAvatar ? avatarUrl : '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSyncCf = async () => {
    const handleToSync = editCfHandle.trim()
    if (!handleToSync) {
      toast.error('Введите никнейм на Codeforces')
      return
    }

    setIsSyncingCf(true)
    try {
      const res = await fetch('/api/codeforces/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handleToSync }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Ошибка синхронизации с Codeforces')
      } else {
        setCfHandle(data.handle || handleToSync)
        setCfRating(data.rating ?? null)
        setCfRank(data.rank ?? 'unrated')
        if (data.avatar) {
          setCfAvatar(data.avatar)
        }
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url)
          setEditAvatar(data.avatar_url)
        }
        toast.success(`Codeforces синхронизирован: ${data.rank} (${data.rating ?? 'unrated'})`)
        router.refresh()
      }
    } catch {
      toast.error('Сетевая ошибка при синхронизации')
    } finally {
      setIsSyncingCf(false)
    }
  }

  const handleSave = async () => {
    const trimmedName = editName.trim()
    if (!trimmedName || trimmedName.length < 2) {
      toast.error(t('nameTooShort'))
      return
    }

    setIsSaving(true)
    try {
      const finalAvatar = customUrlInput.trim() || editAvatar || null
      const cleanCfHandle = editCfHandle.trim() || null

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedName,
          avatar_url: finalAvatar,
          cf_handle: cleanCfHandle,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить профиль')
      }

      setUsername(data.username || trimmedName)
      setAvatarUrl(data.avatar_url ?? finalAvatar)
      setCfHandle(data.cf_handle ?? cleanCfHandle)
      if (data.cf_rating !== undefined) setCfRating(data.cf_rating)
      if (data.cf_rank !== undefined) setCfRank(data.cf_rank)
      if (data.cf_avatar !== undefined) setCfAvatar(data.cf_avatar)
      setIsEditing(false)
      toast.success(t('profileUpdated'))

      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось сохранить профиль'
      console.error('Profile update error:', msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8 transition-all duration-300 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Display */}
        <div className="relative group shrink-0">
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground font-semibold text-4xl overflow-hidden shadow-inner">
            {activeAvatar ? (
              <img
                key={activeAvatar}
                src={activeAvatar}
                alt={isEditing ? editName : username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span className="font-mono">{(isEditing ? editName.trim() || username : username).charAt(0).toUpperCase()}</span>
            )}
          </div>

          <button
            onClick={handleStartEdit}
            className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={t('editAvatar')}
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left space-y-2.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate font-sans">
                {username}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{email}</p>
            </div>

            <button
              onClick={handleStartEdit}
              className="self-center sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary/80 hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('editProfile')}</span>
            </button>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
              {t('statusLabel')}: {t('statusActive')}
            </span>

            <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
              Level {level}
            </span>

            {cfHandle && (
              <a
                href={`https://codeforces.com/profile/${cfHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold font-mono tracking-wider text-amber-500 hover:bg-amber-500/20 transition-all shadow-sm"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>CF: {cfHandle}</span>
                {cfRating && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold text-[10px]">
                    ★ {cfRating}
                  </span>
                )}
                {cfRank && (
                  <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">
                    ({cfRank})
                  </span>
                )}
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Inline Profile Editor */}
      {isEditing && (
        <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t('editProfile')}</span>
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block font-mono">
                {t('username')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ваше имя"
                  maxLength={32}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all pl-9"
                />
                <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-muted-foreground">{t('usernameDesc')}</p>
            </div>

            {/* Codeforces Handle Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block font-mono">
                {t('cfHandle')}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={editCfHandle}
                    onChange={(e) => setEditCfHandle(e.target.value)}
                    placeholder="например tourist"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all pl-9"
                  />
                  <Trophy className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleSyncCf}
                  disabled={isSyncingCf || !editCfHandle.trim()}
                  className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold font-mono flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Синхронизировать данные с Codeforces"
                >
                  {isSyncingCf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isSyncingCf ? t('syncingCf') : t('syncCf')}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">{t('cfHandleDesc')}</p>
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground block font-mono">
                {t('choosePresetAvatar')}
              </label>
              <div className="flex items-center gap-2">
                {cfAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditAvatar(cfAvatar)
                      setCustomUrlInput('')
                    }}
                    className={cn(
                      "text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer",
                      editAvatar === cfAvatar
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    <img src={cfAvatar} alt="CF" className="w-4 h-4 rounded-full object-cover" />
                    <span>{t('useCfAvatar')}</span>
                  </button>
                )}
                {(editAvatar || customUrlInput) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditAvatar(null)
                      setCustomUrlInput('')
                    }}
                    className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border border-border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Сбросить аватар к стандартной букве"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Сбросить (буква)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = editAvatar === preset.url && !customUrlInput.trim()
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEditAvatar(preset.url)
                      setCustomUrlInput('')
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all text-center group cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/15 ring-2 ring-primary/50 shadow-sm'
                        : 'border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40'
                    )}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-foreground truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Avatar URL Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block font-mono">
              {t('customAvatarUrl')}
            </label>
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => {
                const val = e.target.value
                setCustomUrlInput(val)
                if (val.trim()) {
                  setEditAvatar(val.trim())
                }
              }}
              placeholder="https://example.com/avatar.png"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Или выберите готового алгоритмического персонажа выше.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? t('saving') : t('save')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
