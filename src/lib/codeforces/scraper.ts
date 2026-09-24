import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as cheerio from 'cheerio'
import { createTurndownService } from '@/lib/converter'
import type { Browser } from 'puppeteer'

puppeteerExtra.use(StealthPlugin())

let cachedBrowser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser
  }
  cachedBrowser = (await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })) as unknown as Browser
  return cachedBrowser
}

export function parseCfProblemIdentifier(
  externalId?: string | null,
  cfId?: string | null,
  title?: string | null
): { contestId: string; index: string } | null {
  if (externalId) {
    const m = String(externalId).match(/^cf-(\d+)\/([A-Za-z0-9]+)$/)
    if (m) return { contestId: m[1], index: m[2] }
    const m2 = String(externalId).match(/^cf-(\d+)([A-Za-z0-9]+)$/)
    if (m2) return { contestId: m2[1], index: m2[2] }
  }
  if (cfId) {
    const m = String(cfId).match(/^(\d+)([A-Za-z0-9]+)$/)
    if (m) return { contestId: m[1], index: m[2] }
  }
  if (title) {
    const m = String(title).match(/\[CF\]\s*(\d+)([A-Za-z0-9]+)/i)
    if (m) return { contestId: m[1], index: m[2] }
  }
  return null
}

export const parseCfExternalId = parseCfProblemIdentifier

export interface ScrapedCfProblem {
  titleRu: string
  descriptionRu: string
  sampleInput: string | null
  sampleOutput: string | null
}

export async function scrapeCodeforcesProblemRu(
  contestId: string,
  index: string
): Promise<ScrapedCfProblem | null> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1280, height: 800 })
    const urls = [
      `https://codeforces.com/contest/${contestId}/problem/${index}?locale=ru`,
      `https://codeforces.com/problemset/problem/${contestId}/${index}?locale=ru`,
    ]

    let html = ''
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 })
        await page.waitForSelector('.problem-statement', { timeout: 15000 })
        html = await page.content()
        break
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[CF Scraper] Failed to load ${url}:`, msg.slice(0, 80))
      }
    }

    if (!html) return null

    const $ = cheerio.load(html)
    const $ps = $('.problem-statement')
    if (!$ps.length) return null

    // Extract sample tests properly preserving newlines
    function extractSample(selector: string): string | null {
      const $pre = $(selector).first()
      if (!$pre.length) return null
      const lineDivs = $pre.find('.test-example-line')
      if (lineDivs.length > 0) {
        return lineDivs.map((_, el) => $(el).text()).get().join('\n').trim()
      }
      const $clone = $pre.clone()
      $clone.find('br').replaceWith('\n')
      $clone.find('div, p').each((_, el) => {
        $(el).prepend('\n')
      })
      return $clone.text().replace(/\r\n/g, '\n').replace(/\n\n+/g, '\n').trim() || null
    }

    const sampleInput = extractSample('.sample-test .input pre')
    const sampleOutput = extractSample('.sample-test .output pre')

    // Clean title (remove "D. ")
    let titleRu = $ps.find('.title').first().text().replace(/^[A-Z]\d*\.\s*/, '').trim()
    if (titleRu && !titleRu.startsWith('[CF]')) {
      titleRu = `[CF] ${titleRu}`
    }

    // Convert MathJax script tags to tex spans
    $ps.find('script[type="math/tex"]').each((_, el) => {
      const tex = $(el).text().trim()
      $(el).replaceWith(`<span class="tex-span">${tex}</span>`)
    })
    $ps.find('script[type="math/tex; mode=display"]').each((_, el) => {
      const tex = $(el).text().trim()
      $(el).replaceWith(`<div class="tex-graphics" alt="${tex}"></div>`)
    })
    $ps.find('.MathJax_Preview, .MathJax, .MathJax_Display, .MJX_Assistive_MathML, .MathJax_SVG').remove()
    $ps.find('.header, .sample-tests, .sample-test, .input-file, .output-file, .property-title').remove()

    const td = createTurndownService()
    const descriptionRu = td.turndown($ps.html() || '').trim()

    return {
      titleRu,
      descriptionRu,
      sampleInput,
      sampleOutput,
    }
  } catch (err) {
    console.error(`[CF Scraper] Error scraping cf-${contestId}/${index}:`, err)
    return null
  } finally {
    try {
      await page.close()
    } catch {}
  }
}
