import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium, type Browser, type Page } from 'playwright';
import https from 'https';
import type { SharedHtmlData } from '@/types';

export interface GetHtmlOptions {
  insecure?: boolean;
}

async function fetchWithPlaywright(url: string): Promise<{ html: string; url: string }> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page: Page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const html = await page.content();
    const finalUrl = page.url();

    await context.close();
    await browser.close();

    return { html, url: finalUrl };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

function detectDynamicPage($: cheerio.CheerioAPI): boolean {
  const hasHtmlContent = $('html').length > 0 && $('body').length > 0;
  const bodyText = $('body').text().trim();
  const scriptCount = $('script').length;
  const hasAngularReactVue =
    $('script[src*="angular"]').length > 0 ||
    $('script[src*="react"]').length > 0 ||
    $('script[src*="vue"]').length > 0 ||
    $('[ng-app]').length > 0 ||
    $('[data-reactroot]').length > 0 ||
    $('[v-app]').length > 0;

  const hasFrameworkIndicators =
    $('div[id*="app"]').length > 0 ||
    $('div[id*="root"]').length > 0 ||
    $('div[class*="app"]').length > 0 ||
    $('div[class*="root"]').length > 0;

  const isEmptyOrMinimal = !hasHtmlContent || bodyText.length < 50;

  const hasManyScripts = scriptCount > 10;

  return (
    !hasHtmlContent ||
    isEmptyOrMinimal ||
    hasFrameworkIndicators ||
    hasAngularReactVue ||
    hasManyScripts
  );
}

export async function getHtml(url: string, options: GetHtmlOptions = {}): Promise<SharedHtmlData> {
  const { insecure = true } = options;

  try {
    const httpsAgent = insecure ? new https.Agent({ rejectUnauthorized: false }) : undefined;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      maxRedirects: 5,
      validateStatus: status => status !== 404,
      httpsAgent,
    });

    let html = typeof response.data === 'string' ? response.data : '';
    let finalUrl = response.request?.responseURL || url;

    const $ = cheerio.load(html);
    const isDynamic = detectDynamicPage($);

    if (isDynamic) {
      try {
        const playwrightResult = await fetchWithPlaywright(finalUrl);
        html = playwrightResult.html;
        finalUrl = playwrightResult.url;
      } catch {
        console.error(
          '\n⚠ Warning: Dynamic content unavailable. Run "npx playwright install" to enable full scanning of dynamic sites.\n'
        );
      }
    }

    const final$ = cheerio.load(html);
    const finalIsDynamic = detectDynamicPage(final$);

    return {
      $: final$,
      html,
      url: finalUrl,
      isDynamic: finalIsDynamic,
    };
  } catch {
    throw new Error(`Failed to fetch HTML from ${url}`);
  }
}
