import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const topics = [
  // Stage 1: Начальный
  {
    title: 'Основы языка (Ввод-вывод, типы, циклы, функции)',
    stage: 'Начальный',
    order_index: 1,
    prerequisites: [],
    article_url: null,
  },
  {
    title: 'Массивы и строки',
    stage: 'Начальный',
    order_index: 2,
    prerequisites: ['Основы языка (Ввод-вывод, типы, циклы, функции)'],
    article_url: null,
  },
  {
    title: 'Оценка сложности (Асимптотика, O(n), O(n log n))',
    stage: 'Начальный',
    order_index: 3,
    prerequisites: ['Массивы и строки'],
    article_url: null,
  },
  {
    title: 'Простая реализация и симуляция',
    stage: 'Начальный',
    order_index: 4,
    prerequisites: ['Оценка сложности (Асимптотика, O(n), O(n log n))'],
    article_url: null,
  },

  // Stage 2: Базовый
  {
    title: 'Базовые структуры данных (Stack, Queue, Set, Map)',
    stage: 'Базовый',
    order_index: 5,
    prerequisites: ['Простая реализация и симуляция'],
    article_url: null,
  },
  {
    title: 'Сортировка',
    stage: 'Базовый',
    order_index: 6,
    prerequisites: ['Базовые структуры данных (Stack, Queue, Set, Map)'],
    article_url: null,
  },
  {
    title: 'Бинарный поиск',
    stage: 'Базовый',
    order_index: 7,
    prerequisites: ['Сортировка'],
    article_url: null,
  },
  {
    title: 'Two Pointers / Sliding Window / Prefix Sum',
    stage: 'Базовый',
    order_index: 8,
    prerequisites: ['Бинарный поиск'],
    article_url: null,
  },
  {
    title: 'Жадные алгоритмы (Greedy)',
    stage: 'Базовый',
    order_index: 9,
    prerequisites: ['Two Pointers / Sliding Window / Prefix Sum'],
    article_url: null,
  },

  // Stage 3: Средний
  {
    title: 'Рекурсия и Backtracking',
    stage: 'Средний',
    order_index: 10,
    prerequisites: ['Жадные алгоритмы (Greedy)'],
    article_url: null,
  },
  {
    title: 'Теория чисел и Битовые операции (Number theory, modular arithmetic)',
    stage: 'Средний',
    order_index: 11,
    prerequisites: ['Рекурсия и Backtracking'],
    article_url: null,
  },
  {
    title: 'Деревья (Trees, Heap)',
    stage: 'Средний',
    order_index: 12,
    prerequisites: ['Теория чисел и Битовые операции (Number theory, modular arithmetic)'],
    article_url: null,
  },
  {
    title: 'Продвинутые структуры (Fenwick, Segment Tree)',
    stage: 'Средний',
    order_index: 13,
    prerequisites: ['Деревья (Trees, Heap)'],
    article_url: null,
  },

  // Stage 4: Продвинутый
  {
    title: 'Графы (BFS, DFS, Shortest paths, DSU, Topological sort)',
    stage: 'Продвинутый',
    order_index: 14,
    prerequisites: ['Продвинутые структуры (Fenwick, Segment Tree)'],
    article_url: null,
  },
  {
    title: 'Динамическое программирование (1D/2D DP, Knapsack, DP on trees)',
    stage: 'Продвинутый',
    order_index: 15,
    prerequisites: ['Графы (BFS, DFS, Shortest paths, DSU, Topological sort)'],
    article_url: null,
  },
]

async function seed() {
  console.log('🌱 Seeding roadmap_topics...')

  // Clear existing topics first
  const { error: delError } = await supabase.from('roadmap_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.warn('Warning clearing table:', delError.message)
  }

  const { data, error } = await supabase.from('roadmap_topics').insert(topics).select()

  if (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ Seeded ${data?.length ?? 0} topics successfully!`)
}

seed()
