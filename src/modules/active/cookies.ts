import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { ActiveModule, ModuleResult } from '@/types';

export interface CookieResult {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  expires: number;
}

export const cookies: ActiveModule = {
  name: 'cookies',
  async run(target: string): Promise<ModuleResult<CookieResult[]>> {
    let browser: Browser | null = null;

    try {
      const fullUrl =
        target.startsWith('http://') || target.startsWith('https://')
          ? target
          : `https://${target}`;

      browser = await chromium.launch({ headless: true });
      const context: BrowserContext = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page: Page = await context.newPage();
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });

      const browserCookies = await context.cookies();

      const result: CookieResult[] = browserCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite || 'None',
        expires: cookie.expires ?? -1,
      }));

      await context.close();
      await browser.close();

      if (result.length === 0) {
        return { success: false, error: 'No cookies found' };
      }

      return { success: true, data: result };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
