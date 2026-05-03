/**
 * apply_migration.js
 * Applies the level column migration via Supabase's rpc/postgres REST endpoint.
 * Run: node scripts/apply_migration.js
 */
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

async function applyMigration() {
  console.log('🔧 Applying migration: add level column...')

  const sql = `ALTER TABLE public.roadmap_topics ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'beginner';`

  const { data, error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    // Fallback: try raw SQL via direct fetch
    console.warn('rpc exec_sql not available, trying direct REST...')
    console.error('Error:', error.message)
    console.log('\n📋 Please run this SQL manually in the Supabase Dashboard > SQL Editor:')
    console.log('─'.repeat(70))
    console.log(sql)
    console.log('─'.repeat(70))
    console.log('\nThen re-run: node scripts/seed_roadmap.js')
    return
  }

  console.log('✅ Migration applied!')
}

applyMigration()
