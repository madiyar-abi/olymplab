const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
let SUPABASE_URL, SUPABASE_SERVICE_KEY;

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/);
    if (match) {
      if (match[1] === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (match[1] === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_SERVICE_KEY = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data, error } = await supabase.from('problems').select('id, title, external_id, description').limit(10);
  if (error) {
    console.error(error);
    return;
  }
  data.forEach(p => {
    console.log('---');
    console.log('ID:', p.id);
    console.log('Title:', p.title);
    console.log('External ID:', p.external_id);
    console.log('Description (first 200 chars):', p.description.substring(0, 200));
  });
}

main();
