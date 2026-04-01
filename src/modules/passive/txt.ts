import type { PassiveModule, ModuleResult } from '@/types';

export const txt: PassiveModule = {
  name: 'txt',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'txt' } };
  },
};
