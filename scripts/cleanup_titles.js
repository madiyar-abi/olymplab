const { createClient } = require('@supabase/supabase-client')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function cleanup() {
  const { data: problems } = await supabase.from('problems').select('id, title, description')
  for (const p of problems) {
    let newTitle = p.title.replace(/\[CSES\]\s*\[CSES\]/g, '[CSES]').replace(/\[CSES\]\s+\[CSES\]/g, '[CSES]').trim()
    let newDesc = p.description.replace(/\\le/g, '\le').replace(/\\ge/g, '\ge').replace(/\\times/g, '\times').replace(/\\/g, '')
    
    if (newTitle !== p.title || newDesc !== p.description) {
      await supabase.from('problems').update({ title: newTitle, description: newDesc }).eq('id', p.id)
      console.log(`✅ Cleaned: ${newTitle}`)
    }
  }
}
cleanup()
