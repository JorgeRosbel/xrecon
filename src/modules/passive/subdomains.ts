import type { PassiveModule, ModuleResult } from '@/types';

export const subdomains: PassiveModule = {
  name: 'subdomains',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'subdomains' } };
  },
};
