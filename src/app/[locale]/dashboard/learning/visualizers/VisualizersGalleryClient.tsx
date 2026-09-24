'use client'

import { useState, useMemo, useRef } from 'react'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
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
  titleRu: string
  category: CategoryKey
  categoryRu: string
  complexity: string
  summary: string
  summaryRu: string
  render: () => React.ReactNode
}

export function VisualizersGalleryClient() {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const sandboxRef = useRef<HTMLDivElement>(null)

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVizId, setSelectedVizId] = useState<string | null>('binary-search')

  const visualizers: VisualizerItem[] = useMemo(() => [
    {
      id: 'binary-search',
      title: 'Binary Search',
      titleRu: 'Бинарный поиск',
      category: 'sort',
      categoryRu: 'Поиск',
      complexity: 'O(log N)',
      summary: 'Halves the search space at each step in a monotonically ordered array.',
      summaryRu: 'Делит пространство поиска пополам на каждом шаге в отсортированном массиве.',
      render: () => <BinarySearchVisualizer target={23} initialArray={[3, 7, 12, 18, 23, 29, 34, 45, 56, 67, 78, 89, 94]} />
    },
    {
      id: 'sorting',
      title: 'Sorting Algorithms',
      titleRu: 'Алгоритмы сортировки',
      category: 'sort',
      categoryRu: 'Сортировки',
      complexity: 'O(N log N) / O(N²)',
      summary: 'Interactive step-through of Bubble, Selection, Insertion, Merge, and Quick Sort.',
      summaryRu: 'Интерактивная пошаговая демонстрация: пузырьком, выбором, вставками, слиянием и быстрая сортировка.',
      render: () => <SortingVisualizer algorithm="bubble" initialArray={[45, 20, 60, 10, 35, 5, 50]} />
    },
    {
      id: 'two-pointers',
      title: 'Two Pointers Technique',
      titleRu: 'Метод двух указателей',
      category: 'sort',
      categoryRu: 'Указатели',
      complexity: 'O(N)',
      summary: 'Converging pointers to find target sums and subarray bounds in linear time.',
      summaryRu: 'Сходящиеся или параллельные указатели для поиска сумм и границ подотрезков за O(N).',
      render: () => <TwoPointersVisualizer initialArray={[1, 3, 5, 8, 11, 15, 18, 22]} targetSum={19} />
    },
    {
      id: 'sliding-window',
      title: 'Sliding Window',
      titleRu: 'Скользящее окно',
      category: 'sort',
      categoryRu: 'Указатели',
      complexity: 'O(N)',
      summary: 'Maintains invariant contiguous subarray states with dynamic window bounds.',
      summaryRu: 'Поддержание инварианта непрерывного подотрезка с динамическими границами.',
      render: () => <SlidingWindowVisualizer />
    },
    {
      id: 'coord-compression',
      title: 'Coordinate Compression',
      titleRu: 'Сжатие координат',
      category: 'sort',
      categoryRu: 'Сортировки',
      complexity: 'O(N log N)',
      summary: 'Maps sparse arbitrary numbers into dense 0-indexed ranges preserving relative order.',
      summaryRu: 'Отображение больших разреженных чисел в плотный диапазон [0..k-1] с сохранением порядка.',
      render: () => <CoordinateCompressionVisualizer initialArray={[1000, 5, 250000, 42, 1000, 5]} />
    },
    {
      id: 'stack-queue',
      title: 'Stack & Queue',
      titleRu: 'Стек и очередь',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(1)',
      summary: 'LIFO (Last In First Out) and FIFO (First In First Out) core linear collections.',
      summaryRu: 'Линейные структуры данных LIFO (последний пришел — первый ушел) и FIFO (первый пришел — первый ушел).',
      render: () => <StackQueueVisualizer type="stack" />
    },
    {
      id: 'heap',
      title: 'Binary Heap (Priority Queue)',
      titleRu: 'Двоичная куча (Priority Queue)',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(log N)',
      summary: 'Complete binary tree preserving heap invariants with bubble-up and bubble-down.',
      summaryRu: 'Полное бинарное дерево с поддержкой инварианта кучи и операциями просеивания.',
      render: () => <HeapVisualizer />
    },
    {
      id: 'bst',
      title: 'Binary Search Tree (BST)',
      titleRu: 'Двоичное дерево поиска (BST)',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(log N)',
      summary: 'Ordered tree structure allowing fast insertions, lookups, and traversals.',
      summaryRu: 'Упорядоченная древовидная структура для быстрого поиска, вставки и обхода.',
      render: () => <BSTVisualizer />
    },
    {
      id: 'segment-tree',
      title: 'Segment Tree',
      titleRu: 'Дерево отрезков',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(log N)',
      summary: 'Tree data structure enabling logarithmic range queries and point updates.',
      summaryRu: 'Мощная структура данных для логарифмических запросов на отрезке и точечных обновлений.',
      render: () => <SegmentTreeVisualizer initialArray={[1, 3, 5, 7, 9, 11]} />
    },
    {
      id: 'dsu',
      title: 'Disjoint Set Union (DSU)',
      titleRu: 'Система непересекающихся множеств (DSU)',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(α(N))',
      summary: 'Near constant-time dynamic connectivity with path compression & union by rank.',
      summaryRu: 'Динамическая связность почти за константное время с эвристикой ранга и сжатием путей.',
      render: () => <DSUVisualizer />
    },
    {
      id: 'prefix-sum',
      title: '1D Prefix Sums',
      titleRu: '1D Префиксные суммы',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(1) query',
      summary: 'Precomputes cumulative sums for instant subsegment range sum evaluations.',
      summaryRu: 'Предпосчет накопленных сумм для мгновенного нахождения суммы на любом подотрезке за O(1).',
      render: () => <PrefixSumVisualizer initialArray={[2, 4, 1, 7, 3, 9, 5]} />
    },
    {
      id: 'prefix-sum-2d',
      title: '2D Prefix Sums',
      titleRu: '2D Префиксные суммы',
      category: 'ds',
      categoryRu: 'Структуры данных',
      complexity: 'O(1) query',
      summary: 'Inclusion-exclusion matrix precomputation for arbitrary subgrid queries.',
      summaryRu: 'Формула включений-исключений для запросов суммы в любом подпрямоугольнике матрицы за O(1).',
      render: () => <PrefixSum2DVisualizer initialGrid={[[1, 2, 3], [4, 5, 6], [7, 8, 9]]} />
    },
    {
      id: 'graph-traversal',
      title: 'Breadth & Depth First Search (BFS/DFS)',
      titleRu: 'Обходы графов (BFS и DFS)',
      category: 'graph',
      categoryRu: 'Графы',
      complexity: 'O(V + E)',
      summary: 'Fundamental graph traversals: BFS for shortest hops and DFS for connected components.',
      summaryRu: 'Базовые алгоритмы: поиск в ширину (кратчайшие пути) и поиск в глубину (компоненты связности).',
      render: () => <GraphVisualizer type="bfs" />
    },
    {
      id: 'dijkstra',
      title: 'Dijkstra Shortest Path',
      titleRu: 'Алгоритм Дейкстры',
      category: 'graph',
      categoryRu: 'Графы',
      complexity: 'O((V + E) log V)',
      summary: 'Greedy shortest path in weighted graphs with non-negative edge costs.',
      summaryRu: 'Жадный поиск кратчайших путей во взвешенных графах с неотрицательными весами ребер.',
      render: () => <DijkstraVisualizer />
    },
    {
      id: 'max-flow',
      title: 'Edmonds-Karp Max Flow',
      titleRu: 'Максимальный поток (Эдмондс-Карп)',
      category: 'graph',
      categoryRu: 'Графы',
      complexity: 'O(V E²)',
      summary: 'Augmenting paths with BFS residual capacity network saturation.',
      summaryRu: 'Поиск увеличивающих путей через BFS для насыщения остаточной сети.',
      render: () => <MaxFlowVisualizer />
    },
    {
      id: 'knapsack',
      title: '0/1 Knapsack (DP)',
      titleRu: 'Рюкзак 0/1 (Динамическое программирование)',
      category: 'dp',
      categoryRu: 'Динамика',
      complexity: 'O(N · W)',
      summary: 'Classic dynamic programming maximizing value within weight limits.',
      summaryRu: 'Классическая задача ДП: максимизация ценности предметов при ограничении по весу.',
      render: () => <KnapsackVisualizer />
    },
    {
      id: 'greedy',
      title: 'Greedy Interval Scheduling',
      titleRu: 'Жадный выбор отрезков',
      category: 'dp',
      categoryRu: 'Жадные алгоритмы',
      complexity: 'O(N log N)',
      summary: 'Sorts intervals by earliest finish time to maximize non-overlapping selections.',
      summaryRu: 'Сортировка по времени окончания для выбора максимального количества непересекающихся отрезков.',
      render: () => <GreedyVisualizer />
    },
    {
      id: 'bitwise',
      title: 'Bitwise Manipulation',
      titleRu: 'Битовые операции и маски',
      category: 'math',
      categoryRu: 'Математика',
      complexity: 'O(1)',
      summary: 'Binary representations, bit masks, shifts, and bitwise boolean logic.',
      summaryRu: 'Двоичное представление чисел, битовые маски, сдвиги и логические побитовые операции.',
      render: () => <BitwiseVisualizer initialA={29} initialB={15} />
    },
    {
      id: 'sieve',
      title: 'Sieve of Eratosthenes',
      titleRu: 'Решето Эратосфена',
      category: 'math',
      categoryRu: 'Математика',
      complexity: 'O(N log log N)',
      summary: 'Rapidly identifies all prime numbers up to a given limit by crossing out multiples.',
      summaryRu: 'Быстрый поиск всех простых чисел до N путем последовательного вычеркивания кратных.',
      render: () => <SieveVisualizer limit={40} />
    },
    {
      id: 'euclid',
      title: 'Euclidean GCD Algorithm',
      titleRu: 'Алгоритм Евклида (НОД)',
      category: 'math',
      categoryRu: 'Математика',
      complexity: 'O(log min(A, B))',
      summary: 'Computes the greatest common divisor using iterative remainder division.',
      summaryRu: 'Нахождение наибольшего общего делителя двух чисел через деление с остатком.',
      render: () => <EuclidVisualizer initialA={1071} initialB={462} />
    },
    {
      id: 'convex-hull',
      title: 'Convex Hull (Graham Scan)',
      titleRu: 'Выпуклая оболочка (Грэхем)',
      category: 'math',
      categoryRu: 'Геометрия',
      complexity: 'O(N log N)',
      summary: 'Encloses 2D points inside the minimal convex boundary polygon via cross products.',
      summaryRu: 'Построение минимального выпуклого многоугольника, охватывающего заданные точки на плоскости.',
      render: () => <ConvexHullVisualizer />
    },
    {
      id: 'string-matching',
      title: 'String Matching (KMP)',
      titleRu: 'Поиск подстроки (Кнут-Моррис-Пратт)',
      category: 'math',
      categoryRu: 'Строки',
      complexity: 'O(N + M)',
      summary: 'Sub-quadratic pattern discovery using longest prefix-suffix (LPS) transitions.',
      summaryRu: 'Линейный поиск подстроки с использованием префикс-функции (π-массива).',
      render: () => <StringMatchVisualizer text="ABABDABACDABABCABAB" pattern="ABABCABAB" />
    }
  ], [])

  const categories: { key: CategoryKey; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { key: 'all', label: isRu ? 'Все алгоритмы' : 'All Algorithms', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'sort', label: isRu ? 'Сортировки и поиск' : 'Sorting & Search', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'ds', label: isRu ? 'Структуры данных' : 'Data Structures', icon: <Cpu className="w-3.5 h-3.5" /> },
    { key: 'graph', label: isRu ? 'Графы' : 'Graphs', icon: <Network className="w-3.5 h-3.5" /> },
    { key: 'dp', label: isRu ? 'Динамика и жадность' : 'DP & Greedy', icon: <Terminal className="w-3.5 h-3.5" /> },
    { key: 'math', label: isRu ? 'Математика и геометрия' : 'Math & Geometry', icon: <Compass className="w-3.5 h-3.5" /> },
  ], [isRu])

  const filteredVisualizers = useMemo(() => {
    return visualizers.filter(viz => {
      const matchesCategory = activeCategory === 'all' || viz.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const title = isRu ? viz.titleRu : viz.title
      const summary = isRu ? viz.summaryRu : viz.summary
      const matchesSearch = !query ||
        title.toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query) ||
        viz.complexity.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [visualizers, activeCategory, searchQuery, isRu])

  const selectedViz = useMemo(() => {
    return visualizers.find(v => v.id === selectedVizId) || visualizers[0]
  }, [visualizers, selectedVizId])

  const handleSelectVisualizer = (id: string, e: React.MouseEvent) => {
    setSelectedVizId(id)

    // Smoothly scroll the scrollable dashboard container to the top
    const mainContainer = (e.currentTarget as HTMLElement).closest('main')
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      sandboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-full bg-background text-foreground pb-24">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/learning"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {isRu ? 'Программа обучения' : 'Curriculum'}
              </Link>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-xs text-amber-500 font-mono font-medium">
                {isRu ? 'Лаборатория визуализаторов' : 'Visualizers Lab'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm shadow-lg shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {isRu ? 'Лаборатория визуализаторов' : 'Algorithm Visualizer Lab'}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {isRu
                    ? '22 интерактивные визуализации ключевых алгоритмов и структур данных'
                    : '22 interactive sandboxes for competitive programming algorithms'}
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRu ? 'Поиск алгоритма (Дейкстра, ДО)...' : 'Search algorithm...'}
              className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400 shadow-sm'
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
          <div ref={sandboxRef}>
            <motion.div
              key={selectedViz.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-card p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border/60">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      {isRu ? 'Активная лаборатория' : 'Active Sandbox'}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                      {selectedViz.complexity}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                    {isRu ? selectedViz.titleRu : selectedViz.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    {isRu ? selectedViz.summaryRu : selectedViz.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground/80 hidden sm:inline">
                    {isRu ? 'Интерактивный режим реального времени' : 'Interactive Live State'}
                  </span>
                </div>
              </div>

              {/* Sandbox Container */}
              <div className="rounded-xl overflow-hidden bg-card border border-border/80 p-2 sm:p-4 shadow-inner">
                {selectedViz.render()}
              </div>
            </motion.div>
          </div>
        )}

        {/* Algorithm Catalog Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
            {isRu ? 'Каталог алгоритмов' : 'Algorithm Catalog'} ({filteredVisualizers.length})
          </h3>
        </div>

        {filteredVisualizers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Алгоритмы не найдены' : 'No visualizers found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVisualizers.map((item) => {
              const isSelected = selectedVizId === item.id
              const title = isRu ? item.titleRu : item.title
              const summary = isRu ? item.summaryRu : item.summary
              const catLabel = isRu ? item.categoryRu : item.category

              return (
                <div
                  key={item.id}
                  onClick={(e) => handleSelectVisualizer(item.id, e)}
                  className={`group cursor-pointer rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/[0.08] border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-card border-border hover:border-amber-500/40 hover:bg-secondary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {item.complexity}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-500 dark:text-amber-400 font-semibold">
                          <Maximize2 className="w-3 h-3" /> {isRu ? 'Открыто' : 'Active'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-foreground group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground/70 uppercase tracking-wider">{catLabel}</span>
                    <span className="text-amber-500 dark:text-amber-400 font-semibold group-hover:underline">
                      {isRu ? 'Открыть в песочнице →' : 'Launch Sandbox →'}
                    </span>
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
