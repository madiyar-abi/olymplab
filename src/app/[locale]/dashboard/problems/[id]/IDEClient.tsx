'use client'

import { useEffect, useRef, useState, useCallback, ChangeEvent, useMemo, useSyncExternalStore, ComponentPropsWithoutRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Clock, Cpu, Flag, Maximize2, Minimize2, Timer as TimerIcon, Bot, Paperclip, History, Check, Loader2 } from 'lucide-react'
import { MentorTab } from '@/components/ide/MentorTab'
import { SubmissionsTab } from '@/components/ide/SubmissionsTab'
import { HistoryTab } from '@/components/ide/HistoryTab'
import { SubmissionModal } from '@/components/ide/SubmissionModal'
import confetti from 'canvas-confetti'
import { useTheme } from '@/components/shared/ThemeProvider'
import { playSuccessSound } from '@/lib/audio'
import { CopyButton } from '@/components/ui/CopyButton'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useAutoSaveCode, SaveStatus } from '@/hooks/useAutoSaveCode'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/ui/Toast'

export interface SkillReq {
  level: number
  weight: number
}

const AutoSaveStatus = ({ status }: { status: SaveStatus }) => {
  const t = useTranslations('IDE')
  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 transition-all duration-300">
      {status === 'saving' ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
          <span>{t('saving')}</span>
        </>
      ) : status === 'saved' ? (
        <>
          <Check className="w-3 h-3 text-emerald-500" />
          <span>{t('savedLocally')}</span>
        </>
      ) : (
        <span className="animate-pulse">{t('edited')}</span>
      )}
    </div>
  )
}

export interface Problem {
  id: string
  title: string
  description: string
  note: string | null
  difficulty: string
  requirements: Record<string, SkillReq>
  sample_input: string | null
  sample_output: string | null
  external_id: string | null
  time_limit?: string
  memory_limit?: string
  difficulty_rating?: number
  submission_stats?: {
    solved_count: number
  }
}

export interface IDEClientProps {
  problem: Problem
  initialCode?: string
  initialLanguage?: string
  settings?: {
    sound_enabled: boolean
    hide_unsolved_tags?: boolean
    revealed_ids?: string[]
  }
  isSolved?: boolean
  initialIsRevealed?: boolean
}

export interface Submission {
  id: string
  status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR'
  verdict: string | null
  language: string | null
  test_case?: number
  time_ms?: number
  memory_kb?: number
  created_at: string
  code?: string
}

export interface FlaggedProblem {
  id: string
  title: string
  difficulty: string
  requirements: Record<string, SkillReq>
}

const Timer = () => {
  const t = useTranslations('IDE')
  const [seconds, setSeconds] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-mono text-xs text-muted-foreground hover:bg-secondary transition-colors shrink-0"
      >
        <TimerIcon className="w-4 h-4" />
        <span>{t('showTimer')}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setIsVisible(false)}
      title={t('hideTimer')}
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-mono text-sm text-foreground/80 hover:bg-secondary transition-colors shrink-0"
    >
      <TimerIcon className="w-4 h-4 text-cyan-500" />
      <span>{formatTime(seconds)}</span>
    </button>
  )
}

const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { strict: false }]]}
    components={{
      p: ({ children }) => <div className="mb-5 last:mb-0 leading-[1.8] text-foreground/90">{children}</div>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2">{children}</ol>,
      li: ({ children }) => <li className="pl-1">{children}</li>,
      pre: ({ children }) => <div className="not-prose my-6">{children}</div>,
      code: (props: ComponentPropsWithoutRef<'code'>) => {
        const { children, className, ...rest } = props
        const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
        const contentString = String(children).replace(/\n$/, '')
        const isInline = !match && !contentString.includes('\n')

        if (isInline) {
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-cyan-600 dark:text-cyan-400 text-[0.9em] border border-border" {...rest}>
              {children}
            </code>
          )
        }

        return (
          <div className="relative group my-4 rounded-xl overflow-hidden border border-border bg-muted/20">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {match ? match[1] : 'code'}
              </span>
              <CopyButton value={contentString} showText />
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-[13px] leading-relaxed">
              <code className={className} {...rest}>
                {children}
              </code>
            </pre>
          </div>
        )
      }
    }}
  >
    {content}
  </ReactMarkdown>
)

