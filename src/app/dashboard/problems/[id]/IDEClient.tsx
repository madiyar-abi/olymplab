'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { MathJax, MathJaxContext } from 'better-react-mathjax'
import { Clock, Cpu } from 'lucide-react'

const mathJaxConfig = {
  tex: {
    inlineMath: [['$$$', '$$$'], ['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$$$$$', '$$$$$$'], ['\\[', '\\]']],
  }
};

interface SkillReq {
  level: number
  weight: number
}

interface Problem {
  id: string
  title: string
  description: string
  difficulty: string
  time_limit?: string
  memory_limit?: string
  requirements: Record<string, SkillReq>
  sample_input?: string | null
  sample_output?: string | null
}

interface IDEClientProps {
  problem: Problem
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

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

declare global {
  interface Window {
    monaco: any
    require: any
  }
}

export default function IDEClient({ problem }: IDEClientProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'results' | 'submissions'>('testcases')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSubmission, setCurrentSubmission] = useState<any>(null)
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState(40) // percent
  const [editorHeight, setEditorHeight] = useState(70) // percent of right panel
  const isDraggingHorizontal = useRef(false)
  const isDraggingVertical = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Extract sample input from description (look for "Input" section patterns)
  const extractSampleInput = useCallback(() => {
    const desc = problem.description
    const inputMatch = desc.match(/input\s*[\n:]\s*([\d\s\w]+?)(?=output|$)/i)
    if (inputMatch) return inputMatch[1].trim()
    return '// Paste your test input here'
  }, [problem.description])

  // Set sample input on mount — prefer DB field, fall back to parsing
  useEffect(() => {
    setStdin(problem.sample_input || extractSampleInput())
  }, [extractSampleInput, problem.sample_input])

