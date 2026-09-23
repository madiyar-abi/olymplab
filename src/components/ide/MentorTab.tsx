'use client'

import { Bot } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface MentorMessage {
  role: 'user' | 'model'
  text: string
}

interface MentorTabProps {
  mentorHistory?: MentorMessage[]
  isMentorThinking?: boolean
  chatInput?: string
  setChatInput?: (v: string) => void
  onSendMessage?: (isInitial?: boolean) => void
}

export function MentorTab({}: MentorTabProps) {
  const locale = useLocale()

  // In development state as requested
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/5">
          <Bot className="w-7 h-7" />
        </div>
        <span className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow uppercase tracking-wider">
          {locale === 'ru' ? 'В разработке' : 'Coming Soon'}
        </span>
      </div>

      <h3 className="text-sm font-bold text-foreground mb-1">
        {locale === 'ru' ? 'ИИ-Наставник (В разработке)' : 'AI Mentor (Under Development)'}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mb-5">
        {locale === 'ru'
          ? 'Мы обучаем олимпиадного ИИ-тренера: он будет давать подсказки без прямых спойлеров, объяснять асимптотику и разбирать неверные тесты.'
          : 'We are training an Olympiad AI coach to provide spoiler-free hints, explain asymptotic complexity, and analyze failing test cases.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-muted-foreground">
          ✨ {locale === 'ru' ? 'Умные подсказки' : 'Smart hints'}
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-muted-foreground">
          🔍 {locale === 'ru' ? 'Анализ WA и TL' : 'WA & TL analysis'}
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-muted-foreground">
          ⚡ {locale === 'ru' ? 'Оптимизация кода' : 'Code optimization'}
        </span>
      </div>
    </div>
  )
}