const CPP_BOILERPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Your code here

    return 0;
}
`

const PYTHON_BOILERPLATE = `import sys

def solve():
    # Your code here
    pass

if __name__ == "__main__":
    solve()
`

const JAVA_BOILERPLATE = `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}
`

const RUST_BOILERPLATE = `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    // Your code here
}
`

const GO_BOILERPLATE = `package main

import "fmt"

func main() {
    // Your code here
}
`

const JS_BOILERPLATE = `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf8');
    // Your code here
}

solve();
`

const LANGUAGE_BOILERPLATES: Record<string, string> = {
  cpp: CPP_BOILERPLATE,
  python: PYTHON_BOILERPLATE,
  java: JAVA_BOILERPLATE,
  rust: RUST_BOILERPLATE,
  go: GO_BOILERPLATE,
  javascript: JS_BOILERPLATE,
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  Hard: 'text-red-500 bg-red-500/10 border-red-500/20',
}

// Stable no-op subscribe for client-only useSyncExternalStore reads (browser APIs).
const emptySubscribe = () => () => {}

export default function IDEClient({
  problem,
  initialCode,
  initialLanguage = 'cpp',
  settings = { sound_enabled: true, hide_unsolved_tags: false },
  isSolved: initialIsSolved = false,
  initialIsRevealed = false
}: IDEClientProps) {
  const t = useTranslations('IDE')
  const { resolvedTheme } = useTheme()
  const supabase = useMemo(() => createClient(), [])
   
  const editorRef = useRef<{ getValue: () => string; setValue: (v: string) => void } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [language, setLanguage] = useState<string>(initialLanguage)

  // Use the new robust auto-save hook
  const { 
    code: savedCode, 
    status: autoSaveStatus, 
    handleCodeChange, 
    clearDraft, 
    isHydrated 
  } = useAutoSaveCode({
    problemId: problem.id,
    language,
    initialCode: initialCode?.trim() ? initialCode : (LANGUAGE_BOILERPLATES[language] || '')
  })

  // Synchronize editor content when language changes or draft is loaded
  useEffect(() => {
    if (isHydrated && editorRef.current) {
      const currentVal = editorRef.current.getValue()
      if (currentVal !== savedCode) {
        editorRef.current.setValue(savedCode)
      }
    }
  }, [savedCode, isHydrated])

  const processDescription = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\$«/g, '«$')
      .replace(/»\$/g, '$»')
      .replace(/\$\$«/g, '«$$')
      .replace(/»\$\$/g, '$$»')
      // Fix Codeforces footnotes with double dollars and \text{*}
      .replace(/\$\$\^\{\\text\{[\*∗]\}\}\$\$/g, '^{\\ast}')
      .replace(/\$\$\^\{\\text\{\\ast\}\}\$\$/g, '^{\\ast}')
      .replace(/\$\$\^\{\\text\{\\dagger\}\}\$\$/g, '^{\\dagger}')
      .replace(/\$\$\^\{\\text\{\\ddagger\}\}\$\$/g, '^{\\ddagger}')
      // Fallback if they are not surrounded by double dollars
      .replace(/\\^\{\\text\{[\*∗]\}\}/g, '^{\\ast}')
      .replace(/\\^\{\\text\{\\ast\}\}/g, '^{\\ast}')
      .replace(/\\^\{\\text\{\\dagger\}\}/g, '^{\\dagger}')
      .replace(/\\^\{\\text\{\\ddagger\}\}/g, '^{\\ddagger}');
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Initial value is handled by the hook synchronization in IDEClient body

    // Add keyboard shortcuts to Monaco
    editor.addAction({
      id: 'submit-code',
      label: 'Submit Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        handleSubmitRef.current()
      }
    })

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => {
        handleRunRef.current()
      }
    })
  }

  // Extract sample input from description (look for "Input" section patterns)
  const extractSampleInput = useCallback(() => {
    const desc = problem.description || ''
    // More robust matching for sample input blocks in description (with unicode flag)
    const inputMatch = desc.match(/input\s*[\n:]\s*([\s\S]+?)(?=output|$)/iu)
    if (inputMatch) return inputMatch[1].trim()
    return '// Paste your test input here'
  }, [problem.description])

  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'results' | 'submissions' | 'history' | 'mentor'>('testcases')
  const [isMentorThinking, setIsMentorThinking] = useState(false)
  const [mentorHistory, setMentorHistory] = useState<{ role: 'user' | 'model', text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSubmission, setCurrentSubmission] = useState<Partial<Submission> | null>(null)
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null)

  const [stdin, setStdin] = useState(() => problem.sample_input || extractSampleInput())
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isFlagged, setIsFlagged] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('problem_id', problem.id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissionHistory(data as Submission[])
    }
    setIsLoadingHistory(false)
  }, [supabase, problem.id])

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Fetch history on mount and when the History tab is opened. fetchHistory sets
  // a loading flag synchronously — intended for an on-demand fetch, so the
  // set-state-in-effect rule is suppressed here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (activeConsoleTab === 'history') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchHistory()
    }
  }, [activeConsoleTab, fetchHistory])

  const handleRestoreCode = (code: string, lang?: string) => {
    if (editorRef.current) {
      editorRef.current.setValue(code)
      if (lang && (lang === 'cpp' || lang === 'python' || lang === 'java' || lang === 'rust' || lang === 'go' || lang === 'javascript')) {
        setLanguage(lang)
      }
      handleCodeChange(code) // Trigger auto-save for restored code
      setViewingSubmission(null)
      setActiveConsoleTab('testcases')
    }
  }

  const [isSolved, setIsSolved] = useState(initialIsSolved)
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const isMac = useSyncExternalStore(
    emptySubscribe,
    () => /Mac|iPhone|iPad/i.test(navigator.userAgent),
    () => false,
  )

  // Spoiler protection: persisted in Supabase revealed_problems table
  const [tagsRevealed, setTagsRevealed] = useState(initialIsRevealed)

  const handleRevealTags = async () => {
    setTagsRevealed(true)
    
    // Persist to Supabase revealed_problems table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // revealed_problems isn't in the generated Database types; cast the payload.
      await supabase.from('revealed_problems')
        .insert({ user_id: user.id, problem_id: problem.id } as never)
        .select()
    }
  }

  // Re-sync reveal state from the server prop without an effect (render-time pattern).
  const [prevRevealed, setPrevRevealed] = useState(initialIsRevealed)
  if (initialIsRevealed !== prevRevealed) {
    setPrevRevealed(initialIsRevealed)
    setTagsRevealed(initialIsRevealed)
  }

  const shouldHideTags = !!settings.hide_unsolved_tags && !isSolved && !tagsRevealed

  // Update editor content when language changes (if current content is just boilerplate)
  const handleLanguageChange = (newLang: string) => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue()
      const currentBoilerplate = LANGUAGE_BOILERPLATES[language]
      if (currentVal.trim() === currentBoilerplate?.trim()) {
        const nextBoilerplate = LANGUAGE_BOILERPLATES[newLang] || ''
        editorRef.current.setValue(nextBoilerplate)
        handleCodeChange(nextBoilerplate)
      }
    }
    setLanguage(newLang)
  }

  useEffect(() => {
    if (isZenMode) {
      document.documentElement.classList.add('zen-mode')
    } else {
      document.documentElement.classList.remove('zen-mode')
    }
    return () => {
      document.documentElement.classList.remove('zen-mode')
    }
  }, [isZenMode])

  // Read the per-problem flagged state from localStorage after mount (guarded so
  // it can't cause a hydration mismatch), re-reading when the problem changes.
  const [flaggedFor, setFlaggedFor] = useState<string | null>(null)
  if (isMounted && flaggedFor !== problem.id) {
    setFlaggedFor(problem.id)
    setIsFlagged(localStorage.getItem(`flagged_${problem.id}`) === 'true')
  }

  const toggleFlag = () => {
    const newState = !isFlagged
    setIsFlagged(newState)
    localStorage.setItem(`flagged_${problem.id}`, String(newState))

    const flaggedListRaw = localStorage.getItem('flagged_problems_list')
    let flaggedList: FlaggedProblem[] = flaggedListRaw ? JSON.parse(flaggedListRaw) : []

    if (newState) {
      if (!flaggedList.find((p) => p.id === problem.id)) {
        flaggedList.push({
          id: problem.id,
          title: problem.title,
          difficulty: problem.difficulty,
          requirements: problem.requirements
        })
      }
    } else {
      flaggedList = flaggedList.filter((p) => p.id !== problem.id)
    }
    localStorage.setItem('flagged_problems_list', JSON.stringify(flaggedList))
  }

  // Remove broken manual resize states
  const CONTAINER_REF_REPLACEMENT = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const handleRunCode = useCallback(async () => {
    if (!editorRef.current) return
    const code = editorRef.current.getValue()
    setIsRunning(true)
    setActiveConsoleTab('results')
    setOutput(null)

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin, language }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOutput(data.error || t('executionUnavailable'))
        return
      }

      // Piston: prefer stdout, fall back to stderr (compilation errors), then generic error
      if (data.stdout && data.stdout.trim()) {
        setOutput(data.stdout)
      } else if (data.stderr && data.stderr.trim()) {
        setOutput(`${t('compileRuntimeError')}\n\n${data.stderr}`)
      } else if (data.code !== undefined && data.code !== 0) {
        setOutput(`${t('processExited', { code: data.code })}\n${data.stderr || ''}`)
      } else {
        setOutput(t('noOutput'))
      }
    } catch {
      setOutput(t('networkExecError'))
    } finally {
      setIsRunning(false)
    }
  }, [language, stdin, t])

  const handleSubmit = useCallback(async (overrideCode?: string, overrideLang?: 'cpp' | 'python' | 'java' | 'rust' | 'go' | 'javascript') => {
    const code = overrideCode ?? editorRef.current?.getValue()
    if (!code) return

    const lang = overrideLang ?? language
    setIsSubmitting(true)
    setActiveConsoleTab('submissions')
    setCurrentSubmission({ status: 'PENDING', verdict: null })

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, code, language: lang }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCurrentSubmission({ status: 'ERROR', verdict: data.error || t('submissionFailed') })
        toast.error(t('toastFailed'), data.error || undefined)
        setIsSubmitting(false)
        return
      }

      const submissionId = data.submission_id
      setCurrentSubmission({ id: submissionId, status: 'PENDING', verdict: null })
      const startTime = Date.now()
      const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

      // Poll for status
      const interval = setInterval(async () => {
        try {
          if (Date.now() - startTime > TIMEOUT_MS) {
            clearInterval(interval)
            pollingIntervalRef.current = null
            setCurrentSubmission(prev => prev ? { ...prev, status: 'ERROR', verdict: t('timeout') } : { status: 'ERROR', verdict: t('timeout') })
            toast.error(t('toastFailed'), t('timeout'))
            setIsSubmitting(false)
            fetchHistory()
            return
          }

          const pollRes = await fetch(`/api/submissions/${submissionId}`)
          const pollData = await pollRes.json() as Submission

          if (pollRes.ok) {
            setCurrentSubmission(pollData)
            if (pollData.status === 'COMPLETED' || pollData.status === 'ERROR') {
              clearInterval(interval)
              pollingIntervalRef.current = null
              setIsSubmitting(false)
              fetchHistory() // Refresh history

              // Celebration / feedback
              if (pollData.verdict === 'Accepted' || pollData.verdict === 'AC') {
                setIsSolved(true)
                clearDraft() // Clear draft on success
                if (settings.sound_enabled) {
                  playSuccessSound()
                }
                toast.success(t('toastAccepted'))
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#10b981', '#3b82f6', '#06b6d4', '#ffffff'],
                  zIndex: 9999
                })
              } else if (pollData.status === 'ERROR') {
                toast.error(t('toastFailed'), pollData.verdict || undefined)
              } else {
                toast.error(t('toastRejected'), pollData.verdict || undefined)
              }
            }
          }
        } catch {
          console.error('Polling error')
        }
      }, 1000)
      pollingIntervalRef.current = interval
    } catch {
      setCurrentSubmission({ status: 'ERROR', verdict: t('networkError') })
      toast.error(t('toastFailed'), t('networkError'))
      setIsSubmitting(false)
    }
  }, [language, problem.id, settings.sound_enabled, fetchHistory, clearDraft, t])

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 256 * 1024) {
      alert(t('fileTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (editorRef.current) {
        editorRef.current.setValue(content)
      }
      handleCodeChange(content)
      const ext = file.name.split('.').pop()?.toLowerCase()
      let detectedLang = language
      if (ext === 'cpp' || ext === 'c' || ext === 'cc' || ext === 'cxx') {
        detectedLang = 'cpp'
      } else if (ext === 'py') {
        detectedLang = 'python'
      } else if (ext === 'java') {
        detectedLang = 'java'
      } else if (ext === 'rs') {
        detectedLang = 'rust'
      } else if (ext === 'go') {
        detectedLang = 'go'
      } else if (ext === 'js') {
        detectedLang = 'javascript'
      }
      setLanguage(detectedLang)
      handleSubmit(content, detectedLang as 'cpp' | 'python' | 'java' | 'rust' | 'go' | 'javascript')
    }
    reader.onerror = () => alert(t('fileReadError'))
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmitRef = useRef(handleSubmit)
  const handleRunRef = useRef(handleRunCode)
  useEffect(() => { handleSubmitRef.current = handleSubmit }, [handleSubmit])
  useEffect(() => { handleRunRef.current = handleRunCode }, [handleRunCode])

  const handleSendMentorMessage = async (isInitial = false) => {
    if (!editorRef.current) return
    if (!isInitial && !chatInput.trim()) return

    const code = editorRef.current.getValue()
    setIsMentorThinking(true)
    setActiveConsoleTab('mentor')

    const userMessage = isInitial ? '' : chatInput.trim()
    if (!isInitial) {
      setMentorHistory(prev => [...prev, { role: 'user', text: userMessage }])
      setChatInput('')
    }

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language,
          problemDescription: problem.description,
          timeLimit: problem.time_limit,
          memoryLimit: problem.memory_limit,
          sampleInput: problem.sample_input || extractSampleInput(),
          sampleOutput: problem.sample_output,
          history: mentorHistory,
          userMessage: userMessage
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setMentorHistory(prev => [...prev, { role: 'model', text: t('mentorError', { message: data.error || t('mentorUnavailable') }) }])
      } else {
        setMentorHistory(prev => [...prev, { role: 'model', text: data.text }])
      }
    } catch {
      setMentorHistory(prev => [...prev, { role: 'model', text: t('mentorNetworkError') }])
    } finally {
      setIsMentorThinking(false)
    }
  }

  const handleAskMentorBtn = () => {
    setActiveConsoleTab('mentor')
    if (mentorHistory.length === 0) {
      handleSendMentorMessage(true)
    }
  }

  const isZenModeRef = useRef(isZenMode)
  const isSubmittingRef = useRef(isSubmitting)
  const isRunningRef = useRef(isRunning)
  useEffect(() => { isZenModeRef.current = isZenMode }, [isZenMode])
  useEffect(() => { isSubmittingRef.current = isSubmitting }, [isSubmitting])
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenModeRef.current) setIsZenMode(false)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          if (!isRunningRef.current && !isSubmittingRef.current) handleRunRef.current()
        } else {
          if (!isSubmittingRef.current && !isRunningRef.current) handleSubmitRef.current()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const diffColor = DIFFICULTY_COLORS[problem.difficulty] || 'text-zinc-400 bg-zinc-800 border-zinc-700'

  return (
    <div
      ref={CONTAINER_REF_REPLACEMENT}
      className={`flex h-full w-full overflow-hidden relative ${isZenMode ? 'z-50 bg-background' : ''}`}
    >
      <PanelGroup orientation="horizontal" className="h-full w-full">
        {/* Left Panel (Description) */}
        <Panel defaultSize={40} minSize={20} className="flex flex-col h-full border-r border-border bg-card select-text">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-foreground font-mono leading-tight">{problem.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${diffColor}`}>
                  {problem.difficulty}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFlag}
                className={cn(
                  "transition-all",
                  isFlagged
                    ? 'bg-amber-400/10 border-amber-400/50 text-amber-400'
                    : 'text-muted-foreground'
                )}
                title={isFlagged ? t('removeFlag') : t('flagProblem')}
              >
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-400' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
              {problem.time_limit && (
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-lg border border-border">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span>{problem.time_limit}</span>
                </div>
              )}
              {problem.memory_limit && (
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-lg border border-border">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span>{problem.memory_limit}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-8 pt-6 pb-32 space-y-8 text-[15px] text-foreground/90 leading-relaxed scrollbar-thin selection:bg-cyan-500/30 select-text">
            {problem.description && (
              <div className="prose dark:prose-invert max-w-none [&>h2]:bg-muted/50 dark:[&>h2]:bg-muted/30 [&>h2]:inline-block [&>h2]:px-3 [&>h2]:py-1.5 [&>h2]:rounded-lg [&>h2]:text-sm [&>h2]:uppercase [&>h2]:tracking-wider [&>h2]:text-muted-foreground dark:[&>h2]:text-muted-foreground [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:bg-muted/50 dark:[&>h3]:bg-muted/30 [&>h3]:inline-block [&>h3]:px-3 [&>h3]:py-1.5 [&>h3]:rounded-lg [&>h3]:text-sm [&>h3]:uppercase [&>h3]:tracking-wider [&>h3]:text-muted-foreground dark:[&>h3]:text-muted-foreground [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3">
                <MarkdownRenderer content={processDescription(problem.description)} />
              </div>
            )}

            {(problem.sample_input || problem.sample_output) && (
              <div className="space-y-4 pt-6 border-t border-border">
                {problem.sample_input && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">{t('input')}</h3>
                    <div className="bg-secondary/50 border border-border p-4 rounded-xl font-mono text-sm whitespace-pre-wrap text-foreground/90">
                      {problem.sample_input}
                    </div>
                  </div>
                )}
                {problem.sample_output && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">{t('output')}</h3>
                    <div className="bg-secondary/50 border border-border p-4 rounded-xl font-mono text-sm whitespace-pre-wrap text-foreground/90">
                      {problem.sample_output}
                    </div>
                  </div>
                )}
              </div>
            )}

            {problem.note && (
              <div className="space-y-3 pt-6 border-t border-border">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('notes')}</h3>
                <div className="bg-cyan-500/5 border-l-4 border-cyan-500/50 p-4 rounded-r-xl prose dark:prose-invert prose-sm max-w-none prose-pre:whitespace-pre-wrap">
                  <MarkdownRenderer content={processDescription(problem.note)} />
                </div>
              </div>
            )}

            {problem.submission_stats && (
              <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold">{t('solvedBy')}</span>
                  <p className="text-xl font-mono font-bold text-foreground">{problem.submission_stats.solved_count}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold">{t('difficulty')}</span>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono font-bold text-foreground">{problem.difficulty_rating || '---'}</p>
                    {problem.difficulty_rating && (
                      <div className="flex-1 max-w-[60px]">
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (problem.difficulty_rating / 3500) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 hover:bg-cyan-500/50 bg-white/5 transition-colors cursor-col-resize z-20" />

        {/* Right Panel (Workspace) */}
        <Panel defaultSize={60} minSize={30} className="flex flex-col h-full bg-[#0B0D12] overflow-hidden">
          {/* Top Actions Header */}
          <div className="shrink-0 flex items-center justify-between h-14 px-4 border-b border-white/5 bg-card z-10">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="cpp">C++17</option>
                <option value="python">Python 3</option>
                <option value="java">Java 17</option>
                <option value="rust">Rust 1.75</option>
                <option value="go">Go 1.21</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>
              <Timer />
              <div className="hidden sm:block ml-2">
                <AutoSaveStatus status={autoSaveStatus} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".cpp,.c,.cc,.cxx,.py,.java,.rs" className="hidden" />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title={t('uploadFile')} className="h-8 w-8">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsZenMode(!isZenMode)} className={cn("h-8 w-8", isZenMode && 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500')} title={isZenMode ? t('exitZen') : t('enterZen')}>
                {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="outline" onClick={handleAskMentorBtn} disabled={isMentorThinking || isSubmitting || isRunning} className="h-8 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 active:scale-95 transition-all shadow-none">
                {isMentorThinking ? <span className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1.5" />}
                {t('askMentor')}
              </Button>
              <Button variant="secondary" onClick={() => handleSubmit()} disabled={isSubmitting || isRunning} className="h-8 text-[11px] gap-2 active:scale-95 shadow-none" title={t('submitShortcut', { key: isMac ? '⌘ + Enter' : 'Ctrl + Enter' })}>
                {isSubmitting ? t('submitting') : (<>{t('submit')} <span className="hidden sm:inline text-[9px] opacity-40 font-mono border border-border px-1 rounded bg-background/50">{isMac ? '⌘↵' : 'Ctrl+↵'}</span></>)}
              </Button>
              <Button variant="primary" onClick={handleRunCode} disabled={isRunning || isSubmitting} className="h-8 text-[11px] gap-2 bg-primary hover:bg-primary/90 hover:scale-100 shadow-none active:scale-95" title={t('runShortcut', { key: isMac ? '⌘ + Shift + Enter' : 'Ctrl + Shift + Enter' })}>
                {isRunning ? (<><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {t('running')}</>) : (<><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg><span>{t('runCode')}</span> <span className="hidden sm:inline text-[9px] opacity-60 font-mono border border-border px-1 rounded bg-white/10">{isMac ? '⇧⌘↵' : 'Ctrl+⇧+↵'}</span></>)}
              </Button>
            </div>
          </div>

          {/* Split View Container */}
          <div className="flex-1 overflow-hidden w-full h-full">
            <PanelGroup orientation="vertical" className="h-full w-full">
              {/* Top Panel (Editor) */}
              <Panel defaultSize={60} minSize={20} className="overflow-hidden bg-background">
                <Editor
                  key={problem.id}
                  height="100%"
                  width="100%"
                  language={language}
                  defaultValue={savedCode}
                  onChange={handleCodeChange}
                  theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                  onMount={handleEditorDidMount}
                  loading={<div className="absolute inset-0 flex items-center justify-center bg-background z-10"><div className="flex flex-col items-center gap-3 text-muted-foreground"><span className="w-6 h-6 border-2 border-muted-foreground/30 border-t-cyan-500 rounded-full animate-spin" /><span className="text-xs font-mono">{t('loadingEditor')}</span></div></div>}
                  options={{ fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", fontLigatures: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 16, bottom: 16 }, lineNumbers: 'on', glyphMargin: false, folding: true, wordWrap: 'off', cursorBlinking: 'smooth', smoothScrolling: true, renderLineHighlight: 'line', bracketPairColorization: { enabled: true } }}
                />
              </Panel>

              {/* Resizer Handle (Divider) */}
              <PanelResizeHandle className="h-1.5 hover:bg-cyan-500/50 bg-white/5 transition-colors cursor-row-resize z-20 shrink-0" />
              
              {/* Bottom Panel (Console) */}
              <Panel defaultSize={40} minSize={20} className="flex flex-col bg-card overflow-hidden">
                <div className="flex items-center border-b border-border shrink-0 px-2 overflow-x-auto">
                  {(['testcases', 'results', 'submissions', 'history', 'mentor'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveConsoleTab(tab)} className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b whitespace-nowrap ${activeConsoleTab === tab ? tab === 'mentor' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                      {tab === 'testcases' ? t('tabTestCases') : tab === 'results' ? t('tabTestResults') : tab === 'mentor' ? <div className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> {t('tabMentor')}</div> : tab === 'history' ? <div className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> {t('tabHistory')}</div> : t('tabCurrent')}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
                  {activeConsoleTab === 'mentor' ? (
                    <MentorTab mentorHistory={mentorHistory} isMentorThinking={isMentorThinking} chatInput={chatInput} setChatInput={setChatInput} onSendMessage={handleSendMentorMessage} />
                  ) : activeConsoleTab === 'submissions' ? (
                    <SubmissionsTab currentSubmission={currentSubmission} />
                  ) : activeConsoleTab === 'history' ? (
                    <HistoryTab isLoadingHistory={isLoadingHistory} submissionHistory={submissionHistory} onViewSubmission={setViewingSubmission} />
                  ) : activeConsoleTab === 'testcases' ? (
                    <div className="h-full flex flex-col gap-2 min-h-0">
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">{t('customInput')}</label>
                      <Textarea value={stdin} onChange={(e) => setStdin(e.target.value)} className="flex-1 min-h-0 resize-none font-mono text-xs border-border bg-background focus:ring-0 focus:border-cyan-500/50" placeholder={t('customInputPlaceholder')} spellCheck={false} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col gap-2 min-h-0">
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">{t('output')}</label>
                      <div className="flex-1 relative group overflow-hidden rounded-lg min-h-0">
                        <pre className="h-full w-full bg-muted border border-border p-3 text-xs font-mono text-foreground overflow-y-auto whitespace-pre-wrap">{isRunning ? <span className="text-cyan-600 dark:text-cyan-400 animate-pulse">{t('executing')}</span> : output !== null ? output : <span className="text-muted-foreground">{t('runHint')}</span>}</pre>
                        {output !== null && !isRunning && <CopyButton value={output} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
      {viewingSubmission && <SubmissionModal submission={viewingSubmission} onClose={() => setViewingSubmission(null)} onRestore={handleRestoreCode} />}
    </div>
  )
}

