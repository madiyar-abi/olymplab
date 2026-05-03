const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/)
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VIZ_MAP = {
  2: { title: 'Массивы и строки', viz: '### Интерактив: Метод двух указателей\n\n```viz-pointers\n[1, 3, 2, 5, 1, 1, 2, 3]\n8\n```' },
  4: { title: 'Базовые структуры данных', viz: '### Визуализация: Стек и Очередь\n\n```viz-data\nstack\n```' },
  5: { title: 'Простые сортировки', viz: '### Визуализация: Сортировка выбором\n\n```viz-sort\nselection\n[45, 20, 60, 10, 35, 5, 50]\n```' },
  6: { title: 'Общая тема сортировок', viz: '### Визуализация: Быстрая сортировка\n\n```viz-sort\nquick\n[45, 20, 60, 10, 35, 5, 50]\n```' },
  8: { title: 'Двоичная куча и сортировка кучей', viz: '### Структура Max-Heap\n\n```viz-heap\n\n```' },
  9: { title: 'Префиксные суммы', viz: '### Интерактив: Префиксные суммы\n\n```viz-prefix\n[3, 1, 4, 1, 5, 9, 2]\n```' },
  10: { title: 'Бинарный поиск', viz: '### Визуализация: Бинарный поиск\n\n```viz-search\n23\n[2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]\n```' },
  11: { title: 'Бинарный поиск по ответу', viz: '### Визуализация: Lower Bound\n\n```viz-search\nlower_bound\n23\n[2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]\n```' },
  13: { title: 'Сжатие координат', viz: '### Интерактив: Сжатие координат\n\n```viz-coord\n[100, 500, 100, 1000, 500, 250]\n```' },
  14: { title: 'Арифметика и биты', viz: '### Песочница побитовых операций\n\n```viz-bits\n12\n25\n```' },
  16: { title: 'Простые числа и факторизация', viz: '### Интерактив: Решето Эратосфена\n\n```viz-sieve\n50\n```' },
  18: { title: 'Деревья поиска', viz: '### Визуализация: BST\n\n```viz-bst\n\n```' },
  19: { title: 'Жадные алгоритмы', viz: '### Визуализация: Жадный выбор\n\n```viz-greedy\n\n```' },
  20: { title: 'Обходы графов', viz: '### Визуализация: Обход в ширину (BFS)\n\n```viz-graph\nbfs\n```' },
  22: { title: 'Кратчайшие пути', viz: '### Алгоритм Дейкстры\n\n```viz-dijkstra\n\n```' },
  23: { title: 'DSU и остовные деревья', viz: '### Интерактив: Система непересекающихся множеств\n\n```viz-dsu\n\n```' },
  25: { title: 'Динамическое программирование', viz: '### Визуализация: Задача о рюкзаке\n\n```viz-knapsack\n\n```' },
  27: { title: 'Строки, базовый уровень', viz: '### Визуализация: Поиск подстроки\n\n```viz-string\nABABDABACDABABCABAB\nABABCABAB\n```' },
  30: { title: 'Запросы на отрезках', viz: '### Интерактив: Дерево отрезков\n\n```viz-segment\n[5, 8, 6, 3, 2, 7, 2, 6]\n```' },
  33: { title: 'Выпуклые оболочки', viz: '### Визуализация: Выпуклая оболочка\n\n```viz-hull\n\n```' },
  38: { title: 'Потоки', viz: '### Интерактив: Максимальный поток\n\n```viz-maxflow\n\n```' }
}

async function run() {
  console.log('🚀 Final Force-adding visualizers to articles...')

  for (const [orderIndex, data] of Object.entries(VIZ_MAP)) {
    const { data: topic, error } = await supabase
      .from('roadmap_topics')
      .select('id, title, article_markdown')
      .eq('order_index', orderIndex)
      .single()

    if (error || !topic) {
      console.warn(`⚠️ Topic ${orderIndex} (${data.title}) not found`)
      continue
    }

    let updatedMarkdown = topic.article_markdown || ''
    if (!updatedMarkdown || updatedMarkdown === 'null' || updatedMarkdown.length < 50) {
      updatedMarkdown = `# ${topic.title}\n\nВ этой статье мы разберем основные концепции темы "${topic.title}".`
    }

    if (!updatedMarkdown.includes('viz-')) {
        updatedMarkdown += '\n\n' + data.viz
    } else {
        // If it has a viz but maybe not THIS one, or just to be safe, replace all viz blocks or just leave it
        console.log(`ℹ️ Topic ${orderIndex} (${topic.id}) already has a visualizer tag.`)
        continue
    }

    console.log(`💾 Updating topic ${orderIndex} (ID: ${topic.id})...`)
    const { error: updateErr } = await supabase
      .from('roadmap_topics')
      .update({ article_markdown: updatedMarkdown })
      .eq('id', topic.id)

    if (updateErr) {
      console.error(`❌ Failed to update topic ${orderIndex}:`, updateErr.message)
    } else {
      console.log(`✅ Success for topic ${orderIndex}`)
    }
  }
}

run()
