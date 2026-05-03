const fs=require('fs');
let s=fs.readFileSync('parse_algorithmica.js','utf8');
// remove the two backtick-trimming replacements if present
s = s.replace("  md = md.replace(/\\s+`/g,'`').replace(/`\\s+/g,'`');\n  // Trim","  // Trim");
// insert space-preserving rule after punctuation fix
s = s.replace("md = md.replace(/\\s+([,:;.!?])+/g,'$1');","md = md.replace(/\\s+([,:;.!?])+/g,'$1');\n  // Ensure space before inline code is preserved\n  md = md.replace(/(\\S)(`)/g, '$1 $2');");
fs.writeFileSync('parse_algorithmica.js',s,'utf8');
console.log('edited');
