const fs=require('fs');
let s=fs.readFileSync('parse_algorithmica.js','utf8');
const old='  // fix backticks separated by spaces from text\n  md = md.replace(/`\\s+/g,`\'\'`).replace(/\\s+`/g,`\'\'`);\n';
// Old exact may not match due to escaping; do simpler removal of the pattern
s = s.replace(/\n  \/\/ fix backticks[\s\S]*?\n  md = md.replace\(/, '\n  md = md.replace(');
// Also remove the specific replace chain if exists
s = s.replace(/\n  md = md.replace\(/`\\s\+`/g,'');
fs.writeFileSync('parse_algorithmica.js',s,'utf8');
console.log('attempted edits');
