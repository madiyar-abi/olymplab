const fs = require('fs');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

function parseAlgorithmicaArticle(htmlString){
  const $ = cheerio.load(htmlString, { decodeEntities: false });
  // Normalize: remove zero-width spaces, NBSP issues
  $('*').each((i,el)=>{
    if(el.type==='text') return;
    // Remove empty attributes that may cause rendering issues
  });

  // Fix problematic inline tags that may break flow: unwrap <span> that are purely styling but keep inline code
  $('span').each((i,el)=>{
    const $el = $(el);
    // If span has no block children and only text or inline code/kbd, keep it; else leave
    const hasBlock = $el.children().filter((i,ch)=>['P','DIV','TABLE','PRE','BLOCKQUOTE','UL','OL','LI','H1','H2','H3','H4'].includes(ch.tagName)).length>0;
    if(!hasBlock){
      // replace span with its contents but keep markup
      $el.replaceWith($el.html());
    }
  });

  // Remove empty elements
  const removeEmpty = ()=>{
    $('p,div,section').each((i,el)=>{
      const txt = $(el).text().replace(/\s+/g,'').trim();
      if(txt==='') $(el).remove();
    });
  };
  removeEmpty();

  const turndown = new TurndownService({ codeBlockStyle: 'fenced' });

  // Custom rule for kbd, code (not in pre), span to be inline code without surrounding newlines
  turndown.addRule('inlineCodeLike', {
    filter: function(node){
      return (node.nodeName === 'KBD' || node.nodeName === 'CODE' || node.nodeName === 'SPAN');
    },
    replacement: function(content, node){
      // if code inside pre, skip (let default handle)
      let cur = node; while(cur){ if(cur.nodeName==='PRE') return content; cur = cur.parentNode; }
      // normalize content: collapse whitespace
      const txt = content.replace(/\s+/g,' ');
      return '`'+txt+'`';
    }
  });

  // Ensure turndown doesn't add extra newlines around inline elements: we will post-process
  let md = turndown.turndown($.html());

  // Post-processing: remove empty blocks and collapse multiple newlines
  // Also fix cases where punctuation like ':' is separated by spaces/newlines from preceding word
  md = md.replace(/[ \t\u00A0]+\n/g,'\n');
  // Collapse 3+ newlines to 2
  md = md.replace(/\n{3,}/g,'\n\n');
  // Remove empty lines (lines with only spaces)
  md = md.split('\n').map(l=>l.replace(/^[ \t\u00A0]+|[ \t\u00A0]+$/g,''))
           .filter((l,i,arr)=>{ // keep paragraph separators
             if(l===''){
               // allow single empty line as paragraph break
               const prev = arr[i-1];
               const next = arr[i+1];
               return false;
             }
             return true;
           }).join('\n');

  // Fix dangling punctuation: ensure punctuation stays attached to previous word, remove space before punctuation/newline
  md = md.replace(/\s+([,:;.!?])+/g,'$1');
  // Ensure space before inline code is preserved
  md = md.replace(/(\S)(`)/g, '$1 $2');
  // fix backticks separated by spaces from text
  md = md.replace(/`\s+/g,'`').replace(/\s+`/g,'`');
  // Trim
  md = md.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g,'');
  return md;
}

// Self-test on mock HTML (autonomous)
const mock = `<!doctype html><html><body>
<article>
<p>Рассмотрим задачу, которая возникает каждый раз, когда вы делаете <kbd>ctrl+f</kbd> :</p>
<p>Another line with <span class="inline">inline span</span> and <code>code</code>.</p>
<div><p> </p></div>
</article>
</body></html>`;
const out = parseAlgorithmicaArticle(mock);
console.log('---OUTPUT---');
console.log(out);
// Save for inspection
fs.writeFileSync('parsed_mock.md', out, 'utf8');

module.exports = { parseAlgorithmicaArticle };
