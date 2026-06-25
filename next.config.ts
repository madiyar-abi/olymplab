import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Pin the workspace root. A stray lockfile in a parent directory makes
  // Turbopack mis-infer the root, which breaks the dev proxy/middleware edge
  // bundle ("adapterFn is not a function"). `process.cwd()` is the project dir
  // under `next dev` / `next build`.
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: [
    'jsdom',
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth',
    'cheerio'
  ],
};

export default withNextIntl(nextConfig);
