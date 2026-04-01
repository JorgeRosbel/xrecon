import type { PassiveModule, ModuleResult } from '@/types';

export const whois: PassiveModule = {
  name: 'whois',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'whois' } };
  },
};
