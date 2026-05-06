import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
