import type { ActiveModule, ModuleResult } from '@/types';

export const robots: ActiveModule = {
  name: 'robots',
  async run(target: string): Promise<ModuleResult> {
    return { success: true, data: { target, module: 'robots' } };
  },
};
