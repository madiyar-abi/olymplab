
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const id = 'dbcc994f-ce10-4d06-be55-8f5ce6798003'
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)

  console.log('Data:', JSON.stringify(data, null, 2))
  console.log('Error:', error)
}

check()
