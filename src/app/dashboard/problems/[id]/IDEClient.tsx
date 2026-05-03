'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Clock, Cpu, Flag, Maximize2, Minimize2, Timer as TimerIcon, Bot } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTheme } from '@/components/shared/ThemeProvider'
import { playSuccessSound } from '@/lib/audio'

export interface SkillReq {
  level: number
  weight: number
}

export interface Problem {
  id: string
  title: string
  description: string
  difficulty: string
  requirements: Record<string, SkillReq>
  sample_input: string | null
  sample_output: string | null
  external_id: string | null
  time_limit?: string
  memory_limit?: string
}

export interface IDEClientProps {
  problem: Problem
  initialCode?: string
  settings?: {
    sound_enabled: boolean
  }
}

export interface Submission {
  status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR'
  verdict: string | null
}

export interface FlaggedProblem {
  id: string
  title: string
  difficulty: string
  requirements: Record<string, SkillReq>
}

const Timer = () => {
  const [seconds, setSeconds] = useState(0)
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

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-lg font-mono text-sm text-foreground/80">
      <TimerIcon className="w-4 h-4 text-cyan-500" />
      <span>{formatTime(seconds)}</span>
    </div>
  )
}

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
        Scanner sc = new Scanner(System.err);
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

const LANGUAGE_BOILERPLATES: Record<string, string> = {
  cpp: CPP_BOILERPLATE,
  python: PYTHON_BOILERPLATE,
  java: JAVA_BOILERPLATE,
  rust: RUST_BOILERPLATE,
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function IDEClient({ problem, initialCode, settings = { sound_enabled: true } }: IDEClientProps) {
  const { resolvedTheme } = useTheme()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<{ getValue: () => string; setValue: (v: string) => void } | null>(null)

  const handleEditorDidMount = (editor: { getValue: () => string; setValue: (v: string) => void }) => {
    editorRef.current = editor
  }

  // Extract sample input from description (look for "Input" section patterns)
  const extractSampleInput = useCallback(() => {
    const desc = problem.description
    const inputMatch = desc.match(/input\s*[\n:]\s*([\d\s\w]+?)(?=output|$)/i)
    if (inputMatch) return inputMatch[1].trim()
    return '// Paste your test input here'
  }, [problem.description])

  const [language, setLanguage] = useState<'cpp' | 'python' | 'java' | 'rust'>('cpp')
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'results' | 'submissions' | 'mentor'>('testcases')
  const [isMentorThinking, setIsMentorThinking] = useState(false)
  const [mentorHistory, setMentorHistory] = useState<{ role: 'user' | 'model', text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null)
  const [stdin, setStdin] = useState(() => problem.sample_input || extractSampleInput())
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isFlagged, setIsFlagged] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Update editor content when language changes (if current content is just boilerplate)
  const handleLanguageChange = (newLang: 'cpp' | 'python' | 'java' | 'rust') => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue()
      const currentBoilerplate = LANGUAGE_BOILERPLATES[language]
      if (currentVal.trim() === currentBoilerplate.trim()) {
        editorRef.current.setValue(LANGUAGE_BOILERPLATES[newLang])
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

  useEffect(() => {
    const flagged = localStorage.getItem(`flagged_${problem.id}`)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFlagged(flagged === 'true')
  }, [problem.id])

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

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState(40) // percent
  const [editorHeight, setEditorHeight] = useState(70) // percent of right panel
  const isDraggingHorizontal = useRef(false)
  const isDraggingVertical = useRef(false)
  const [isDraggingHorizontalState, setIsDraggingHorizontalState] = useState(false)
  const [, setIsDraggingVerticalState] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Horizontal resizer (left/right panels)
  const handleHorizontalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingHorizontal.current = true
    setIsDraggingHorizontalState(true)
  }

  // Vertical resizer (editor/console)
  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingVertical.current = true
    setIsDraggingVerticalState(true)
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingHorizontal.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newLeft = ((e.clientX - rect.left) / rect.width) * 100
        setLeftWidth(Math.min(Math.max(newLeft, 20), 75))
      }
      if (isDraggingVertical.current && rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect()
        const newTop = ((e.clientY - rect.top) / rect.height) * 100
        setEditorHeight(Math.min(Math.max(newTop, 30), 85))
      }
    }
    const onMouseUp = () => {
      isDraggingHorizontal.current = false
      isDraggingVertical.current = false
      setIsDraggingHorizontalState(false)
      setIsDraggingVerticalState(false)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const handleRunCode = async () => {
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
        setOutput(`Error: ${data.error || 'Execution engine unavailable.'}`)
        return
      }

      // Piston: prefer stdout, fall back to stderr (compilation errors), then generic error
      if (data.stdout && data.stdout.trim()) {
        setOutput(data.stdout)
      } else if (data.stderr && data.stderr.trim()) {
        setOutput(`Compilation / Runtime Error:\n\n${data.stderr}`)
      } else if (data.code !== undefined && data.code !== 0) {
        setOutput(`Process exited with code ${data.code}.\n${data.stderr || ''}`)
      } else {
        setOutput('(No output)')
      }
    } catch {
      setOutput('Network Error: Failed to connect to execution engine.')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!editorRef.current) return
    const code = editorRef.current.getValue()
    setIsSubmitting(true)
    setActiveConsoleTab('submissions')
    setCurrentSubmission({ status: 'PENDING', verdict: null })

    // 3. Error Bubbling Trace:
    console.log('Submitting problemId:', problem.id, 'language:', language)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, code, language }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCurrentSubmission({ status: 'ERROR', verdict: data.error || 'Submission failed' })
        setIsSubmitting(false)
        return
      }

      const submissionId = data.submission_id
      console.log('[IDE] Received submissionId:', submissionId)

      // Poll for status
      const interval = setInterval(async () => {
        try {
          console.log('[IDE] Polling for submissionId:', submissionId)
          const pollRes = await fetch(`/api/submissions/${submissionId}`)
          const pollData = await pollRes.json() as Submission

          if (pollRes.ok) {
            setCurrentSubmission(pollData)
            if (pollData.status === 'COMPLETED' || pollData.status === 'ERROR') {
              clearInterval(interval)
              setIsSubmitting(false)

              // ─── Celebration (Confetti & Sound) ───
              if (pollData.verdict === 'Accepted') {
                if (settings.sound_enabled) {
                  playSuccessSound()
                }
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#10b981', '#3b82f6', '#06b6d4', '#ffffff'],
                  zIndex: 9999
                })
              }
            }
          }
        } catch {
          console.error('Polling error')
        }
      }, 1000)
    } catch {
      setCurrentSubmission({ status: 'ERROR', verdict: 'Network error' })
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeConsoleTab === 'mentor' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [mentorHistory, isMentorThinking, activeConsoleTab])

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
        setMentorHistory(prev => [...prev, { role: 'model', text: `Ошибка: ${data.error || 'Ментор сейчас недоступен.'}` }])
      } else {
        setMentorHistory(prev => [...prev, { role: 'model', text: data.text }])
      }
    } catch {
      setMentorHistory(prev => [...prev, { role: 'model', text: 'Ошибка сети: Не удалось подключиться к ИИ-Ментору.' }])
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZenMode])

  const diffColor = DIFFICULTY_COLORS[problem.difficulty] || 'text-zinc-400 bg-zinc-800 border-zinc-700'
  const horizontalCursor = isDraggingHorizontalState ? 'col-resize' : 'default'

  return (
    <div
      ref={containerRef}
      className={`flex h-full select-none overflow-hidden relative ${isZenMode ? 'z-50 bg-background' : ''}`}
      style={{ cursor: horizontalCursor }}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Problem Description */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="h-full flex flex-col overflow-hidden border-r border-border bg-card"
        style={{ width: `${leftWidth}%` }}
      >
        {/* Problem header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-foreground font-mono leading-tight">{problem.title}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${diffColor}`}>
                {problem.difficulty}
              </span>
            </div>
            <button
              onClick={toggleFlag}
              className={`p-2 rounded-lg border transition-all ${
                isFlagged 
                  ? 'bg-amber-400/10 border-amber-400/50 text-amber-400' 
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
              }`}
              title={isFlagged ? "Remove Flag" : "Flag Problem"}
            >
              <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          {/* Limits */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
            {problem.time_limit && (
              <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-md border border-border/80">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span>{problem.time_limit}</span>
              </div>
            )}
            {problem.memory_limit && (
              <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-md border border-border/80">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span>{problem.memory_limit}</span>
              </div>
            )}
          </div>

          {/* Skill tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {problem.requirements &&
              Object.entries(problem.requirements).map(([skill]) => (
                <span
                  key={skill}
                  className="bg-secondary/60 text-muted-foreground px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border/50 uppercase tracking-wide"
                >
                  {skill.replace('_', ' ')}
                </span>
              ))}
          </div>
        </div>

        {/* Problem content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 text-[15px] text-foreground/90 leading-relaxed scrollbar-thin selection:bg-cyan-500/30">
          {/* Description section */}
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
              components={{
                p: ({children}) => <p className="mb-5 last:mb-0 leading-[1.8]">{children}</p>,
                h1: ({children}) => <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mt-10 mb-4">{children}</h2>,
                h2: ({children}) => <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 mt-10 mb-4">{children}</h2>,
                h3: ({children}) => <h3 className="text-md font-bold text-foreground mt-8 mb-3">{children}</h3>,
                strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-5 space-y-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-5 space-y-2">{children}</ol>,
                li: ({children}) => <li className="pl-1">{children}</li>,
                code: ({children}) => <code className="bg-secondary/80 px-1.5 py-0.5 rounded font-mono text-cyan-600 dark:text-cyan-400 text-[0.9em] border border-border/30">{children}</code>
              }}
            >
              {problem.description
                  .replace(/∗/g, '\\ast ')
                  .replace(/†/g, '\\dagger ')
                  .replace(/‡/g, '\\ddagger ')}
            </ReactMarkdown>
          </div>

          {/* Sample Input/Output Section */}
          <div className="space-y-6 pt-6 border-t border-border/50">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Sample Input</h3>
                    <button 
                        onClick={() => navigator.clipboard.writeText(problem.sample_input || extractSampleInput())}
                        className="text-[10px] font-medium text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
                    >
                        Copy
                    </button>
                </div>
                <pre className="bg-secondary/30 border border-border/60 p-4 rounded-xl font-mono text-[13px] text-foreground/90 overflow-x-auto whitespace-pre leading-normal">
                  {problem.sample_input || extractSampleInput()}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Sample Output</h3>
                <pre className="bg-secondary/30 border border-border/60 p-4 rounded-xl font-mono text-[13px] text-foreground/90 overflow-x-auto whitespace-pre leading-normal">
                  {problem.sample_output || '// No sample output.'}
                </pre>
              </div>
            </div>
          </div>

          {/* Skill requirements breakdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Skill Requirements</h3>
            <div className="space-y-2.5">
              {problem.requirements &&
                Object.entries(problem.requirements).map(([skill, req]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize font-medium">{skill.replace('_', ' ')}</span>
                      <span className="text-muted-foreground/60">{req.level}/100</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${req.level}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HORIZONTAL DRAG HANDLE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="w-1 cursor-col-resize bg-border hover:bg-cyan-500/60 transition-colors shrink-0 active:bg-cyan-500"
        onMouseDown={handleHorizontalMouseDown}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Editor + Console */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        ref={rightPanelRef}
        className="flex-1 h-full flex flex-col overflow-hidden"
      >
        {/* Editor Panel */}
        <div
          className="flex flex-col overflow-hidden border-b border-border"
          style={{ height: `${editorHeight}%` }}
        >
          {/* Editor header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              {/* Language selection */}
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as 'cpp' | 'python' | 'java' | 'rust')}
                className="bg-secondary border border-border rounded-md px-2 py-1 text-[11px] font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="cpp">C++17</option>
                <option value="python">Python 3</option>
                <option value="java">Java 17</option>
                <option value="rust">Rust 1.75</option>
              </select>
              <Timer />
            </div>
            <div className="flex items-center gap-2">
              {/* Zen Mode toggle */}
              <button
                onClick={() => setIsZenMode(!isZenMode)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isZenMode 
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500' 
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
              >
                {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* AI Mentor button */}
              <button
                onClick={handleAskMentorBtn}
                disabled={isMentorThinking || isSubmitting || isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMentorThinking ? (
                  <span className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                Ask Mentor
              </button>

              {/* Submit button */}
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || isRunning}
                className="px-4 py-1.5 text-sm font-semibold text-foreground bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              {/* Run button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor container */}
          <div className="flex-1 relative overflow-hidden bg-background">
            <Editor
              height="100%"
              language={language === 'python' ? 'python' : language === 'java' ? 'java' : language === 'rust' ? 'rust' : 'cpp'}
              defaultValue={initialCode || LANGUAGE_BOILERPLATES[language]}
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
              onMount={handleEditorDidMount}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <span className="w-6 h-6 border-2 border-muted-foreground/30 border-t-cyan-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading editor…</span>
                  </div>
                </div>
              }
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                wordWrap: 'off',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>

        {/* VERTICAL DRAG HANDLE */}
        <div
          className="h-1 cursor-row-resize bg-border hover:bg-cyan-500/60 transition-colors shrink-0 active:bg-cyan-500"
          onMouseDown={handleVerticalMouseDown}
        />

        {/* Console Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card min-h-0">
          {/* Console tab bar */}
          <div className="flex items-center border-b border-border shrink-0 px-2 overflow-x-auto">
            {(['testcases', 'results', 'submissions', 'mentor'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveConsoleTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 whitespace-nowrap ${
                  activeConsoleTab === tab
                    ? tab === 'mentor' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'testcases' ? 'Test Cases' : tab === 'results' ? 'Test Results' : tab === 'mentor' ? <div className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Mentor</div> : 'Submissions'}
              </button>
            ))}
          </div>

          {/* Console content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeConsoleTab === 'mentor' ? (
              <div className="h-full flex flex-col font-mono text-sm text-foreground overflow-hidden">
                {mentorHistory.length === 0 && !isMentorThinking ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                    <Bot className="w-8 h-8 text-muted-foreground/50" />
                    <p className="max-w-md text-center text-xs">
                      Застряли? Нажмите &quot;Ask Mentor&quot;, чтобы получить подсказку без раскрытия полного решения. Ментор проанализирует вашу логику и направит в нужную сторону!
                    </p>
                    <button 
                      onClick={() => handleSendMentorMessage(true)}
                      className="px-4 py-2 mt-2 text-xs font-semibold text-purple-600 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
                    >
                      Начать анализ кода
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Chat Messages */}
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
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/80 prose-pre:border prose-pre:border-border">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
                                >
                                  {msg.text
                                    .replace(/∗/g, '\\ast ')
                                    .replace(/†/g, '\\dagger ')
                                    .replace(/‡/g, '\\ddagger ')}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {msg.role === 'user' ? 'Вы' : 'ИИ Ментор'}
                          </span>
                        </div>
                      ))}
                      
                      {isMentorThinking && (
                        <div className="flex flex-col items-start">
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-secondary/50 border border-border rounded-bl-none flex items-center gap-3">
                            <span className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                            <span className="animate-pulse text-xs font-semibold text-muted-foreground">Ментор печатает...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="pt-3 border-t border-border mt-2 shrink-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMentorMessage(false);
                            }
                          }}
                          placeholder="Ответьте ментору или задайте вопрос..."
                          className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                          disabled={isMentorThinking}
                        />
                        <button
                          onClick={() => handleSendMentorMessage(false)}
                          disabled={!chatInput.trim() || isMentorThinking}
                          className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeConsoleTab === 'submissions' ? (
              <div className="h-full flex flex-col font-mono text-sm text-foreground/80 overflow-y-auto">
                {!currentSubmission ? (
                  <div className="text-muted-foreground italic">No submissions yet for this session.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">Status:</span>
                      {currentSubmission.status === 'PENDING' && <span className="text-amber-500 dark:text-amber-400 flex items-center gap-2"><span className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /> In Queue...</span>}
                      {currentSubmission.status === 'TESTING' && <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-2"><span className="w-3 h-3 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin" /> Testing on hidden cases...</span>}
                      {currentSubmission.status === 'COMPLETED' && <span className="text-foreground/80">Completed</span>}
                      {currentSubmission.status === 'ERROR' && <span className="text-red-500 dark:text-red-400">Error</span>}
                    </div>

                    {currentSubmission.status === 'COMPLETED' && currentSubmission.verdict && (
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-muted-foreground">Verdict:</span>
                        <span className={`text-xl font-bold ${currentSubmission.verdict === 'Accepted' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {currentSubmission.verdict}
                        </span>
                      </div>
                    )}

                    {currentSubmission.status === 'ERROR' && (
                      <div className="text-red-500 dark:text-red-400 mt-4">{currentSubmission.verdict}</div>
                    )}
                  </div>
                )}
              </div>
            ) : activeConsoleTab === 'testcases' ? (
              <div className="h-full flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Custom Input (stdin)
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="flex-1 w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors placeholder:text-muted-foreground"
                  placeholder="Enter your test input here…"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Output</label>
                <pre className="flex-1 w-full bg-secondary/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground overflow-auto whitespace-pre-wrap">
                  {isRunning ? (
                    <span className="text-cyan-600 dark:text-cyan-400 animate-pulse">Executing…</span>
                  ) : output !== null ? (
                    output
                  ) : (
                    <span className="text-muted-foreground">Run your code to see results here.</span>
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
