const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(__dirname, '../.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach(line => {
  const m = line.match(/^([^#\s]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  const { data: tp, error } = await supabase
    .from('topic_problems')
    .select('*')
    .eq('source', 'codeforces')

  if (error) {
    console.error(error)
    return
  }

  const missing = tp.filter(p => !p.problem_id)
  console.log(`Total CF problems: ${tp.length}`)
  console.log(`Missing internal problem_id: ${missing.length}`)
  
  if (missing.length > 0) {
      console.log('Sample missing:', missing[0].title, missing[0].url)
  }
}

check()
