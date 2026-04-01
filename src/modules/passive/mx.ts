import type { PassiveModule, ModuleResult } from '@/types';

export const mx: PassiveModule = {
  name: 'mx',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'mx' } };
  },
};
