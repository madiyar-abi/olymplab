const cheerio = require('cheerio');
const TurndownService = require('turndown');
const fs = require('fs');

function createParser() {
    const td = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        fence: '```'
    });

    // --- Custom Rules ---

    // 1. Hard-enforce inline code and kbd to be inline
    td.addRule('inline-code', {
        filter: (node) => (node.nodeName === 'CODE' || node.nodeName === 'KBD') && node.parentNode.nodeName !== 'PRE',
        replacement: (content) => {
            const trimmed = content.trim();
            if (!trimmed) return '';
            return '`' + trimmed + '`';
        }
    });

    // 2. Fenced code blocks
    td.addRule('fenced-code-block', {
        filter: (node) => node.nodeName === 'PRE',
        replacement: (content, node) => {
            const codeEl = node.querySelector('code');
            const text = codeEl ? codeEl.textContent : node.textContent;
            const langMatch = (node.className || '').match(/language-(\w+)/) || 
                              (codeEl?.className || '').match(/language-(\w+)/) ||
                              (node.className || '').match(/chroma/); // Algorithmica uses chroma
            const lang = langMatch ? (langMatch[1] === 'chroma' ? 'cpp' : langMatch[1]) : 'cpp';
            return '\n\n```' + lang + '\n' + text.trim() + '\n```\n\n';
        }
    });

    // 3. Admonitions / Blocks
    // Algorithmica uses blockquote for problem statements and sometimes divs for notes.
    td.addRule('blockquote', {
        filter: 'blockquote',
        replacement: (content) => {
            const lines = content.trim().split('\n');
            const quoted = lines.map(line => '> ' + line).join('\n');
            return '\n\n' + quoted + '\n\n';
        }
    });

    // 4. Remove anchors and hidden links
    td.addRule('remove-anchors', {
        filter: (node) => {
            return (node.nodeName === 'A' && (node.classList.contains('anchor-link') || node.textContent === '#')) ||
                   (node.nodeName === 'SPAN' && node.classList.contains('anchor'));
        },
        replacement: () => ''
    });

    return td;
}

function parseAlgorithmica(html) {
    if (!html) return '';
    const $ = cheerio.load(html);

    // 1. Isolate Content
    const article = $('article');
    if (!article.length) return 'Error: No <article> found';

    // 2. Pre-clean DOM
    article.find('.anchor, .anchor-link, script, style, .header-anchor, .prev-next, .nextprev').remove();
    
    let articleHtml = article.html();
    
    // Use markers that Turndown is less likely to mangle, or handle the mangling
    // We'll use custom tags which Turndown will treat as unknown and keep or we can handle
    articleHtml = articleHtml.replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (m, p1) => `<displaymath>${p1.trim()}</displaymath>`);
    articleHtml = articleHtml.replace(/(?<!\$)\$([^\$]+?)\$(?!\$)/g, (m, p1) => `<inlinemath>${p1.trim()}</inlinemath>`);

    // 3. Convert to Markdown
    const parser = createParser();
    
    // Add rules for our custom tags
    parser.addRule('protected-inline-math', {
        filter: 'inlinemath',
        replacement: (content) => '$' + content.trim() + '$'
    });
    parser.addRule('protected-display-math', {
        filter: 'displaymath',
        replacement: (content) => '\n\n$$\n' + content.trim() + '\n$$\n\n'
    });

    let markdown = parser.turndown(articleHtml);

    // 4. Post-process
    markdown = markdown
        // Normalize whitespace (including non-breaking spaces)
        .replace(/[\u00a0\u1680​\u180e\u2000-\u200a\u2028\u2029\u202f\u205f​\u3000\ufeff]/g, ' ')
        // Unescape standard markdown characters and hyphen
        .replace(/\\([!\[\]()_*`~-])/g, '$1')
        // Collapse multiple newlines (3+ -> 2)
        .replace(/\n{3,}/g, '\n\n')
        // Fix weird spacing around inline code added by Turndown
        .replace(/\s+(`[^`]+`)\s+/g, ' $1 ')
        .replace(/\s+(`[^`]+`)([:.,!?])/g, ' $1$2')
        // Ensure colons after code are attached
        .replace(/(`[^`]+`)\s+:/g, '$1:')
        .trim();

    return markdown;
}

module.exports = { parseAlgorithmica };

if (require.main === module) {
    // Test against the sample
    const filename = process.argv[2] || 'scripts/sample.html';
    const html = fs.readFileSync(filename, 'utf8');
    const md = parseAlgorithmica(html);

    console.log('=== RESULTING MARKDOWN ===');
    console.log(md);
    console.log('==========================');

    // Verification
    const testPhrase = 'Рассмотрим задачу, которая возникает каждый раз, когда вы делаете `ctrl+f`:';
    if (filename === 'scripts/sample.html') {
        if (md.includes(testPhrase)) {
            console.log('✅ TEST PASSED: Inline phrase is intact.');
        } else {
            console.log('❌ TEST FAILED: Inline phrase is broken or missing.');
        }
    }

    const newlineCheck = md.match(/\n{3,}/);
    if (!newlineCheck) {
        console.log('✅ TEST PASSED: No excessive newlines.');
    } else {
        console.log('❌ TEST FAILED: Found excessive newlines.');
    }
}
