import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function appendViz(title: string, vizMarkdown: string) {
  const { data } = await supabase.from('roadmap_topics').select('id, article_markdown').eq('title', title).single()
  if (data && !data.article_markdown.includes(vizMarkdown.split('\\n')[0].trim())) {
    const updated = data.article_markdown + '\\n\\n' + vizMarkdown
    await supabase.from('roadmap_topics').update({ article_markdown: updated }).eq('id', data.id)
    console.log('✅ Appended viz to', title)
  }
}

async function run() {
  await appendViz('Простые числа и факторизация', '### Интерактив: Решето Эратосфена\\n\\n\`\`\`viz-sieve\\n50\\n\`\`\`\\n')
  await appendViz('Арифметика и биты', '### Песочница побитовых операций\\n\\n\`\`\`viz-bits\\n12\\n25\\n\`\`\`\\n')
  await appendViz('Двоичная куча и сортировка кучей', '### Структура Max-Heap\\n\\n\`\`\`viz-heap\\n\\n\`\`\`\\n')
  await appendViz('Массивы и строки', '### Интерактив: Метод двух указателей\\n\\n\`\`\`viz-pointers\\n[1, 3, 2, 5, 1, 1, 2, 3]\\n8\\n\`\`\`\\n')
  await appendViz('Строки, базовый уровень', '### Визуализация: Поиск подстроки\\n\\n\`\`\`viz-string\\nABABDABACDABABCABAB\\nABABCABAB\\n\`\`\`\\n')
}

run()