const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

function cleanDescription(html) {
  if (!html) return ''
  
  return html
    // Remove MathJax preview and element frames
    .replace(/<span class="MathJax_Preview".*?<\/span>/g, '')
    .replace(/<span class="MathJax".*?<\/span>/g, '')
    .replace(/<div class="MathJax_Display".*?<\/div>/g, '')
    .replace(/<script type="math\/tex" id="MathJax-Element-\d+">([\s\S]*?)<\/script>/g, (match, tex) => `$${tex.trim()}$`)
    .replace(/<script type="math\/tex; mode=display" id="MathJax-Element-\d+">([\s\S]*?)<\/script>/g, (match, tex) => `\n\n$$${tex.trim()}$$\n\n`)
    // Remove other assistive mathml
    .replace(/<span class="MJX_Assistive_MathML".*?<\/span>/g, '')
    // Cleanup multiple spaces and newlines
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function auditAndFix() {
  console.log('--- Starting Data Audit & Fix ---')
  
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, title, description')

  if (error) {
    console.error('Error fetching problems:', error)
    return
  }

  console.log(`Found ${problems.length} problems.`)

  for (const p of problems) {
    const cleanedDesc = cleanDescription(p.description)
    
    if (cleanedDesc !== p.description) {
      console.log(`Fixing description for: ${p.title}`)
      const { error: updateError } = await supabase
        .from('problems')
        .update({ description: cleanedDesc })
        .eq('id', p.id)
      
      if (updateError) {
        console.error(`Failed to update ${p.id}:`, updateError)
      } else {
        console.log(`✓ Updated ${p.id}`)
      }
    }
  }
  
  console.log('--- Audit & Fix Complete ---')
}

auditAndFix()
