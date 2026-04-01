import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

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
  async run(_target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<CookieResult[]>> {
    try {
      const context = sharedData?.browserContext;
      if (!context) {
        return { success: false, error: 'Browser context not available' };
      }

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

      if (result.length === 0) {
        return { success: false, error: 'No cookies found' };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
