'use client'

import Editor from '@monaco-editor/react'
import { History, RotateCcw, X } from 'lucide-react'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import { useTheme } from '@/components/shared/ThemeProvider'
import type { Submission } from '@/app/dashboard/problems/[id]/IDEClient'

interface SubmissionModalProps {
  submission: Submission
  onClose: () => void
  onRestore: (code: string, lang?: string) => void
}

export function SubmissionModal({ submission, onClose, onRestore }: SubmissionModalProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-secondary rounded-lg">
              <History className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Submission Code</h3>
              <div className="flex items-center gap-2 mt-1">
                <VerdictBadge verdict={submission.verdict} size="sm" />
                <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border uppercase">
                  {submission.language}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(submission.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monaco (read-only) */}
        <div className="flex-1 min-h-0 relative bg-background">
          <Editor
            height="100%"
            language={
              submission.language === 'python' ? 'python'
              : submission.language === 'java' ? 'java'
              : submission.language === 'rust' ? 'rust'
              : 'cpp'
            }
            value={submission.code || ''}
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              minimap: { enabled: true },
              readOnly: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            {submission.test_case !== undefined && <span>Test: {submission.test_case}</span>}
            {submission.time_ms !== undefined && <span>Time: {submission.time_ms}ms</span>}
            {submission.memory_kb !== undefined && (
              <span>
                Memory:{' '}
                {submission.memory_kb < 1024
                  ? `${submission.memory_kb}KB`
                  : `${(submission.memory_kb / 1024).toFixed(1)}MB`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onRestore(submission.code || '', submission.language || 'cpp')}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Restore to Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
