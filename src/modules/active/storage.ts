import type { ActiveModule, ModuleResult, SharedHtmlData } from '@/types';

interface StorageItem {
  key: string;
  value: string;
}

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface StorageResult {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
  jwtTokens: {
    key: string;
    storage: 'localStorage' | 'sessionStorage';
    decoded: DecodedJwt | null;
  }[];
}

function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    return {
      header,
      payload,
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

export const storage: ActiveModule = {
  name: 'storage',
  async run(_target: string, sharedData?: SharedHtmlData): Promise<ModuleResult<StorageResult>> {
    try {
      const context = sharedData?.browserContext;
      if (!context) {
        return { success: false, error: 'Browser context not available' };
      }

      const pages = context.pages();
      if (pages.length === 0) {
        return { success: false, error: 'No pages available in browser context' };
      }

      const page = pages[0];

      const localStorageData = await page.evaluate(() => {
        const items: Array<{ key: string; value: string }> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items.push({ key, value: localStorage.getItem(key) || '' });
          }
        }
        return items;
      });

      const sessionStorageData = await page.evaluate(() => {
        const items: Array<{ key: string; value: string }> = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            items.push({ key, value: sessionStorage.getItem(key) || '' });
          }
        }
        return items;
      });

      const jwtPattern = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
      const jwtTokens: StorageResult['jwtTokens'] = [];

      for (const item of localStorageData) {
        if (jwtPattern.test(item.value)) {
          jwtTokens.push({
            key: item.key,
            storage: 'localStorage',
            decoded: decodeJwt(item.value),
          });
        }
      }

      for (const item of sessionStorageData) {
        if (jwtPattern.test(item.value)) {
          jwtTokens.push({
            key: item.key,
            storage: 'sessionStorage',
            decoded: decodeJwt(item.value),
          });
        }
      }

      if (localStorageData.length === 0 && sessionStorageData.length === 0) {
        return { success: false, error: 'No storage data found' };
      }

      return {
        success: true,
        data: {
          localStorage: localStorageData,
          sessionStorage: sessionStorageData,
          jwtTokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`.slice(0, 50),
      };
    }
  },
};
