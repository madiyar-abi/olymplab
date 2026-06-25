'use client'

import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CopyButton } from '@/components/ui/CopyButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface MentorMessage {
  role: 'user' | 'model'
  text: string
}

interface MentorTabProps {
  mentorHistory: MentorMessage[]
  isMentorThinking: boolean
  chatInput: string
  setChatInput: (v: string) => void
  onSendMessage: (isInitial?: boolean) => void
}

export function MentorTab({
  mentorHistory,
  isMentorThinking,
  chatInput,
  setChatInput,
  onSendMessage,
}: MentorTabProps) {
  const t = useTranslations('IDE')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [mentorHistory, isMentorThinking])

  return (
    <div className="h-full flex flex-col font-mono text-sm text-foreground overflow-hidden">
      {mentorHistory.length === 0 && !isMentorThinking ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
          <Bot className="w-8 h-8 text-muted-foreground/50" />
          <p className="max-w-md text-center text-xs">
            {t('mentorEmptyHint')}
          </p>
          <Button
            onClick={() => onSendMessage(true)}
            variant="outline"
            className="mt-2 text-purple-600 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
          >
            {t('mentorStartAnalysis')}
          </Button>
        </div>
      ) : (
        <>
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-4">
            {mentorHistory.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-secondary/50 border border-border rounded-bl-none'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/80 prose-pre:border prose-pre:border-border prose-pre:whitespace-pre-wrap">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
                        components={{
                          pre: ({ children }) => <div className="not-prose my-4">{children}</div>,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          code: (props: any) => {
                            const { children, className, ...rest } = props
                            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
                            const contentString = String(children).replace(/\n$/, '')
                            const isInline = !match && !contentString.includes('\n')
                            if (isInline) {
                              return (
                                <code className="bg-secondary/80 px-1 py-0.5 rounded text-cyan-500 font-mono text-[0.9em]" {...rest}>
                                  {children}
                                </code>
                              )
                            }
                            return (
                              <div className="relative group rounded-xl overflow-hidden border border-border bg-background/50">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/30 border-b border-border/50">
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                    {match ? match[1] : 'code'}
                                  </span>
                                  <CopyButton value={contentString} className="h-6 px-2 text-[10px]" />
                                </div>
                                <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed">
                                  <code className={className} {...rest}>{children}</code>
                                </pre>
                              </div>
                            )
                          },
                        }}
                      >
                        {msg.text
                          .replace(/\$\$\$/g, '$')
                          .replace(/∗/g, '$\\ast$')
                          .replace(/†/g, '$\\dagger$')
                          .replace(/‡/g, '$\\ddagger$')}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.role === 'user' ? t('mentorYou') : t('mentorName')}
                </span>
              </div>
            ))}

            {isMentorThinking && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-secondary/50 border border-border rounded-bl-none flex items-center gap-3">
                  <span className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <span className="animate-pulse text-xs font-semibold text-muted-foreground">{t('mentorThinking')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border mt-2 shrink-0">
            <div className="flex gap-2">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSendMessage(false)
                  }
                }}
                placeholder={t('mentorPlaceholder')}
                className="flex-1 focus:ring-purple-500/50"
                disabled={isMentorThinking}
              />
              <Button
                onClick={() => onSendMessage(false)}
                disabled={!chatInput.trim() || isMentorThinking}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('mentorSend')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
