'use client'

import React, { ComponentPropsWithoutRef } from 'react'
import NextLink from 'next/link'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import { CopyButton } from '@/components/ui/CopyButton'

// Visualizers
import SortingVisualizer from '@/components/learning/visualizers/SortingVisualizer'
import BinarySearchVisualizer from '@/components/learning/visualizers/BinarySearchVisualizer'
import StackQueueVisualizer from '@/components/learning/visualizers/StackQueueVisualizer'
import PrefixSumVisualizer from '@/components/learning/visualizers/PrefixSumVisualizer'
import GraphVisualizer from '@/components/learning/visualizers/GraphVisualizer'
import SieveVisualizer from '@/components/learning/visualizers/SieveVisualizer'
import BitwiseVisualizer from '@/components/learning/visualizers/BitwiseVisualizer'
import HeapVisualizer from '@/components/learning/visualizers/HeapVisualizer'
import DijkstraVisualizer from '@/components/learning/visualizers/DijkstraVisualizer'
import KnapsackVisualizer from '@/components/learning/visualizers/KnapsackVisualizer'
import BSTVisualizer from '@/components/learning/visualizers/BSTVisualizer'
import TwoPointersVisualizer from '@/components/learning/visualizers/TwoPointersVisualizer'
import StringMatchVisualizer from '@/components/learning/visualizers/StringMatchVisualizer'
import SegmentTreeVisualizer from '@/components/learning/visualizers/SegmentTreeVisualizer'
import GreedyVisualizer from '@/components/learning/visualizers/GreedyVisualizer'
import ConvexHullVisualizer from '@/components/learning/visualizers/ConvexHullVisualizer'
import EuclidVisualizer from '@/components/learning/visualizers/EuclidVisualizer'
import DSUVisualizer from '@/components/learning/visualizers/DSUVisualizer'
import SlidingWindowVisualizer from '@/components/learning/visualizers/SlidingWindowVisualizer'
import CoordinateCompressionVisualizer from '@/components/learning/visualizers/CoordinateCompressionVisualizer'
import PrefixSum2DVisualizer from '@/components/learning/visualizers/PrefixSum2DVisualizer'
import MaxFlowVisualizer from '@/components/learning/visualizers/MaxFlowVisualizer'

// ─── Topic reference type ────────────────────────────────────────────────────
interface TopicRef { id: string; title: string }

// ─── Normalize a string for fuzzy title matching ──────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().replace(/[^а-яёa-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim()
}

// ─── Try to resolve a link text to one of our roadmap topics ─────────────────
function resolveLink(text: string, topics: TopicRef[]): string | null {
  const needle = normalize(text)
  if (!needle) return null
  for (const t of topics) {
    const haystack = normalize(t.title)
    if (haystack === needle || haystack.includes(needle) || needle.includes(haystack)) {
      return t.id
    }
  }
  return null
}

