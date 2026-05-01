import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('problems')
    .select('title')
    .or("title.ilike.Problem %,description.ilike.Just a moment%");
  
  if (error) {
    console.error(error);
    return;
  }

  const codes = data.map(p => {
    const match = p.title.match(/Problem (\d+[A-Z]\d*)/i);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (codes.length === 0) {
    console.log('No broken problems found!');
  } else {
    console.log('\nFound ' + codes.length + ' broken problems.');
    console.log('Run this command to fix them all:\n');
    console.log('node scripts/ingest_cf.js ' + codes.join(' '));
  }
}
main();
