import axios from 'axios';
import type { ActiveModule, ModuleResult, SecurityResult } from '@/types';

const HEADERS_TO_CHECK = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

export const security: ActiveModule = {
  name: 'security',
  async run(target: string): Promise<ModuleResult<SecurityResult>> {
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

      const headers = response.headers;
      const result: string[] = [];

      for (const header of HEADERS_TO_CHECK) {
        const value = headers[header.toLowerCase()] || headers[header];
        if (value) {
          result.push(`[PASS] ${header}`);
        } else {
          result.push(`[FAIL] ${header}`);
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
