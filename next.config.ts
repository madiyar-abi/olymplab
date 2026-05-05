import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
