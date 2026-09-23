'use client'

import { useState, useMemo } from 'react'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Search,
  ArrowLeft,
  Sparkles,
  Maximize2,
  ChevronRight,
  Terminal,
  Layers,
  Network,
  Cpu,
  Compass
} from 'lucide-react'

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

type CategoryKey = 'all' | 'sort' | 'ds' | 'graph' | 'dp' | 'math'

interface VisualizerItem {
  id: string
  title: string
  category: CategoryKey
  complexity: string
  summary: string
  render: () => React.ReactNode
}

export function VisualizersGalleryClient() {
  const t = useTranslations('Syllabi')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVizId, setSelectedVizId] = useState<string | null>('binary-search')

  const visualizers: VisualizerItem[] = useMemo(() => [
    {
      id: 'binary-search',
      title: 'Binary Search',
      category: 'sort',
      complexity: 'O(log N)',
      summary: 'Halves the search space at each step in a monotonically ordered array.',
      render: () => <BinarySearchVisualizer target={23} initialArray={[3, 7, 12, 18, 23, 29, 34, 45, 56, 67, 78, 89, 94]} />
    },
    {
      id: 'sorting',
      title: 'Sorting Algorithms',
      category: 'sort',
      complexity: 'O(N log N) / O(N²)',
      summary: 'Interactive step-through of Bubble, Selection, Insertion, Merge, and Quick Sort.',
      render: () => <SortingVisualizer algorithm="bubble" initialArray={[45, 20, 60, 10, 35, 5, 50]} />
    },
    {
      id: 'two-pointers',
      title: 'Two Pointers Technique',
      category: 'sort',
      complexity: 'O(N)',
      summary: 'Converging pointers to find target sums and subarray bounds in linear time.',
      render: () => <TwoPointersVisualizer initialArray={[1, 3, 5, 8, 11, 15, 18, 22]} targetSum={19} />
    },
    {
      id: 'sliding-window',
      title: 'Sliding Window',
      category: 'sort',
      complexity: 'O(N)',
      summary: 'Maintains invariant contiguous subarray states with dynamic window bounds.',
      render: () => <SlidingWindowVisualizer />
    },
    {
      id: 'coord-compression',
      title: 'Coordinate Compression',
      category: 'sort',
      complexity: 'O(N log N)',
      summary: 'Maps sparse arbitrary numbers into dense 0-indexed ranges preserving relative order.',
      render: () => <CoordinateCompressionVisualizer initialArray={[1000, 5, 250000, 42, 1000, 5]} />
    },
    {
      id: 'stack-queue',
      title: 'Stack & Queue',
      category: 'ds',
      complexity: 'O(1)',
      summary: 'LIFO (Last In First Out) and FIFO (First In First Out) core linear collections.',
      render: () => <StackQueueVisualizer type="stack" />
    },
    {
      id: 'heap',
      title: 'Binary Heap (Priority Queue)',
      category: 'ds',
      complexity: 'O(log N)',
      summary: 'Complete binary tree preserving heap invariants with bubble-up and bubble-down.',
      render: () => <HeapVisualizer />
    },
    {
      id: 'bst',
      title: 'Binary Search Tree (BST)',
      category: 'ds',
      complexity: 'O(log N)',
      summary: 'Ordered tree structure allowing fast insertions, lookups, and traversals.',
      render: () => <BSTVisualizer />
    },
    {
      id: 'segment-tree',
      title: 'Segment Tree',
      category: 'ds',
      complexity: 'O(log N)',
      summary: 'Tree data structure enabling logarithmic range queries and point updates.',
      render: () => <SegmentTreeVisualizer initialArray={[1, 3, 5, 7, 9, 11]} />
    },
    {
      id: 'dsu',
      title: 'Disjoint Set Union (DSU)',
      category: 'ds',
      complexity: 'O(α(N))',
      summary: 'Near constant-time dynamic connectivity with path compression & union by rank.',
      render: () => <DSUVisualizer />
    },
    {
      id: 'prefix-sum',
      title: '1D Prefix Sums',
      category: 'ds',
      complexity: 'O(1) query',
      summary: 'Precomputes cumulative sums for instant subsegment range sum evaluations.',
      render: () => <PrefixSumVisualizer initialArray={[2, 4, 1, 7, 3, 9, 5]} />
    },
    {
      id: 'prefix-sum-2d',
      title: '2D Prefix Sums',
      category: 'ds',
      complexity: 'O(1) query',
      summary: 'Inclusion-exclusion matrix precomputation for arbitrary subgrid queries.',
      render: () => <PrefixSum2DVisualizer initialGrid={[[1, 2, 3], [4, 5, 6], [7, 8, 9]]} />
    },
    {
      id: 'graph-traversal',
      title: 'Breadth & Depth First Search',
      category: 'graph',
      complexity: 'O(V + E)',
      summary: 'Fundamental graph traversals: BFS for shortest hops and DFS for connected components.',
      render: () => <GraphVisualizer type="bfs" />
    },
    {
      id: 'dijkstra',
      title: 'Dijkstra Shortest Path',
      category: 'graph',
      complexity: 'O((V + E) log V)',
      summary: 'Greedy shortest path in weighted graphs with non-negative edge costs.',
      render: () => <DijkstraVisualizer />
    },
    {
      id: 'max-flow',
      title: 'Edmonds-Karp Max Flow',
      category: 'graph',
      complexity: 'O(V E²)',
      summary: 'Augmenting paths with BFS residual capacity network saturation.',
      render: () => <MaxFlowVisualizer />
    },
    {
      id: 'knapsack',
      title: '0/1 Knapsack (DP)',
      category: 'dp',
      complexity: 'O(N · W)',
      summary: 'Classic dynamic programming maximizing value within weight limits.',
      render: () => <KnapsackVisualizer />
    },
    {
      id: 'greedy',
      title: 'Greedy Interval Scheduling',
      category: 'dp',
      complexity: 'O(N log N)',
      summary: 'Sorts intervals by earliest finish time to maximize non-overlapping selections.',
      render: () => <GreedyVisualizer />
    },
    {
      id: 'bitwise',
      title: 'Bitwise Manipulation',
      category: 'math',
      complexity: 'O(1)',
      summary: 'Binary representations, bit masks, shifts, and bitwise boolean logic.',
      render: () => <BitwiseVisualizer initialA={29} initialB={15} />
    },
    {
      id: 'sieve',
      title: 'Sieve of Eratosthenes',
      category: 'math',
      complexity: 'O(N log log N)',
      summary: 'Rapidly identifies all prime numbers up to a given limit by crossing out multiples.',
      render: () => <SieveVisualizer limit={40} />
    },
    {
      id: 'euclid',
      title: 'Euclidean GCD Algorithm',
      category: 'math',
      complexity: 'O(log min(A, B))',
      summary: 'Computes the greatest common divisor using iterative remainder division.',
      render: () => <EuclidVisualizer initialA={1071} initialB={462} />
    },
    {
      id: 'convex-hull',
      title: 'Convex Hull (Graham Scan)',
      category: 'math',
      complexity: 'O(N log N)',
      summary: 'Encloses 2D points inside the minimal convex boundary polygon via cross products.',
      render: () => <ConvexHullVisualizer />
    },
    {
      id: 'string-matching',
      title: 'String Matching (KMP)',
      category: 'math',
      complexity: 'O(N + M)',
      summary: 'Sub-quadratic pattern discovery using longest prefix-suffix (LPS) transitions.',
      render: () => <StringMatchVisualizer text="ABABDABACDABABCABAB" pattern="ABABCABAB" />
    }
  ], [])

  const categories: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: t('visualizerAll'), icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'sort', label: t('visualizerTagSort'), icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'ds', label: t('visualizerTagDS'), icon: <Cpu className="w-3.5 h-3.5" /> },
    { key: 'graph', label: t('visualizerTagGraph'), icon: <Network className="w-3.5 h-3.5" /> },
    { key: 'dp', label: t('visualizerTagDP'), icon: <Terminal className="w-3.5 h-3.5" /> },
    { key: 'math', label: t('visualizerTagMath'), icon: <Compass className="w-3.5 h-3.5" /> },
  ]

  const filteredVisualizers = useMemo(() => {
    return visualizers.filter(viz => {
      const matchesCategory = activeCategory === 'all' || viz.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = !query ||
        viz.title.toLowerCase().includes(query) ||
        viz.summary.toLowerCase().includes(query) ||
        viz.complexity.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [visualizers, activeCategory, searchQuery])

  const selectedViz = useMemo(() => {
    return visualizers.find(v => v.id === selectedVizId) || visualizers[0]
  }, [visualizers, selectedVizId])

  return (
    <div className="min-h-full bg-background text-foreground pb-24">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/learning"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('roadmap')}
              </Link>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-xs text-amber-400 font-mono font-medium">{t('visualizersLab')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{t('visualizersLab')}</h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{t('visualizersLabSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('visualizerSearch')}
              className="w-full pl-9 pr-4 py-2 bg-secondary/60 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-6 overflow-x-auto hide-scrollbar pt-1">
          {categories.map(cat => {
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8">
        {/* Selected Interactive Sandbox Display */}
        {selectedViz && (
          <motion.div
            key={selectedViz.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-card p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active Sandbox
                  </span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                    {selectedViz.complexity}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{selectedViz.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{selectedViz.summary}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground/60 hidden sm:inline">
                  Interactive Live State
                </span>
              </div>
            </div>

            {/* Sandbox Container */}
            <div className="rounded-xl overflow-hidden bg-card/60 border border-border/80 p-2 sm:p-4">
              {selectedViz.render()}
            </div>
          </motion.div>
        )}

        {/* Algorithm Catalog Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
            {t('visualizersLab')} Catalog ({filteredVisualizers.length})
          </h3>
        </div>

        {filteredVisualizers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('visualizerNotFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisualizers.map((item) => {
              const isSelected = selectedVizId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedVizId(item.id)
                    window.scrollTo({ top: 120, behavior: 'smooth' })
                  }}
                  className={`group cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/[0.08] border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-card border-border hover:border-amber-500/30 hover:bg-secondary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {item.complexity}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-semibold">
                          <Maximize2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-foreground group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground/60 uppercase">{item.category}</span>
                    <span className="text-amber-400 group-hover:underline">Launch Sandbox →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
