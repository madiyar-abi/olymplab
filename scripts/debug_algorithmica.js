const cheerio = require('cheerio');
const TurndownService = require('turndown');

const sampleHtml = `
<article>
<p>Рассмотрим задачу, которая возникает каждый раз, когда вы делаете <code>ctrl+f</code>:</p>
<blockquote><p>Есть большой текст $t$. Нужно найти все вхождения строки $s$ в него.</p></blockquote>
<p>Наивное решение со сравнением всех подстрок $t$ длины $|s|$ со строкой $s$ работает за $O(|t| \\cdot |s|)$. Если текст большой, то длинные слова в нем искать становится очень долго.</p>
</article>
`;

function buildTurndown() {
    const td = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        fence: '```',
    });

    // Handle code blocks correctly
    td.addRule('fenced-code-block', {
        filter: node => node.nodeName === 'PRE',
        replacement: (content, node) => {
            const code = node.querySelector('code');
            const text = code ? code.textContent : node.textContent;
            return '\n\n```cpp\n' + text.trim() + '\n```\n\n';
        }
    });

    // Ensure inline code stays inline
    td.addRule('inline-code', {
        filter: node => node.nodeName === 'CODE' && node.parentNode.nodeName !== 'PRE',
        replacement: (content) => '`' + content.trim() + '`'
    });

    return td;
}

const td = buildTurndown();
const $ = cheerio.load(sampleHtml);
const content = $('article').html();
let markdown = td.turndown(content);

console.log('--- MARKDOWN ---');
console.log(markdown);
console.log('--- END ---');
