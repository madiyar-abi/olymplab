import TurndownService from 'turndown'

/**
 * createTurndownService
 * ──────────────────────
 * Configures Turndown with specific rules for competitive programming platforms.
 */
export function createTurndownService() {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    bulletListMarker: '-',
  })

  // 1. Rule for Codeforces inline formulas (tex-span)
  turndownService.addRule('cf-inline-math', {
    filter: (node) => node.nodeName === 'SPAN' && (node.classList.contains('tex-span') || node.classList.contains('tex-formula')),
    replacement: (content, node) => {
      const raw = node.textContent || ''
      // If it already has delimiters, don't add them
      if (raw.trim().startsWith('$') && raw.trim().endsWith('$')) return raw.trim()
      return `$${raw.trim()}$`
    }
  })

  // 2. Rule for Codeforces block formulas / graphics
  turndownService.addRule('cf-block-math', {
    filter: (node) => 
      (node.nodeName === 'IMG' && (node.classList.contains('tex-graphics') || node.getAttribute('src')?.includes('equation'))) ||
      (node.nodeName === 'DIV' && node.classList.contains('tex-graphics')),
    replacement: (content, node) => {
      const alt = (node as HTMLElement).getAttribute('alt') || ''
      const raw = node.textContent || ''
      const tex = (alt || raw).trim()
      if (tex) {
        if (tex.startsWith('$$') && tex.endsWith('$$')) return `\n\n${tex}\n\n`
        return `\n\n$$${tex}$$\n\n`
      }
      return ''
    }
  })

  // 3. Rule for monospace text (code)
  turndownService.addRule('cf-monospace', {
    filter: (node) => node.nodeName === 'SPAN' && node.classList.contains('tex-font-style-tt'),
    replacement: (content, node) => {
      const raw = node.textContent || ''
      return ` \`${raw.trim()}\` `
    }
  })

  // 4. Absolute image paths and basic formatting
  turndownService.addRule('cf-images', {
    filter: (node) => node.nodeName === 'IMG' && !node.classList.contains('tex-graphics'),
    replacement: (content, node) => {
      let src = (node as HTMLElement).getAttribute('src') || ''
      if (src.startsWith('/')) src = 'https://codeforces.com' + src
      else if (src.startsWith('//')) src = 'https:' + src
      const alt = (node as HTMLElement).getAttribute('alt') || ''
      return `\n\n![${alt}](${src})\n\n`
    }
  })

  // 5. Cleanup for common CP platform artifacts
  turndownService.addRule('strip-artifacts', {
    filter: (node: HTMLElement) => node.nodeName === 'CENTER' || node.nodeName === 'FONT',
    replacement: (content) => `\n\n${content}\n\n`
  })

  // 6. Support for subscripts and superscripts (common in math)
  turndownService.addRule('subscript', {
    filter: ['sub'],
    replacement: (content) => `~${content}~`
  })

  turndownService.addRule('superscript', {
    filter: ['sup'],
    replacement: (content) => `^${content}^`
  })

  // 7. Handle tables (basic support)
  turndownService.addRule('table', {
    filter: ['table'],
    replacement: (content) => `\n\n${content}\n\n`
  })

  turndownService.addRule('table-row', {
    filter: ['tr'],
    replacement: (content) => `| ${content}\n`
  })

  turndownService.addRule('table-cell', {
    filter: ['td', 'th'],
    replacement: (content) => `${content.replace(/\n/g, ' ')} | `
  })

  return turndownService
}

const defaultService = createTurndownService()

/**
 * htmlToMarkdown
 * ──────────────
 * Converts raw HTML string to clean, LaTeX-compatible Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  
  // Basic pre-cleaning of the HTML string
  const processedHtml = html
    .replace(/<span class="MathJax_Preview".*?<\/span>/g, '')
    .replace(/<div class="MathJax_Display".*?<\/div>/g, '')
    // Handle MathJax scripts if they are still there
    .replace(/<script type="math\/tex">(.*?)<\/script>/g, (_, tex) => `$${tex}$`)
    .replace(/<script type="math\/tex; mode=display">(.*?)<\/script>/g, (_, tex) => `\n\n$$${tex}$$\n\n`)
  
  let markdown = defaultService.turndown(processedHtml)

  // Post-processing cleanup
  markdown = markdown
    // Remove multiple empty lines
    .replace(/\n{3,}/g, '\n\n')
    // Fix escaped LaTeX characters that Turndown might have escaped
    .replace(/\\([_$#%&])/g, '$1')
    // Fix common CSES math patterns if they are not wrapped
    .replace(/\\le(?![^$]*\$)/g, '$\\le$')
    .replace(/\\ge(?![^$]*\$)/g, '$\\ge$')
    .replace(/\\times(?![^$]*\$)/g, '$\\times$')
    .replace(/\\dots(?![^$]*\$)/g, '$\\dots$')
    .replace(/\\dots(?![^$]*\$)/g, '$\\dots$')
    .replace(/\\log(?![^$]*\$)/g, '$\\log$')
    .replace(/\\min(?![^$]*\$)/g, '$\\min$')
    .replace(/\\max(?![^$]*\$)/g, '$\\max$')
    .trim()

  return markdown
}
