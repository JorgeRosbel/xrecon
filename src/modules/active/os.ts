import { exec } from 'child_process';
import { promisify } from 'util';
import type { ActiveModule, ModuleResult } from '@/types';

const execAsync = promisify(exec);

export interface OSResult {
  os: string;
  ttl: number;
  evidence: string;
}

function detectOSFromTTL(ttl: number): string {
  if (ttl <= 64) return 'Linux/Unix';
  if (ttl <= 128) return 'Windows';
  if (ttl <= 255) return 'Unix/Solaris/AIX';
  return 'Unknown';
}

export const os: ActiveModule = {
  name: 'os',
  async run(target: string): Promise<ModuleResult<OSResult>> {
    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0];

      const { stdout } = await execAsync(`ping -c 1 -W 5 ${hostname}`, {
        timeout: 10000,
      });

      const ttlMatch = stdout.match(/ttl=(\d+)/i);
      if (!ttlMatch) {
        return { success: false, error: 'Could not extract TTL from ping response' };
      }

      const ttl = parseInt(ttlMatch[1], 10);
      const detectedOS = detectOSFromTTL(ttl);

      return {
        success: true,
        data: {
          os: detectedOS,
          ttl,
          evidence: `TTL=${ttl} (typical range: Linux/Unix=64, Windows=128, Solaris/AIX=254)`,
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
