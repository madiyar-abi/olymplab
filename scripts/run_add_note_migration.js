const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🔧 Adding note column to problems table...')
  const sql = `ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS note TEXT;`
  
  const { error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    console.error('Error applying migration via RPC:', error.message)
    console.log('Falling back to manual instruction...')
    console.log('Please run this in Supabase SQL Editor:')
    console.log(sql)
  } else {
    console.log('✅ Migration applied successfully!')
  }
}

runMigration()
