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

async function debug() {
  const { data, error } = await supabase
    .from('roadmap_topics')
    .select('title, article_markdown')
    .eq('order_index', 10)
    .single()

  if (error) {
    console.error(error)
    return
  }

  console.log('Title:', data.title)
  console.log('Content exists:', !!data.article_markdown)
  console.log('Content length:', data.article_markdown?.length)
  console.log('Contains viz-:', data.article_markdown?.includes('viz-'))
  
  if (data.article_markdown) {
     fs.writeFileSync('debug_topic_10.md', data.article_markdown)
  }
}

debug()