  // Horizontal resizer (left/right panels)
  const handleHorizontalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingHorizontal.current = true
  }

  // Vertical resizer (editor/console)
  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingVertical.current = true
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
        body: JSON.stringify({ code, stdin }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOutput(`❌ Error: ${data.error || 'Execution engine unavailable.'}`)
        return
      }

      // Piston: prefer stdout, fall back to stderr (compilation errors), then generic error
      if (data.stdout && data.stdout.trim()) {
        setOutput(data.stdout)
      } else if (data.stderr && data.stderr.trim()) {
        setOutput(`⚠ Compilation / Runtime Error:\n\n${data.stderr}`)
      } else if (data.code !== undefined && data.code !== 0) {
        setOutput(`Process exited with code ${data.code}.\n${data.stderr || ''}`)
      } else {
        setOutput('(No output)')
      }
    } catch (err) {
      setOutput('❌ Network Error: Failed to connect to execution engine.')
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
    console.log('Submitting problemId:', problem.id)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, code, language: 'cpp' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCurrentSubmission({ status: 'ERROR', verdict: data.error || 'Submission failed' })
        setIsSubmitting(false)
        return
      }

      const submissionId = data.submission_id

      // Poll for status
      const interval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/submissions/${submissionId}`)
          const pollData = await pollRes.json()

          if (pollRes.ok) {
            setCurrentSubmission(pollData)
            if (pollData.status === 'COMPLETED') {
              clearInterval(interval)
              setIsSubmitting(false)
            }
          }
        } catch (e) {
          console.error('Polling error', e)
        }
      }, 1000)
    } catch (err) {
      setCurrentSubmission({ status: 'ERROR', verdict: 'Network error' })
      setIsSubmitting(false)
    }
  }

  const diffColor = DIFFICULTY_COLORS[problem.difficulty] || 'text-zinc-400 bg-zinc-800 border-zinc-700'

  return (
    <div
      ref={containerRef}
      className="flex h-full select-none overflow-hidden"
      style={{ cursor: isDraggingHorizontal.current ? 'col-resize' : 'default' }}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Problem Description */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="h-full flex flex-col overflow-hidden border-r border-zinc-800 bg-[#0f0f10]"
        style={{ width: `${leftWidth}%` }}
      >
        {/* Problem header */}
        <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-lg font-bold text-white font-mono leading-tight">{problem.title}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${diffColor}`}>
              {problem.difficulty}
            </span>
          </div>

          {/* Limits */}
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400 font-medium">
            {problem.time_limit && (
              <div className="flex items-center gap-1.5 bg-zinc-800/40 px-2 py-1 rounded-md border border-zinc-800/80">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{problem.time_limit}</span>
              </div>
            )}
            {problem.memory_limit && (
              <div className="flex items-center gap-1.5 bg-zinc-800/40 px-2 py-1 rounded-md border border-zinc-800/80">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
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
                  className="bg-zinc-800/60 text-zinc-400 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-zinc-700/50 uppercase tracking-wide"
                >
                  {skill.replace('_', ' ')}
                </span>
              ))}
          </div>
        </div>

        {/* Problem content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-zinc-300 leading-relaxed scrollbar-thin">
          {/* Description section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Description</h3>
            <MathJaxContext config={mathJaxConfig}>
              <MathJax dynamic>
                <div 
                  className="font-sans text-zinc-300 leading-7 [&>p]:mb-4 [&>p:last-child]:mb-0 [&_.tex-span]:font-mono [&_.tex-span]:bg-zinc-800/50 [&_.tex-span]:px-1 [&_.tex-span]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
              </MathJax>
            </MathJaxContext>
          </div>

          {/* Sample Input */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Sample Input</h3>
            <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap">
              {problem.sample_input || extractSampleInput()}
            </pre>
          </div>

          {/* Sample Output */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Sample Output</h3>
            <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg font-mono text-xs text-zinc-200">
              {problem.sample_output || '// Run your solution to compare output.'}
            </pre>
          </div>

          {/* Skill requirements breakdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Skill Requirements</h3>
            <div className="space-y-2.5">
              {problem.requirements &&
                Object.entries(problem.requirements).map(([skill, req]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400 capitalize font-medium">{skill.replace('_', ' ')}</span>
                      <span className="text-zinc-500">{req.level}/100</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
        className="w-1 cursor-col-resize bg-zinc-800 hover:bg-cyan-500/60 transition-colors shrink-0 active:bg-cyan-500"
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
          className="flex flex-col overflow-hidden border-b border-zinc-800"
          style={{ height: `${editorHeight}%` }}
        >
          {/* Editor header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-[#0f0f10] shrink-0">
            <div className="flex items-center gap-3">
              {/* Language badge */}
              <div className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2.5 py-1">
                <span className="text-[11px] font-mono font-medium text-zinc-300">C++17</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Submit button */}
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || isRunning}
                className="px-4 py-1.5 text-sm font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              {/* Run button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-black bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage="cpp"
              defaultValue={CPP_BOILERPLATE}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
                  <div className="flex flex-col items-center gap-3 text-zinc-500">
                    <span className="w-6 h-6 border-2 border-zinc-600 border-t-cyan-500 rounded-full animate-spin" />
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
          className="h-1 cursor-row-resize bg-zinc-800 hover:bg-cyan-500/60 transition-colors shrink-0 active:bg-cyan-500"
          onMouseDown={handleVerticalMouseDown}
        />

        {/* Console Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0d] min-h-0">
          {/* Console tab bar */}
          <div className="flex items-center border-b border-zinc-800 shrink-0 px-2">
            {(['testcases', 'results', 'submissions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveConsoleTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  activeConsoleTab === tab
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'testcases' ? 'Test Cases' : tab === 'results' ? 'Test Results' : 'Submissions'}
              </button>
            ))}
          </div>

          {/* Console content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeConsoleTab === 'submissions' ? (
              <div className="h-full flex flex-col font-mono text-sm text-zinc-300 overflow-y-auto">
                {!currentSubmission ? (
                  <div className="text-zinc-500 italic">No submissions yet for this session.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">Status:</span>
                      {currentSubmission.status === 'PENDING' && <span className="text-amber-400 flex items-center gap-2"><span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> In Queue...</span>}
                      {currentSubmission.status === 'TESTING' && <span className="text-cyan-400 flex items-center gap-2"><span className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> Testing on hidden cases...</span>}
                      {currentSubmission.status === 'COMPLETED' && <span className="text-zinc-300">Completed</span>}
                      {currentSubmission.status === 'ERROR' && <span className="text-red-400">Error</span>}
                    </div>

                    {currentSubmission.status === 'COMPLETED' && currentSubmission.verdict && (
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-zinc-500">Verdict:</span>
                        <span className={`text-xl font-bold ${currentSubmission.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {currentSubmission.verdict}
                        </span>
                      </div>
                    )}
                    {currentSubmission.status === 'ERROR' && (
                      <div className="text-red-400 mt-4">{currentSubmission.verdict}</div>
                    )}
                  </div>
                )}
              </div>
            ) : activeConsoleTab === 'testcases' ? (
              <div className="h-full flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Custom Input (stdin)
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                  placeholder="Enter your test input here…"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Output</label>
                <pre className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 overflow-auto whitespace-pre-wrap">
                  {isRunning ? (
                    <span className="text-cyan-400 animate-pulse">Executing…</span>
                  ) : output !== null ? (
                    output
                  ) : (
                    <span className="text-zinc-600">Run your code to see results here.</span>
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