function SectionContent({ content, topics }: { content: string; topics: TopicRef[] }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none 
      prose-headings:scroll-mt-20 
      prose-p:text-foreground/90 prose-p:leading-relaxed 
      prose-li:text-foreground/90 
      prose-strong:text-foreground prose-strong:font-bold
      prose-code:text-sky-400 prose-code:bg-sky-400/10 prose-code:px-1 prose-code:rounded
      prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800
      prose-img:rounded-2xl prose-img:shadow-lg
      prose-hr:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
        components={{
          // Fix Hydration Error: <p> cannot contain block elements like <div>
          p({ children }) {
            // If it has complex children, render as div to be safe, otherwise as p
            return <div className="mb-6 last:mb-0 leading-relaxed text-foreground/90">{children}</div>
          },

          // Handle links
          a(props: ComponentPropsWithoutRef<'a'>) {
            const { href, children, ...rest } = props
            const labelText = String(children)
            
            // Try to resolve internal roadmap links
            const topicId = resolveLink(labelText, topics)
            if (topicId) {
              return (
                <NextLink
                  href={`/dashboard/learning/${topicId}`}
                  className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-500/30 transition-colors font-semibold"
                  {...rest}
                >
                  {children}
                </NextLink>
              )
            }

            if (href) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-4 decoration-violet-500/30 transition-colors font-medium"
                >
                  {children}
                </a>
              )
            }

            return <span className="text-muted-foreground">{children}</span>
          },

          // Handle code and visualizers
          pre(props: ComponentPropsWithoutRef<'pre'>) {
            const { children } = props
            return <div className="not-prose my-8">{children}</div>
          },

          code(props: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const { children, className, inline, ...rest } = props
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '')
            
            const contentString = React.Children.toArray(children).join('')

            // React-Markdown v9+ removes the `inline` prop.
            // We deduce it's inline if `inline` is true, or if it lacks a language match AND has no newlines.
            const isInline = inline !== undefined ? inline : (!match && !contentString.includes('\n'));

            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sky-400 font-mono text-[0.9em] border border-border/50" {...rest}>
                  {children}
                </code>
              )
            }

            let label = (match ? match[1] : 'output').toLowerCase()
            const initialRawCode = contentString.replace(/\u00A0/g, ' ')
            const initialCleanCode = initialRawCode.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '')
            const vizLines = initialCleanCode.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

            const safeJsonParse = (str: string) => {
              if (!str) return undefined
              try { return JSON.parse(str.replace(/'/g, '"')) } catch { return undefined }
            }

            // ─── Visualizer Handlers ─────────────────────────────────────
            if (label.startsWith('viz-')) {
              const vizMap: Record<string, () => React.ReactNode> = {
                'viz-sort': () => <SortingVisualizer algorithm={vizLines[0] as 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'} initialArray={safeJsonParse(vizLines[1])} />,
                'viz-search': () => <BinarySearchVisualizer target={parseInt(vizLines[0]) || 23} initialArray={safeJsonParse(vizLines[1])} />,
                'viz-data': () => <StackQueueVisualizer type={(vizLines[0] || 'stack') as 'stack' | 'queue'} />,
                'viz-prefix': () => <PrefixSumVisualizer initialArray={safeJsonParse(vizLines[0])} />,
                'viz-graph': () => <GraphVisualizer type={(vizLines[0] || 'bfs') as 'bfs' | 'dfs'} />,
                'viz-sieve': () => <SieveVisualizer limit={parseInt(vizLines[0]) || 40} />,
                'viz-bits': () => <BitwiseVisualizer initialA={parseInt(vizLines[0])} initialB={parseInt(vizLines[1])} />,
                'viz-heap': () => <HeapVisualizer />,
                'viz-dijkstra': () => <DijkstraVisualizer />,
                'viz-knapsack': () => <KnapsackVisualizer />,
                'viz-bst': () => <BSTVisualizer />,
                'viz-pointers': () => <TwoPointersVisualizer initialArray={safeJsonParse(vizLines[0])} targetSum={parseInt(vizLines[1])} />,
                'viz-string': () => <StringMatchVisualizer text={vizLines[0]} pattern={vizLines[1]} />,
                'viz-segment': () => <SegmentTreeVisualizer initialArray={safeJsonParse(vizLines[0])} />,
                'viz-greedy': () => <GreedyVisualizer />,
                'viz-hull': () => <ConvexHullVisualizer />,
                'viz-euclid': () => <EuclidVisualizer initialA={parseInt(vizLines[0])} initialB={parseInt(vizLines[1])} />,
                'viz-dsu': () => <DSUVisualizer />,
                'viz-sliding-window': () => <SlidingWindowVisualizer />,
                'viz-coord': () => <CoordinateCompressionVisualizer initialArray={safeJsonParse(vizLines[0])} />,
                'viz-prefix2d': () => <PrefixSum2DVisualizer initialGrid={safeJsonParse(vizLines[0])} />,
                'viz-maxflow': () => <MaxFlowVisualizer />,
              }

              const renderViz = vizMap[label]
              if (renderViz) {
                return <div className="my-2">{renderViz()}</div>
              }
            }

            let highlightLang = label
            if (label === 'c++' || label === 'c') {
              label = 'cpp'
              highlightLang = 'cpp'
            }
            if (label === 'output' || label === 'console' || label === 'input') {
              highlightLang = 'text'
            }

            const cleanCode = initialCleanCode

            return (
              <div className="not-prose my-10 rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#0d0f14]">
                <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b border-border backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                    </div>
                    <span className="text-muted-foreground text-xs font-mono uppercase tracking-widest opacity-70">
                      {label}
                    </span>
                  </div>
                  <CopyButton value={cleanCode} showText />
                </div>
                <SyntaxHighlighter
                  PreTag="div"
                  language={highlightLang}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem 1.75rem',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    lineHeight: '1.7',
                    color: 'unset',
                  }}
                  codeTagProps={{
                    style: { background: 'transparent', fontFamily: 'JetBrains Mono, Fira Code, ui-monospace, monospace', color: 'unset' },
                  }}
                  showLineNumbers={false}
                  wrapLongLines={false}
                >
                  {cleanCode}
                </SyntaxHighlighter>
              </div>
            )
          },
        }}
      >
        {content
          .replace(/\$\$\$/g, '$')
          .replace(/∗/g, '$\\ast$')
          .replace(/†/g, '$\\dagger$')
          .replace(/‡/g, '$\\ddagger$')}
      </ReactMarkdown>
    </div>
  )
}


function cleanSection(raw: string): string {
  return raw
    .split('\n')
    .filter(line => {
      const t = line.trim()
      if (/^←\s/.test(t) || /\s→$/.test(t)) return false
      if (/\[←/.test(t) || /→\]/.test(t)) return false
      if (/\]\(\.\.\//i.test(t) || /\]\(\.\//i.test(t)) return false
      if (/^←\s*\.\.\//.test(t)) return false
      // Keep images, they make it look better!
      return true
    })
    .join('\n')
    .trim()
}

function getSectionTitle(section: string, index: number): string {
  const firstLine = section.trim().split('\n')[0] ?? ''
  const cleaned = firstLine.replace(/^#+\s*/, '').trim()
  return cleaned.length > 0 && cleaned.length < 80 ? cleaned : `Часть ${index + 1}`
}

const MIN_CONTENT_LEN = 120

function splitSections(content: string): string[] {
  // If content contains viz tags, don't split or split carefully
  // For now, let's just return the whole content if it has viz tags to avoid breaking blocks
  if (content.includes('viz-')) {
    return [cleanSection(content)]
  }

  const raw = content
    .split(/\n\s*---\s*\n/)
    .map(s => cleanSection(s))
    .filter(s => s.length >= MIN_CONTENT_LEN)

  return raw.length > 0 ? raw : [cleanSection(content)]
}

export default function ArticleMarkdown({ content, topics }: { content: string; topics: TopicRef[] }) {
  const sections = splitSections(content)

  return (
    <div className="space-y-16">
      {sections.map((section, idx) => (
        <motion.section 
          key={idx} 
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: idx === 0 ? 0 : 0.1 }}
        >
          <SectionContent content={section} topics={topics} />
        </motion.section>
      ))}
    </div>
  )
}
