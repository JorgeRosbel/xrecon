import dns from 'dns';
import { promisify } from 'util';
import type { PassiveModule, ModuleResult } from '@/types';

const resolveTxt = promisify(dns.resolveTxt);

export const txt: PassiveModule = {
  name: 'txt',
  async run(target: string): Promise<ModuleResult<string[]>> {
    try {
      const domain = target.replace(/^https?:\/\//, '').split('/')[0];
      const answers = await resolveTxt(domain);
      const records = answers.flat();
      return {
        success: true,
        data: records.length > 0 ? records : [],
      };
    } catch {
      return { success: false, error: 'No TXT records found' };
    }
  },
};
