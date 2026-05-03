import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data, error } = await supabase
    .from('roadmap_topics')
    .select('id, title, order_index, article_markdown')
    .order('order_index')

  if (error) {
    console.error(error)
    return
  }

  console.log('Topic Index | Title | Content Length | Has Viz')
  console.log('------------|-------|----------------|--------')
  data.forEach(t => {
    const content = t.article_markdown || ''
    const hasViz = content.includes('viz-')
    console.log(`${t.order_index.toString().padEnd(11)} | ${t.title.padEnd(20).slice(0, 20)} | ${content.length.toString().padEnd(14)} | ${hasViz}`)
  })
}

check()
