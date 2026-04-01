import type { PassiveModule, ModuleResult } from '@/types';

export const dns: PassiveModule = {
  name: 'dns',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'dns' } };
  },
};
