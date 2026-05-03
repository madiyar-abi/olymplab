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
