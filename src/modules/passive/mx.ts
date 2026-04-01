import dns from 'dns';
import { promisify } from 'util';
import type { PassiveModule, ModuleResult } from '@/types';

const resolveMx = promisify(dns.resolveMx);

export interface MxResult {
  preference: number;
  mail_server: string;
}

export const mx: PassiveModule = {
  name: 'mx',
  async run(target: string): Promise<ModuleResult<MxResult[]>> {
    try {
      const domain = target.replace(/^https?:\/\//, '').split('/')[0];
      const answers = await resolveMx(domain);
      return {
        success: true,
        data: answers.map(r => ({
          preference: r.priority,
          mail_server: r.exchange,
        })),
      };
    } catch {
      return { success: false, error: 'No MX records found' };
    }
  },
};
