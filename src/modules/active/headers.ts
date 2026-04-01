import axios from 'axios';
import type { ActiveModule, ModuleResult, HeadersResult } from '@/types';

const IMPORTANT_HEADERS = [
  'server',
  'x-powered-by',
  'content-type',
  'content-length',
  'set-cookie',
  'cache-control',
  'etag',
  'x-frame-options',
  'x-xss-protection',
  'strict-transport-security',
];

export const headers: ActiveModule = {
  name: 'headers',
  async run(target: string): Promise<ModuleResult<HeadersResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];

      let response;
      try {
        response = await axios.head(`https://${hostname}`, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch {
        response = await axios.head(`http://${hostname}`, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      const headersObj = response.headers;
      const result: string[] = [];

      for (const key of IMPORTANT_HEADERS) {
        const value = headersObj[key.toLowerCase()] || headersObj[key];
        if (value) {
          result.push(`${key}: ${value}`);
        }
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
