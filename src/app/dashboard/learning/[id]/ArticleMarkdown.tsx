'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
        color: copied ? '#4ade80' : '#6272a4',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

export default function ArticleMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-cyan max-w-none mt-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },

          strong({ children }) {
            return <strong className="font-bold text-white">{children}</strong>
          },

          code(props) {
            const { children, className, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            const isBlock = String(children).includes('\n')

            if (match || isBlock) {
              // 1. Determine display label and highlighter language
              let label = match ? match[1].toLowerCase() : 'output'
              let highlightLang = label

              // Normalize C++ variants
              if (label === 'c++' || label === 'c') {
                label = 'cpp'
                highlightLang = 'cpp'
              }

              // Plain output/console blocks
              if (label === 'output' || label === 'console' || label === 'input') {
                highlightLang = 'text'
              }

              // 2. Bulletproof clean: normalize NBSP, strip indent, final trim
              // Normalize non-breaking spaces to regular spaces
              let rawCode = String(children).replace(/\u00A0/g, ' ')

              const lines = rawCode.split('\n')

              // Find absolute minimum indentation among non-empty lines
              let minIndent = Infinity
              lines.forEach(line => {
                if (line.trim().length > 0) {
                  const m = line.match(/^\s*/)
                  const len = m ? m[0].length : 0
                  if (len < minIndent) minIndent = len
                }
              })

              // Slice off common leading whitespace (safe: only slice if line is long enough)
              let processedCode = rawCode
              if (minIndent > 0 && minIndent !== Infinity) {
                processedCode = lines
                  .map(line => (line.length >= minIndent ? line.slice(minIndent) : line))
                  .join('\n')
              }

              // Final aggressive trim of surrounding blank lines
              const cleanCode = processedCode.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '')

              return (
                <div className="not-prose my-8 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl" style={{ background: '#1e1e24' }}>
                  {/* Header — inline styles so prose can never clobber padding */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 1rem',
                    background: '#2b2d31',
                    borderBottom: '1px solid rgba(63,63,70,0.5)',
                  }}>
                    <span style={{ color: '#888da7', fontSize: '0.875rem', fontFamily: 'ui-monospace, monospace', textTransform: 'lowercase', letterSpacing: '0.025em' }}>
                      {label}
                    </span>
                    <CopyButton code={cleanCode} />
                  </div>

                  {/* Code area */}
                  <SyntaxHighlighter
                    PreTag="div"
                    language={highlightLang}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem 1.25rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      color: 'unset',
                    }}
                    codeTagProps={{
                      style: { background: 'transparent', fontFamily: 'ui-monospace, monospace', color: 'unset' },
                    }}
                    showLineNumbers={false}
                    wrapLongLines={false}
                  >
                    {cleanCode}
                  </SyntaxHighlighter>
                </div>
              )
            }

            // Inline code
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
